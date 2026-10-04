const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://mlbbhub.com';

function limpiarNombre(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugifyHero(nombre) {
  const limpio = limpiarNombre(nombre)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const especiales = {
    "x.borg": "x-borg",
    "chang'e": "change",
    "popol and kupa": "popol-and-kupa",
    "yi sun-shin": "yi-sun-shin",
    "luo yi": "luo-yi",
    "sora": "sora"
  };

  if (especiales[limpio]) {
    return especiales[limpio];
  }

  return limpio
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extraerDelta(texto) {
  const match = String(texto || '').match(
    /([+-]\d+(?:[.,]\d+)?)\s*(?:pp|percentage points|%)?/i
  );

  if (!match) return null;

  return Number(
    match[1].replace(',', '.')
  );
}


function extraerRazonMatchup(
  texto,
  nombreHeroe
) {
  let razon =
    limpiarNombre(texto);

  razon =
    razon.replace(
      /^\d+\s+/,
      ''
    );

  const nombre =
    limpiarNombre(nombreHeroe);

  if (
    nombre &&
    razon
      .toLowerCase()
      .startsWith(
        nombre.toLowerCase()
      )
  ) {
    razon =
      razon
        .slice(nombre.length)
        .trim();
  }

  razon =
    razon.replace(
      /win rate edge of[\s\S]*$/i,
      ''
    );

  razon =
    razon.replace(
      /[+-]\d+(?:[.,]\d+)?\s*pp\s*$/i,
      ''
    );

  razon =
    razon
      .replace(/\s+/g, ' ')
      .replace(/\s+([.,;:])/g, '$1')
      .trim();

  return razon || null;
}

function extraerCounters(html, enemigo) {
  const $ = cheerio.load(html);
  const counters = [];
  const vistos = new Set();
  const enemigoKey = limpiarNombre(enemigo).toLowerCase();

  function agregarCounter(link) {
    if (counters.length >= 12) return;

    const href = $(link).attr('href') || '';
    const match = href.match(/\/heroes\/([^/?#]+)/i);

    if (!match) return;

    const nombre = limpiarNombre($(link).text());
    if (!nombre) return;

    const clave = nombre.toLowerCase();

    if (clave === enemigoKey || vistos.has(clave)) return;

    const contenedor =
      $(link).closest('li').length
        ? $(link).closest('li')
        : $(link).closest('article').length
          ? $(link).closest('article')
          : $(link).parent();

    const textoBloque = limpiarNombre(
      contenedor.text()
    );

    const delta = extraerDelta(textoBloque);

    if (delta === null) return;

    vistos.add(clave);

    counters.push({
      name: nombre,
      winRate: '+' + delta.toFixed(1) + ' pp',
      edge: delta,
      reason: extraerRazonMatchup(
        textoBloque,
        nombre
      )
    });
  }

  /*
    MLBBHub cambia ocasionalmente los wrappers HTML de las
    tarjetas de counters. En vez de depender de que cada
    tarjeta sea un hermano directo del heading, buscamos la
    sección semántica que contiene "Proven Counters".
  */

  const headings = $('h2, h3').toArray();

  for (const heading of headings) {
    const textoHeading =
      limpiarNombre($(heading).text());

    if (!/^Proven Counters$/i.test(textoHeading)) {
      continue;
    }

    const seccion =
      $(heading).closest('section').length
        ? $(heading).closest('section')
        : $(heading).parent();

    seccion
      .find('a[href*="/heroes/"]')
      .each((_, link) => {
        agregarCounter(link);
      });

    if (counters.length > 0) {
      break;
    }
  }

  /*
    Fallback adicional: buscamos tarjetas individuales que
    contengan un enlace de héroe y una ventaja estadística.
    Esto permite sobrevivir a cambios de layout sin mezclar
    la lista de "Strong Against" cuando la sección principal
    sí fue encontrada.
  */

  if (counters.length === 0) {
    $('li, article, div').each((_, bloque) => {
      if (counters.length >= 12) return false;

      const nodo = $(bloque);
      const texto = limpiarNombre(nodo.text());

      if (
        !/[+-]\d+(?:[.,]\d+)?\s*(?:pp|percentage points|%)/i.test(texto)
      ) {
        return;
      }

      nodo
        .find('a[href*="/heroes/"]')
        .each((_, link) => {
          agregarCounter(link);
        });
    });
  }

  /*
    Último fallback: enlaces de héroes con delta en su contenedor
    inmediato. Conservamos el límite para evitar ruido del resto
    de la página.
  */

  if (counters.length === 0) {
    $('a[href*="/heroes/"]').each((_, link) => {
      agregarCounter(link);
    });
  }

  return counters.slice(0, 12);
}

async function getCounters(hero, lane) {
  const slug = slugifyHero(hero);

  if (!slug) {
    throw new Error('No fue posible identificar el héroe.');
  }

  const response = await axios.get(
    BASE_URL + '/counter/' + encodeURIComponent(slug),
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

  const counters = extraerCounters(
    response.data,
    hero
  );

  if (counters.length === 0) {
    throw new Error(
      'MLBBHub no devolvió counters para ' +
      hero
    );
  }

  return {
    hero,
    lane: lane || null,
    source: 'MLBBHub',
    counters
  };
}

module.exports = {
  getCounters
};
