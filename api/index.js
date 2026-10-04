const fs = require('fs');
const path = require('path');

const PREPARED_HEROES_PATH =
  path.join(
    __dirname,
    'data',
    'heroes.json'
  );

let preparedHeroes = null;

function cargarBasePreparada() {
  if (!preparedHeroes) {
    preparedHeroes =
      JSON.parse(
        fs.readFileSync(
          PREPARED_HEROES_PATH,
          'utf8'
        )
      );
  }

  return preparedHeroes;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { hero, lane, getHeroes } = req.query;

  if (getHeroes === 'true') {
    try {
      const data = cargarBasePreparada();
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
      return res.status(200).json({
        ...data,
        prepared: true
      });
    } catch (error) {
      console.error('Prepared heroes data error:', error);
      return res.status(500).json({
        error: 'No fue posible cargar la base preparada de héroes.'
      });
    }
  }

  if (!hero) {
    return res.status(400).json({
      error: "Falta el parámetro 'hero'"
    });
  }

  try {
    const { getCounters } = require('./src/services/counterService');
    const result = await getCounters(hero, lane);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Counter service error:', error);
    return res.status(500).json({
      error: 'No fue posible obtener los counters.',
      diagnostic: {
        name: error?.name || 'Error',
        message: error?.message || String(error)
      }
    });
  }
};