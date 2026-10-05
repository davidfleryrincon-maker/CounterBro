const axios = require('axios');

const BASE_URL = 'https://arena.rone.dev/api';

const REQUEST_TIMEOUT = 12000;
const RETRIES = 2;

const LANE_KEYS = [
  'exp',
  'mid',
  'gold',
  'jungle',
  'roam'
];

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

function extractRecords(payload) {
  return Array.isArray(payload?.data?.records)
    ? payload.data.records
    : [];
}

function isRetryable(error) {
  const status = error?.response?.status;

  return (
    !status ||
    status === 408 ||
    status === 425 ||
    status === 429 ||
    status >= 500
  );
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function request(path, params = {}) {
  let lastError = null;

  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    try {
      const response = await axios.get(
        BASE_URL + path,
        {
          params,
          timeout: REQUEST_TIMEOUT,
          headers: {
            Accept: 'application/json',
            'User-Agent':
              'CounterBro/3.0 (+https://github.com/davidfleryrincon-maker/CounterBro)'
          },
          validateStatus: status => status >= 200 && status < 300
        }
      );

      const payload = response.data;

      if (
        payload?.code !== undefined &&
        Number(payload.code) !== 0
      ) {
        const error = new Error(
          'Rone Arena code ' +
          payload.code +
          ': ' +
          (payload.message || 'error desconocido')
        );

        error.roneCode = payload.code;
        error.roneMessage = payload.message || null;

        throw error;
      }

      return payload;

    } catch (error) {
      lastError = error;

      if (
        attempt >= RETRIES ||
        !isRetryable(error)
      ) {
        break;
      }

      await sleep(700 * attempt);
    }
  }

  throw lastError;
}

/*
  Una sola llamada a /heroes/positions nos da:
  - ID
  - nombre
  - posiciones/líneas

  Esto reemplaza las cinco llamadas paralelas que
  CounterBro hacía anteriormente.

  Rone documenta /api/heroes/positions como el endpoint
  para filtrar héroes por posición y devuelve roadsort
  dentro del héroe.
*/
function laneKeyFromValue(value) {
  const text = normalizeName(value);

  if (!text) return null;

  if (
    text.includes('jungle') ||
    text.includes('jungler')
  ) {
    return 'jungle';
  }

  if (
    text.includes('roam') ||
    text.includes('roamer')
  ) {
    return 'roam';
  }

  if (
    text.includes('gold') ||
    text.includes('goldlane')
  ) {
    return 'gold';
  }

  if (
    text === 'mid' ||
    text.includes('midlane') ||
    text.includes('middle')
  ) {
    return 'mid';
  }

  if (
    text.includes('exp') ||
    text.includes('explane')
  ) {
    return 'exp';
  }

  return null;
}

function extractLaneKeys(heroRecord) {
  const roadsort =
    heroRecord?.data?.hero?.data?.roadsort;

  if (!Array.isArray(roadsort)) {
    return [];
  }

  const lanes = new Set();

  roadsort.forEach(item => {
    const data = item?.data || {};

    [
      data.road_sort_title,
      item?.caption,
      data.road_sort_id
    ].forEach(value => {
      const lane = laneKeyFromValue(value);

      if (lane) {
        lanes.add(lane);
      }
    });
  });

  return Array.from(lanes);
}

function transformHeroPosition(record) {
  const data = record?.data || {};
  const hero = data?.hero?.data || {};

  const id = Number(data.hero_id);
  const name = cleanName(hero.name);

  if (!Number.isFinite(id) || !name) {
    return null;
  }

  return {
    id,
    name,
    lanes: extractLaneKeys(record)
  };
}

async function fetchHeroPositions() {
  const response = await request(
    '/heroes/positions',
    {
      size: 200,
      index: 1,
      order: 'asc',
      lang: 'en'
    }
  );

  const heroes = extractRecords(response)
    .map(transformHeroPosition)
    .filter(Boolean);

  if (heroes.length < 50) {
    throw new Error(
      'Rone Arena devolvió solo ' +
      heroes.length +
      ' héroes en /heroes/positions.'
    );
  }

  const unique = new Map();

  heroes.forEach(hero => {
    unique.set(hero.id, hero);
  });

  return Array.from(unique.values());
}

async function getHeroCatalog() {
  if (!heroCatalogPromise) {
    heroCatalogPromise = fetchHeroPositions()
      .catch(error => {
        heroCatalogPromise = null;
        throw error;
      });
  }

  return heroCatalogPromise;
}

function buildLaneCatalog(heroes) {
  const lanes = {
    exp: [],
    mid: [],
    gold: [],
    jungle: [],
    roam: []
  };

  heroes.forEach(hero => {
    hero.lanes.forEach(lane => {
      if (lanes[lane]) {
        lanes[lane].push(hero.name);
      }
    });
  });

  LANE_KEYS.forEach(lane => {
    lanes[lane] = Array.from(
      new Set(lanes[lane])
    ).sort((a, b) => a.localeCompare(b));
  });

  return lanes;
}

async function fetchFreshHeroesFromRoneArena() {
  const heroes = await getHeroCatalog();
  const lanes = buildLaneCatalog(heroes);

  const missingLanes = LANE_KEYS.filter(
    lane => lanes[lane].length < 5
  );

  /*
    Algunas versiones del origen pueden no exponer
    roadsort completo. En ese caso no rompemos todo
    el catálogo: usamos el fallback local desde api/index.js.
  */
  if (missingLanes.length > 0) {
    throw new Error(
      'Rone Arena no devolvió posiciones suficientes para: ' +
      missingLanes.join(', ')
    );
  }

  return {
    heroes: heroes
      .map(hero => hero.name)
      .sort((a, b) => a.localeCompare(b)),

    lanes,

    source: 'Rone Arena',

    syncedAt: new Date().toISOString()
  };
}

async function fetchHeroCounters(heroIdentifier) {
  const identifier = cleanName(heroIdentifier);

  if (!identifier) {
    throw new Error(
      'Rone Arena requiere un héroe.'
    );
  }

  /*
    UNA sola consulta por matchup.
    Rone documenta que el nombre funciona como
    identificador: miya, Miya o 1 son equivalentes.
  */
  const response = await request(
    '/heroes/' +
      encodeURIComponent(identifier) +
      '/counters',
    {
      days: 7,
      rank: 'all',
      size: 200,
      index: 1,
      lang: 'en'
    }
  );

  const records = extractRecords(response);

  if (records.length === 0) {
    throw new Error(
      'Rone Arena no devolvió counters para "' +
      identifier +
      '".'
    );
  }

  return records;
}

async function getHeroByIdentifier(identifier) {
  const heroes = await getHeroCatalog();
  const normalized = normalizeName(identifier);

  const numericId = Number(identifier);

  if (
    Number.isFinite(numericId) &&
    String(identifier).trim() !== ''
  ) {
    const byId = heroes.find(
      hero => hero.id === numericId
    );

    if (byId) return byId;
  }

  return (
    heroes.find(
      hero =>
        normalizeName(hero.name) === normalized
    ) || null
  );
}

module.exports = {
  getHeroCatalog,
  getHeroByIdentifier,
  fetchHeroCounters,
  fetchFreshHeroesFromRoneArena
};
