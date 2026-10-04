const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://mlbbhub.com/heroes';

const LANE_URLS = {
  gold: `${BASE_URL}?lane=Gold`,
  exp: `${BASE_URL}?lane=EXP`,
  mid: `${BASE_URL}?lane=Mid`,
  jungle: `${BASE_URL}?lane=Jungle`,
  roam: `${BASE_URL}?lane=Roam`
};

let lastGoodData = null;
let lastSyncAt = 0;

const CACHE_TTL_MS = 30 * 60 * 1000;

function cleanName(value) {
  return String(value || '')
    .replace(/\\s+/g, ' ')
    .trim();
}

function nameFromSlug(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function extractHeroes(html) {
  const $ = cheerio.load(html);
  const heroes = new Map();

  $('a[href*="/heroes/"]').each((_, element) => {
    const href = $(element).attr('href') || '';
    const match = href.match(/\/heroes\/([^/?#]+)/);

    if (!match) return;

    const slug = decodeURIComponent(match[1]).trim();

    if (!slug || slug === 'heroes') return;

    const text = cleanName($(element).text());
    const name = text || nameFromSlug(slug);

    if (name && name.length <= 40) {
      heroes.set(slug.toLowerCase(), name);
    }
  });

  return Array.from(heroes.values());
}

async function fetchLane(lane) {
  const response = await axios.get(LANE_URLS[lane], {
    timeout: 15000,
    headers: {
      'User-Agent': 'CounterBro/1.0 (+https://github.com/davidfleryrincon-maker/CounterBro)',
      'Accept': 'text/html,application/xhtml+xml'
    }
  });

  const heroes = extractHeroes(response.data);

  if (heroes.length < 5) {
    throw new Error(`MLBBHub devolvió muy pocos héroes para ${lane}: ${heroes.length}`);
  }

  return heroes;
}

async function fetchLiveHeroesFromMLBBHub() {
  const now = Date.now();

  if (lastGoodData && now - lastSyncAt < CACHE_TTL_MS) {
    return lastGoodData;
  }

  try {
    const lanes = {};

    for (const lane of Object.keys(LANE_URLS)) {
      lanes[lane] = await fetchLane(lane);
    }

    const allHeroes = Array.from(
      new Set(Object.values(lanes).flat())
    ).sort((a, b) => a.localeCompare(b));

    if (allHeroes.length < 50) {
      throw new Error(`Sincronización inválida: solo se detectaron ${allHeroes.length} héroes.`);
    }

    const data = {
      heroes: allHeroes,
      lanes,
      source: 'MLBBHub',
      syncedAt: new Date().toISOString()
    };

    lastGoodData = data;
    lastSyncAt = now;

    return data;
  } catch (error) {
    if (lastGoodData) {
      console.warn('MLBBHub no disponible. Usando última sincronización válida.');
      return lastGoodData;
    }

    throw error;
  }
}

module.exports = {
  fetchLiveHeroesFromMLBBHub
};
