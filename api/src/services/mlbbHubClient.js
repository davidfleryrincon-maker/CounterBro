const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://mlbbhub.com/heroes';

const ALL_HEROES_URL = BASE_URL;
const LANE_URLS = {
  gold: BASE_URL + '?lane=Gold',
  exp: BASE_URL + '?lane=EXP',
  mid: BASE_URL + '?lane=Mid',
  jungle: BASE_URL + '?lane=Jungle',
  roam: BASE_URL + '?lane=Roam'
};

let lastGoodData = null;
let lastSyncAt = 0;

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function cleanName(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function nameFromSlug(slug) {

  const especiales = {
    "x-borg": "X.Borg",
    "chang-e": "Chang'e",
    "popol-and-kupa": "Popol and Kupa",
    "yi-sun-shin": "Yi Sun-shin",
    "luo-yi": "Luo Yi"
  };

  if (especiales[slug]) {
    return especiales[slug];
  }

  return slug
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function addHero(map, slug, name) {
  const cleanSlug = decodeURIComponent(String(slug || ''))
    .replace(/^\/+|\/+$/g, '')
    .trim()
    .toLowerCase();

  if (!cleanSlug || cleanSlug === 'heroes') return;

  const cleanHeroName = cleanName(name) || nameFromSlug(cleanSlug);

  if (
    cleanHeroName &&
    cleanHeroName.length <= 50 &&
    !/^(build|counter|heroes)$/i.test(cleanHeroName)
  ) {
    map.set(cleanSlug, cleanHeroName);
  }
}

function extractHeroes(html) {
  const $ = cheerio.load(html);
  const heroes = new Map();

  /*
    MLBBHub puede renderizar los héroes como enlaces normales
    o dentro de payloads/HTML generados por el framework.

    Por eso usamos ambas fuentes:
    1. enlaces reales /heroes/...
    2. referencias /heroes/slug encontradas en el HTML bruto.
  */

  $('a[href*="/heroes/"]').each((_, element) => {
    const href = $(element).attr('href') || '';
    const match = href.match(/\/heroes\/([^/?#"'<>]+)/i);

    if (!match) return;

    addHero(
      heroes,
      match[1],
      cleanName($(element).text())
    );
  });

  const rawMatches = String(html || '').matchAll(
    /\/heroes\/([a-z0-9%._'-]+)(?=[/?#"'<>\\])/gi
  );

  for (const match of rawMatches) {
    addHero(
      heroes,
      match[1],
      ''
    );
  }

  return Array.from(heroes.values());
}

async function fetchPage(url) {
  const response = await axios.get(url, {
    timeout: 15000,
    headers: {
      'User-Agent':
        'CounterBro/1.0 (+https://github.com/davidfleryrincon-maker/CounterBro)',
      'Accept':
        'text/html,application/xhtml+xml'
    }
  });

  return response.data;
}

async function fetchLane(lane) {
  const html = await fetchPage(LANE_URLS[lane]);
  const heroes = extractHeroes(html);

  if (heroes.length < 5) {
    throw new Error(
      'MLBBHub devolvió muy pocos héroes para ' +
      lane +
      ': ' +
      heroes.length
    );
  }

  return heroes;
}

async function fetchAllHeroes() {
  const html = await fetchPage(ALL_HEROES_URL);
  const heroes = extractHeroes(html);

  if (heroes.length < 50) {
    throw new Error(
      'MLBBHub devolvió muy pocos héroes en la lista general: ' +
      heroes.length
    );
  }

  return heroes;
}

async function fetchLiveHeroesFromMLBBHub() {
  const now = Date.now();

  if (
    lastGoodData &&
    now - lastSyncAt < CACHE_TTL_MS
  ) {
    return lastGoodData;
  }

  try {
    /*
      Cargamos la lista general y las cinco líneas en paralelo.
      La lista general es la fuente principal para reconocer héroes
      nuevos como Hirara. Las líneas aportan la validación posicional.
    */
    const [allHeroesResult, ...laneResults] =
      await Promise.allSettled([
        fetchAllHeroes(),
        ...Object.keys(LANE_URLS).map(
          lane => fetchLane(lane)
        )
      ]);

    if (allHeroesResult.status !== 'fulfilled') {
      throw allHeroesResult.reason;
    }

    const heroesFromAll = allHeroesResult.value;
    const lanes = {};

    Object.keys(LANE_URLS).forEach(
      (lane, index) => {
        const result = laneResults[index];

        lanes[lane] =
          result.status === 'fulfilled'
            ? result.value
            : [];

        if (result.status !== 'fulfilled') {
          console.warn(
            'MLBBHub: no fue posible sincronizar la línea ' +
            lane +
            '.',
            result.reason?.message || result.reason
          );
        }
      }
    );

    const allHeroes = Array.from(
      new Set([
        ...heroesFromAll,
        ...Object.values(lanes).flat()
      ])
    ).sort((a, b) => a.localeCompare(b));

    if (allHeroes.length < 50) {
      throw new Error(
        'Sincronización inválida: solo se detectaron ' +
        allHeroes.length +
        ' héroes.'
      );
    }

    const data = {
      heroes: allHeroes,
      lanes,
      source: 'MLBBHub',
      syncedAt: new Date().toISOString(),
      partial: Object.values(lanes).some(
        heroes => heroes.length === 0
      )
    };

    lastGoodData = data;
    lastSyncAt = now;

    return data;
  } catch (error) {
    if (lastGoodData) {
      console.warn(
        'MLBBHub no disponible. Usando última sincronización válida.'
      );

      return lastGoodData;
    }

    throw error;
  }
}

module.exports = {
  fetchLiveHeroesFromMLBBHub
};
