const { fetchLiveHeroesFromMLBBHub } = require('./src/services/mlbbHubClient');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { hero, lane, getHeroes } = req.query;

  if (getHeroes === 'true') {
    try {
      const data = await fetchLiveHeroesFromMLBBHub();
      return res.status(200).json(data);
    } catch (error) {
      console.error('MLBBHub sync error:', error);
      return res.status(502).json({
        error: 'No fue posible sincronizar los héroes desde MLBBHub.'
      });
    }
  }

  if (!hero) {
    return res.status(400).json({ error: "Falta el parámetro 'hero'" });
  }

  try {
    const { getCounters } = require('./src/services/counterService');
    const result = await getCounters(hero, lane);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Counter service error:', error);
    return res.status(500).json({
      error: 'No fue posible obtener los counters.'
    });
  }
};
