const axios = require('axios');

const BASE_URL =
  'https://arena.rone.dev/api';

const REQUEST_TIMEOUT = 15000;

const LANE_KEYS = [
  'exp',
  'mid',
  'gold',
  'jungle',
  'roam'
];

let heroCatalogPromise = null;
let laneCatalogPromise = null;

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
  return Array.isArray(
    response?.data?.records
  )
    ? response.data.records
    : [];
}

async function request(path, params = {}) {
  const response =
    await axios.get(
      BASE_URL + path,
      {
        params,
        timeout: REQUEST_TIMEOUT,
        headers: {
          'User-Agent':
            'CounterBro/2.1 (+https://github.com/davidfleryrincon-maker/CounterBro)',
          'Accept':
            'application/json'
        }
      }
    );

  const payload =
    response?.data;

  if (
    payload?.code !== undefined &&
    Number(payload.code) !== 0
  ) {
    throw new Error(
      'Rone Arena respondió con código ' +
      payload.code +
      ': ' +
      (
        payload.message ||
        'error desconocido'
      )
    );
  }

  return payload;
}

/*
  Rone documenta /api/academy/heroes como
  una respuesta sencilla:

  data.records[].data.hero_id
  data.records[].data.hero.data.name

  Usamos este endpoint para el catálogo porque
  no necesitamos depender de estructuras de posición
  para reconocer un héroe.
*/
function transformarHeroAcademy(record) {
  const data =
    record?.data || {};

  const heroId =
    Number(data.hero_id);

  const name =
    cleanName(
      data?.hero?.data?.name
    );

  if (
    !Number.isFinite(heroId) ||
    !name
  ) {
    return null;
  }

  return {
    id: heroId,
    name
  };
}

async function fetchHeroCatalog() {
  const response =
    await request(
      '/academy/heroes',
      {
        size: 200,
        index: 1,
        order: 'asc',
        lang: 'en'
      }
    );

  const heroes =
    extractRecords(response)
      .map(
        transformarHeroAcademy
      )
      .filter(Boolean);

  if (heroes.length < 50) {
    throw new Error(
      'Rone Arena devolvió solo ' +
      heroes.length +
      ' héroes en /academy/heroes.'
    );
  }

  const unique =
    new Map();

  heroes.forEach(hero => {
    unique.set(
      hero.id,
      hero
    );
  });

  return Array.from(
    unique.values()
  );
}

async function getHeroCatalog() {
  if (!heroCatalogPromise) {
    heroCatalogPromise =
      fetchHeroCatalog()
        .catch(error => {
          heroCatalogPromise = null;
          throw error;
        });
  }

  return heroCatalogPromise;
}

async function fetchHeroesForLane(lane) {
  const response =
    await request(
      '/academy/heroes',
      {
        lane,
        size: 200,
        index: 1,
        order: 'asc',
        lang: 'en'
      }
    );

  return extractRecords(response)
    .map(
      transformarHeroAcademy
    )
    .filter(Boolean);
}

async function fetchLaneCatalog() {
  const entries =
    await Promise.all(
      LANE_KEYS.map(
        async lane => ({
          lane,
          heroes:
            await fetchHeroesForLane(
              lane
            )
        })
      )
    );

  const lanes = {
    exp: [],
    mid: [],
    gold: [],
    jungle: [],
    roam: []
  };

  entries.forEach(
    ({ lane, heroes }) => {
      lanes[lane] =
        Array.from(
          new Set(
            heroes.map(
              hero => hero.name
            )
          )
        ).sort(
          (a, b) =>
            a.localeCompare(b)
        );
    }
  );

  for (const lane of LANE_KEYS) {
    if (
      lanes[lane].length < 5
    ) {
      throw new Error(
        'Rone Arena devolvió solo ' +
        lanes[lane].length +
        ' héroes para ' +
        lane +
        '.'
      );
    }
  }

  return lanes;
}

async function getLaneCatalog() {
  if (!laneCatalogPromise) {
    laneCatalogPromise =
      fetchLaneCatalog()
        .catch(error => {
          laneCatalogPromise = null;
          throw error;
        });
  }

  return laneCatalogPromise;
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
        hero =>
          hero.id === numericId
      );

    if (byId) {
      return byId;
    }
  }

  return (
    heroes.find(
      hero =>
        normalizeName(
          hero.name
        ) === normalized
    ) || null
  );
}

async function fetchHeroCounters(
  heroIdentifier
) {
  const identifier =
    cleanName(heroIdentifier);

  if (!identifier) {
    throw new Error(
      'Rone Arena requiere un identificador de héroe.'
    );
  }

  /*
    Rone documenta explícitamente que los nombres de héroe
    funcionan como identificadores y que la comparación
    ignora mayúsculas, espacios y símbolos.

    Usamos primero el endpoint principal documentado.
    El endpoint Academy queda como respaldo por compatibilidad.
  */
  const endpoints = [
    {
      path:
        '/heroes/' +
        encodeURIComponent(identifier) +
        '/counters',
      params: {
        days: 7,
        rank: 'all',
        size: 200,
        index: 1,
        lang: 'en'
      }
    },
    {
      path:
        '/academy/heroes/' +
        encodeURIComponent(identifier) +
        '/counters',
      params: {
        rank: 'all',
        size: 200,
        index: 1,
        lang: 'en'
      }
    }
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response =
        await request(
          endpoint.path,
          endpoint.params
        );

      const records =
        extractRecords(response);

      if (records.length > 0) {
        return records;
      }

      lastError =
        new Error(
          'Rone Arena no devolvió registros en ' +
          endpoint.path
        );

    } catch (error) {
      lastError = error;
    }
  }

  const detail =
    lastError?.message
      ? ' ' + lastError.message
      : '';

  throw new Error(
    'No fue posible obtener counters de Rone Arena para "' +
    identifier +
    '".' +
    detail
  );
}

async function fetchFreshHeroesFromRoneArena() {
  const [
    heroes,
    lanes
  ] = await Promise.all([
    getHeroCatalog(),
    getLaneCatalog()
  ]);

  return {
    heroes:
      heroes
        .map(hero => hero.name)
        .sort(
          (a, b) =>
            a.localeCompare(b)
        ),

    lanes,

    source:
      'Rone Arena',

    syncedAt:
      new Date().toISOString()
  };
}

module.exports = {
  getHeroCatalog,
  getHeroByIdentifier,
  fetchHeroCounters,
  fetchFreshHeroesFromRoneArena
};
