const {
  getHeroCatalog,
  fetchHeroCounters
} = require('./roneArenaClient');

function cleanName(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function formatPercentagePoints(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;

  const percentagePoints = numeric * 100;

  return (
    (percentagePoints >= 0 ? '+' : '') +
    percentagePoints.toFixed(1) +
    ' pp'
  );
}

function getCounterRows(records) {
  const rows = [];

  records.forEach(record => {
    const data = record?.data || {};

    if (!Array.isArray(data.sub_hero)) return;

    data.sub_hero.forEach(counter => {
      const heroId = Number(counter?.heroid);
      const edge = Number(counter?.increase_win_rate);
      const heroWinRate = Number(counter?.hero_win_rate);

      if (!Number.isFinite(heroId) || !Number.isFinite(edge)) {
        return;
      }

      rows.push({
        heroId,
        edge,
        heroWinRate: Number.isFinite(heroWinRate) ? heroWinRate : null
      });
    });
  });

  const unique = new Map();

  rows.forEach(row => {
    const previous = unique.get(row.heroId);
    if (!previous || row.edge > previous.edge) {
      unique.set(row.heroId, row);
    }
  });

  return Array.from(unique.values());
}

function getTargetName(records, fallback) {
  for (const record of records) {
    const name = cleanName(record?.data?.main_hero?.data?.name);
    if (name) return name;
  }

  return fallback;
}

async function getCounters(hero, lane) {
  const requestedHero = cleanName(hero);

  if (!requestedHero) {
    throw new Error('No se recibió un héroe para consultar.');
  }

  // Rone acepta directamente el nombre del héroe como identificador.
  // Evitamos una llamada previa al catálogo para resolver "Miya" -> 1.
  const records = await fetchHeroCounters(requestedHero);
  const rows = getCounterRows(records);

  if (rows.length === 0) {
    throw new Error(
      'Rone Arena no devolvió counters utilizables para ' + requestedHero + '.'
    );
  }

  const catalog = await getHeroCatalog();
  const namesById = new Map(
    catalog.map(item => [item.id, item.name])
  );

  const counters = rows
    .map(row => {
      const name = namesById.get(row.heroId);
      if (!name) return null;

      const winRate = formatPercentagePoints(row.edge);
      if (!winRate) return null;

      return {
        name,
        winRate,
        edge: row.edge * 100,
        heroWinRate: row.heroWinRate,
        reason: 'Ventaja estadística del matchup según Rone Arena.'
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.edge - a.edge)
    .slice(0, 12);

  if (counters.length === 0) {
    throw new Error(
      'Rone Arena devolvió counters para ' +
      requestedHero +
      ', pero sus IDs no pudieron asociarse al catálogo de héroes.'
    );
  }

  return {
    hero: getTargetName(records, requestedHero),
    lane: lane || null,
    source: 'Rone Arena',
    counters
  };
}

module.exports = {
  getCounters
};
