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
  const especiales = {
    "x-borg": "X.Borg",
    "chang-e": "Chang'e",
    "lapu-lapu": "Lapu-Lapu",
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

function extractLaneKeysFromStructuredData(html) {
  const $ = cheerio.load(html);
  const candidates = [];

  function addCandidate(value) {
    if (typeof value === 'string') {
      candidates.push(value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(addCandidate);
    }
  }

  function inspectObject(value, depth = 0) {
    if (
      value === null ||
      typeof value !== 'object' ||
      depth > 6
    ) {
      return;
    }

    Object.entries(value).forEach(
      ([key, child]) => {
        const normalizedKey =
          String(key || '').toLowerCase();

        if (
          normalizedKey === 'lane' ||
          normalizedKey === 'lanes'
        ) {
          addCandidate(child);
        }

        if (
          child &&
          typeof child === 'object'
        ) {
          inspectObject(
            child,
            depth + 1
          );
        }
      }
    );
  }

  $('script').each(
    (_, element) => {
      const scriptText =
        $(element).text();

      if (!scriptText) {
        return;
      }

      try {
        const parsed =
          JSON.parse(scriptText);

        inspectObject(parsed);
      } catch {
        const matches =
          scriptText.matchAll(
            /"(?:lane|lanes)"\\s*:\\s*(?:"((?:\\\\.|[^"])*)"|\\[([^\\]]*)\\])/gi
          );

        for (const match of matches) {
          if (match[1]) {
            candidates.push(
              match[1]
                .replace(
                  /\\\"/g,
                  '"'
                )
                .replace(
                  /\\\\/g,
                  '\\'
                )
            );
          }

          if (match[2]) {
            candidates.push(
              match[2]
            );
          }
        }
      }
    }
  );

  return Array.from(
    new Set(
      candidates
        .flatMap(
          candidate =>
            extractLaneKeysFromText(
              candidate
            )
        )
    )
  );
}

function extractLaneKeys(html) {
  const structuredLanes =
    extractLaneKeysFromStructuredData(
      html
    );

  if (structuredLanes.length > 0) {
    return structuredLanes;
  }

  const $ = cheerio.load(html);
  const candidates = [];

  $('body *').each(
    (_, element) => {
      const label =
        cleanName(
          $(element).clone()
            .children()
            .remove()
            .end()
            .text()
        );

      if (!/^Lane$/i.test(label)) {
        return;
      }

      const parent =
        $(element).parent();

      const siblingText =
        parent
          .children()
          .map(
            (_, child) =>
              cleanName(
                $(child).text()
              )
          )
          .get()
          .filter(Boolean)
          .join(' ');

      const parentText =
        cleanName(
          parent.text()
        );

      const grandParentText =
        cleanName(
          parent.parent().text()
        );

      [
        siblingText,
        parentText,
        grandParentText
      ].forEach(
        candidate => {
          if (
            candidate &&
            candidate.length <= 180
          ) {
            candidates.push(
              candidate
            );
          }
        }
      );
    }
  );

  const directLaneCandidates =
    candidates
      .map(
        candidate => ({
          candidate,
          lanes:
            extractLaneKeysFromText(
              candidate
            )
        })
      )
      .filter(
        item =>
          item.lanes.length > 0
      )
      .sort(
        (a, b) =>
          a.candidate.length -
          b.candidate.length
      );

  if (
    directLaneCandidates.length > 0
  ) {
    return Array.from(
      new Set(
        directLaneCandidates[0].lanes
      )
    );
  }

  const bodyText =
    cleanName(
      $('body').text()
    );

  const laneFieldMatch =
    bodyText.match(
      /\bLane\b([^]{0,140})/i
    );

  if (laneFieldMatch) {
    return Array.from(
      new Set(
        extractLaneKeysFromText(
          laneFieldMatch[1]
        )
      )
    );
  }

  return [];
}

async function fetchHeroLanes(entry) {
  const html =
    await fetchPage(
      `${BASE_URL}/${entry.slug}`
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
