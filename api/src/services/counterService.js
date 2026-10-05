const {
  getHeroByIdentifier,
  getHeroCatalog,
  fetchHeroCounters
} = require('./roneArenaClient');

function cleanName(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatPercentagePoints(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return null;
  }

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

    if (!Array.isArray(data.sub_hero)) {
      return;
    }

    data.sub_hero.forEach(counter => {
      const heroId = Number(counter?.heroid);
      const edge = Number(counter?.increase_win_rate);
      const heroWinRate = Number(counter?.hero_win_rate);

      if (
        !Number.isFinite(heroId) ||
        !Number.isFinite(edge)
      ) {
        return;
      }

      rows.push({
        heroId,
        edge,
        heroWinRate:
          Number.isFinite(heroWinRate)
            ? heroWinRate
            : null
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

async function getCounters(hero, lane) {
  const target = await getHeroByIdentifier(hero);

  if (!target) {
    throw new Error(
      'Rone Arena no pudo identificar el héroe: ' +
      cleanName(hero)
    );
  }

  const records = await fetchHeroCounters(target.id);
  const rows = getCounterRows(records);

  if (rows.length === 0) {
    throw new Error(
      'Rone Arena no devolvió counters utilizables para ' +
      target.name +
      '.'
    );
  }

  const catalog = await getHeroCatalog();

  const namesById = new Map(
    catalog.map(item => [item.id, item.name])
  );

  const counters = rows
    .map(row => {
      const name = namesById.get(row.heroId);

      if (!name) {
        return null;
      }

      const winRate = formatPercentagePoints(row.edge);

      if (!winRate) {
        return null;
      }

      return {
        name,
        winRate,
        edge: row.edge * 100,
        heroWinRate: row.heroWinRate,
        reason:
          'Ventaja estadística del matchup según Rone Arena.'
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.edge - a.edge)
    .slice(0, 12);

  if (counters.length === 0) {
    throw new Error(
      'Rone Arena devolvió counters, pero no fue posible asociarlos con héroes conocidos.'
    );
  }

  return {
    hero: target.name,
    lane: lane || null,
    source: 'Rone Arena',
    counters
  };
}

module.exports = {
  getCounters
};
