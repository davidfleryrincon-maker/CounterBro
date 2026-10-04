const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL =
  'https://mlbbhub.com/heroes';

const HERO_PAGE_CONCURRENCY = 8;

const LANE_KEYS = {
  gold: /\bGold(?:\s+Lane)?\b/i,
  exp: /\bEXP(?:\s+Lane)?\b/i,
  mid: /\bMid(?:\s+Lane)?\b/i,
  jungle: /\b(?:Jungle|Jungler)\b/i,
  roam: /\b(?:Roam|Roamer)\b/i
};

function cleanName(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function nameFromSlug(slug) {
  const compactSlug =
    slug.replace(
      /[^a-z0-9]/g,
      ''
    );

  const especiales = {
    xborg: "X.Borg",
    change: "Chang'e",
    lapulapu: "Lapu-Lapu",
    popolandkupa: "Popol and Kupa",
    yisunshin: "Yi Sun-shin",
    luoyi: "Luo Yi"
  };

  if (especiales[compactSlug]) {
    return especiales[compactSlug];
  }

  return slug
    .split('-')
    .filter(Boolean)
    .map(
      part =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(' ');
}

function addHero(
  map,
  slug,
  name
) {
  const cleanSlug =
    decodeURIComponent(
      String(slug || '')
    )
      .replace(
        /^\/+|\/+$/g,
        ''
      )
      .trim()
      .toLowerCase();

  if (
    !cleanSlug ||
    cleanSlug === 'heroes' ||
    /^opengraph-image/i.test(cleanSlug)
  ) {
    return;
  }

  const cleanHeroName =
    cleanName(name) ||
    nameFromSlug(cleanSlug);

  if (
    cleanHeroName &&
    cleanHeroName.length <= 50 &&
    !/^(build|counter|heroes)$/i.test(
      cleanHeroName
    )
  ) {
    map.set(
      cleanSlug,
      cleanHeroName
    );
  }
}

function extractHeroEntries(html) {
  const $ = cheerio.load(html);
  const heroes = new Map();

  $('a[href*="/heroes/"]').each(
    (_, element) => {
      const href =
        $(element).attr('href') || '';

      const match =
        href.match(
          /\/heroes\/([^/?#"'<>]+)/i
        );

      if (!match) {
        return;
      }

      addHero(
        heroes,
        match[1],
        cleanName(
          $(element).text()
        )
      );
    }
  );

  const rawMatches =
    String(html || '').matchAll(
      /\/heroes\/([a-z0-9%._'-]+)(?=[/?#"'<>\\])/gi
    );

  for (const match of rawMatches) {
    addHero(
      heroes,
      match[1],
      ''
    );
  }

  return Array.from(
    heroes.entries()
  ).map(
    ([slug, name]) => ({
      slug,
      name
    })
  );
}

function extractHeroes(html) {
  return extractHeroEntries(html).map(
    entry => entry.name
  );
}

async function fetchPage(url) {
  const response =
    await axios.get(
      url,
      {
        timeout: 15000,
        headers: {
          'User-Agent':
            'CounterBro/1.0 (+https://github.com/davidfleryrincon-maker/CounterBro)',
          'Accept':
            'text/html,application/xhtml+xml'
        }
      }
    );

  return response.data;
}

function extractLaneKeysFromText(text) {
  const normalized =
    cleanName(text);

  if (!normalized) {
    return [];
  }

  const lanes = [];

  Object.entries(
    LANE_KEYS
  ).forEach(
    ([lane, pattern]) => {
      if (pattern.test(normalized)) {
        lanes.push(lane);
      }
    }
  );

  return lanes;
}

function extractLaneKeys(html) {
  const source =
    String(html || '');

  const tierMatches =
    source.matchAll(
      /\bTier\b/gi
    );

  for (const match of tierMatches) {
    const startIndex =
      match.index;

    if (
      typeof startIndex !== 'number'
    ) {
      continue;
    }

    let block =
      source.slice(
        startIndex,
        startIndex + 1200
      );

    const endMatch =
      block.match(
        /\b(?:Specialty|Especialidad|Difficulty|Dificultad)\b/i
      );

    if (endMatch) {
      block =
        block.slice(
          0,
          endMatch.index
        );
    }

    const text =
      cleanName(
        block
          .replace(
            /<[^>]+>/g,
            ' '
          )
          .replace(
            /&amp;/gi,
            '&'
          )
          .replace(
            /&nbsp;/gi,
            ' '
          )
      );

    const laneFieldMatch =
      text.match(
        /\bLane\b\s+([^]{1,120})/i
      );

    if (laneFieldMatch) {
      const lanes =
        extractLaneKeysFromText(
          laneFieldMatch[1]
        );

      if (lanes.length > 0) {
        return lanes;
      }
    }

    const lanes =
      extractLaneKeysFromText(
        text
      );

    if (lanes.length > 0) {
      return lanes;
    }
  }

  return [];
}

async function fetchHeroLanes(entry) {
  const html =
    await fetchPage(
      BASE_URL + '/' + entry.slug
    );

  const lanes =
    extractLaneKeys(html);

  if (lanes.length === 0) {
    throw new Error(
      'No se pudo detectar la línea de ' +
      entry.name +
      ' en su página de MLBBHub.'
    );
  }

  return {
    ...entry,
    lanes
  };
}

async function mapWithConcurrency(
  items,
  limit,
  worker
) {
  const results =
    new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (true) {
      const index =
        nextIndex++;

      if (
        index >= items.length
      ) {
        return;
      }

      results[index] =
        await worker(
          items[index],
          index
        );
    }
  }

  const workerCount =
    Math.min(
      limit,
      items.length
    );

  await Promise.all(
    Array.from(
      {
        length: workerCount
      },
      () => runWorker()
    )
  );

  return results;
}

async function fetchAllHeroes() {
  const html =
    await fetchPage(
      BASE_URL
    );

  const entries =
    extractHeroEntries(html);

  if (entries.length < 50) {
    throw new Error(
      'MLBBHub devolvió muy pocos héroes en la lista general: ' +
      entries.length
    );
  }

  return entries;
}

async function fetchFreshHeroesFromMLBBHub() {
  const entries =
    await fetchAllHeroes();

  const laneEntries =
    await mapWithConcurrency(
      entries,
      HERO_PAGE_CONCURRENCY,
      entry =>
        fetchHeroLanes(entry)
    );

  const lanes = {
    gold: [],
    exp: [],
    mid: [],
    jungle: [],
    roam: []
  };

  laneEntries.forEach(
    entry => {
      entry.lanes.forEach(
        lane => {
          if (
            lanes[lane]
          ) {
            lanes[lane].push(
              entry.name
            );
          }
        }
      );
    }
  );

  Object.keys(
    lanes
  ).forEach(
    lane => {
      lanes[lane] =
        Array.from(
          new Set(
            lanes[lane]
          )
        ).sort(
          (a, b) =>
            a.localeCompare(b)
        );

      if (
        lanes[lane].length < 5
      ) {
        throw new Error(
          'Sincronización incompleta para ' +
          lane +
          ': solo se detectaron ' +
          lanes[lane].length +
          ' héroes.'
        );
      }

      if (
        lanes[lane].length >=
        heroes.length * 0.8
      ) {
        throw new Error(
          'Sincronización inválida para ' +
          lane +
          ': proporción anormal de héroes.'
        );
      }
    }
  );

  const heroes =
    Array.from(
      new Set(
        entries.map(
          entry => entry.name
        )
      )
    ).sort(
      (a, b) =>
        a.localeCompare(b)
    );

  if (heroes.length < 50) {
    throw new Error(
      'Sincronización inválida: solo se detectaron ' +
      heroes.length +
      ' héroes.'
    );
  }

  return {
    heroes,
    lanes,
    source: 'MLBBHub',
    syncedAt:
      new Date().toISOString(),
    partial: false
  };
}

async function fetchLiveHeroesFromMLBBHub() {
  return fetchFreshHeroesFromMLBBHub();
}

module.exports = {
  fetchFreshHeroesFromMLBBHub,
  fetchLiveHeroesFromMLBBHub
};
