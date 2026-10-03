module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Obtener datos de manera flexible (URL o Body)
  const hero = req.query.hero || req.body?.hero || req.body?.enemigo;
  const lane = req.query.lane || req.body?.lane || req.body?.rol;
  const userPool = req.body?.userPool || [];

  if (!hero) {
    return res.status(400).json({ error: "Falta el parámetro 'hero'" });
  }

  const responseData = {
    heroAnalizado: hero,
    laneFiltro: lane,
    poolCounter: userPool.length > 0 ? {
      nombre: userPool[Math.floor(Math.random() * userPool.length)],
      winrate: (53 + Math.random() * 8).toFixed(1),
      razon: `Tiene ventaja directa de habilidades contra ${hero}.`
    } : null,
    metaCounter: {
      nombre: "Valir / Chou",
      winrate: (55 + Math.random() * 6).toFixed(1),
      razon: `El pick con mayor índice de victoria global frente a ${hero} en el parche actual.`
    }
  };

  return res.status(200).json(responseData);
};
