const axios = require('axios');

const BASE_URL = 'https://arena.rone.dev/api';
const REQUEST_TIMEOUT = 15000;

const LANE_KEYS = new Set([
  'exp',
  'mid',
  'gold',
  'jungle',
  'roam'
]);

let heroCatalogPromise = null;

function cleanName(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeName(value) {
  return cleanName(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function extractRecords(response) {
  return Array.isArray(response?.data?.data?.records)
    ? response.data.data.records
    : [];
}

async function request(path, params = {}) {
  const response = await axios.get(
    BASE_URL + path,
    {
      params,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'User-Agent':
          'CounterBro/2.0 (+https://github.com/davidfleryrincon-maker/CounterBro)',
        'Accept':
          'application/json'
      }
    }
  );

  if (
    response?.data?.code !== undefined &&
    Number(response.data.code) !== 0
  ) {
    throw new Error(
      'Rone Arena respondió con código ' +
      response.data.code +
      ': ' +
      (response.data.message || 'error desconocido')
    );
  }

  return response.data;
}

function detectarLanes(record) {
  const roadsort =
    record?.data?.hero?.data?.roadsort;

  if (!Array.isArray(roadsort)) {
    return [];
  }

  const lanes = new Set();

  roadsort.forEach(item => {
    if (!item || typeof item !== 'object') {
      return;
    }

    const data = item.data || {};

    [
      data.road_sort_title,
      item.caption
    ].forEach(value => {
      const texto = cleanName(value).toLowerCase();

      if (/\bexp\b/.test(texto)) lanes.add('exp');
      if (/\bmid\b/.test(texto)) lanes.add('mid');
      if (/\bgold\b/.test(texto)) lanes.add('gold');
      if (/\bjungle|jungler\b/.test(texto)) lanes.add('jungle');
      if (/\broam|roamer\b/.test(texto)) lanes.add('roam');
    });
  });

  return Array.from(lanes);
}

function transformarHero(record) {
  const data = record?.data || {};
  const heroData = data?.hero?.data || {};

  const heroId =
    Number(data.hero_id ?? heroData.heroid);

  const name =
    cleanName(heroData.name);

  if (
    !Number.isFinite(heroId) ||
    !name
  ) {
    return null;
  }

  return {
    id: heroId,
    name,
    lanes: detectarLanes(record)
  };
}

async function fetchHeroCatalog() {
  const response =
    await request(
      '/heroes/positions',
      {
        size: 200,
        index: 1,
        order: 'asc',
        lang: 'en'
      }
    );

  const heroes =
    extractRecords(response)
      .map(transformarHero)
      .filter(Boolean);

  if (heroes.length < 50) {
    throw new Error(
      'Rone Arena devolvió muy pocos héroes: ' +
      heroes.length
    );
  }

  return heroes;
}

async function getHeroCatalog() {
  if (!heroCatalogPromise) {
    heroCatalogPromise =
      fetchHeroCatalog().catch(error => {
        heroCatalogPromise = null;
        throw error;
      });
  }

  return heroCatalogPromise;
}

async function getHeroByIdentifier(identifier) {
  const heroes =
    await getHeroCatalog();

  const normalized =
    normalizeName(identifier);

  const numericId =
    Number(identifier);

  if (
    Number.isFinite(numericId) &&
    String(identifier).trim() !== ''
  ) {
    const byId =
      heroes.find(
        hero => hero.id === numericId
      );

    if (byId) {
      return byId;
    }
  }

  return (
    heroes.find(
      hero =>
        normalizeName(hero.name) ===
        normalized
    ) || null
  );
}

async function fetchHeroCounters(heroIdentifier) {
  const response =
    await request(
      '/academy/heroes/' +
      encodeURIComponent(heroIdentifier) +
      '/counters',
      {
        rank: 'all',
        size: 200,
        index: 1,
        lang: 'en'
      }
    );

  return extractRecords(response);
}

async function fetchFreshHeroesFromRoneArena() {
  const heroes =
    await getHeroCatalog();

  const lanes = {
    exp: [],
    mid: [],
    gold: [],
    jungle: [],
    roam: []
  };

  heroes.forEach(hero => {
    hero.lanes.forEach(lane => {
      if (
        LANE_KEYS.has(lane) &&
        !lanes[lane].includes(hero.name)
      ) {
        lanes[lane].push(hero.name);
      }
    });
  });

  const validHeroes =
    heroes.map(hero => hero.name);

  for (const lane of Object.keys(lanes)) {
    lanes[lane].sort(
      (a, b) => a.localeCompare(b)
    );

    if (lanes[lane].length < 5) {
      throw new Error(
        'Rone Arena no devolvió suficientes héroes para ' +
        lane +
        ': ' +
        lanes[lane].length
      );
    }
  }

  return {
    heroes:
      Array.from(new Set(validHeroes))
        .sort((a, b) => a.localeCompare(b)),
    lanes,
    source: 'Rone Arena',
    syncedAt: new Date().toISOString()
  };
}

module.exports = {
  getHeroCatalog,
  getHeroByIdentifier,
  fetchHeroCounters,
  fetchFreshHeroesFromRoneArena
};
