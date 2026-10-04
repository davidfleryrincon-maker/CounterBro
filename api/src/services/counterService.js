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

function extraerRazonMatchup(texto, nombreHeroe) {
  let razon = limpiarNombre(texto);

  razon = razon.replace(/^\d+\s+/, '');

  const nombre = limpiarNombre(nombreHeroe);

  if (
    nombre &&
    razon.toLowerCase().startsWith(nombre.toLowerCase())
  ) {
    razon = razon.slice(nombre.length).trim();
  }

  razon = razon.replace(
    /win rate edge of[\s\S]*$/i,
    ''
  );

  razon = razon.replace(
    /[+-]\d+(?:[.,]\d+)?\s*pp\s*$/i,
    ''
  );

  razon = razon
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .trim();

  return razon || null;
}

const HERO_DATA = require('../../data/heroes.json');

function crearMapaHeroes() {
  const mapa = new Map();

  const heroes =
    HERO_DATA &&
    Array.isArray(HERO_DATA.heroes)
      ? HERO_DATA.heroes
      : [];

  heroes.forEach(nombre => {
    mapa.set(slugifyHero(nombre), nombre);
  });

  return mapa;
}

const HEROES_POR_SLUG = crearMapaHeroes();

function nombreHeroeDesdeHref(href) {
  const match = String(href || '').match(
    /\/heroes\/([^/?#]+)/i
  );

  if (!match) return null;

  let slug = match[1];

  try {
    slug = decodeURIComponent(slug);
  } catch (_) {}

  slug = String(slug).trim().toLowerCase();

  const nombreConocido = HEROES_POR_SLUG.get(slug);

  if (nombreConocido) {
    return nombreConocido;
  }

  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, letra => letra.toUpperCase());
}

function crearMapaHeroesPorLinea() {
  const mapa = new Map();
  const lanes = HERO_DATA && HERO_DATA.lanes
    ? HERO_DATA.lanes
    : {};

  Object.entries(lanes).forEach(([lane, heroes]) => {
    mapa.set(
      lane.toLowerCase(),
      new Set(
        Array.isArray(heroes)
          ? heroes.map(nombre => slugifyHero(nombre))
          : []
      )
    );
  });

  return mapa;
}

const HEROES_POR_LINEA = crearMapaHeroesPorLinea();

function perteneceALinea(nombre, lane) {
  if (!lane) return true;

  const key = String(lane).trim().toLowerCase();
  const heroes = HEROES_POR_LINEA.get(key);

  if (!heroes) return true;

  return heroes.has(slugifyHero(nombre));
}

function buscarSeccionCountersPorLinea($) {
  const headings = $('h2, h3').toArray();

  const inicio = headings.findIndex(heading =>
    /Counters for .* by Lane and Role/i.test(
      limpiarNombre($(heading).text())
    )
  );

  if (inicio === -1) return null;

  const startHeading = headings[inicio];
  const startIndex = $('body *').toArray().indexOf(startHeading);

  let endIndex = $('body *').length;

  for (let i = inicio + 1; i < headings.length; i += 1) {
    const heading = headings[i];
    const texto = limpiarNombre($(heading).text());

    if (/^Game Phase Analysis\b/i.test(texto)) {
      endIndex = $('body *').toArray().indexOf(heading);
      break;
    }
  }

  return {
    startIndex,
    endIndex
  };
}

function extraerCountersPorLinea(html, enemigo, lane) {
  const $ = cheerio.load(html);
  const counters = [];
  const vistos = new Set();
  const elementos = $('body *').toArray();
  const indices = new Map();

  elementos.forEach((elemento, index) => {
    indices.set(elemento, index);
  });

  const seccion = buscarSeccionCountersPorLinea($);

  if (!seccion) {
    throw new Error(
      'MLBBHub no encontró la sección "Counters by Lane and Role".'
    );
  }

  const enemigoKey = slugifyHero(enemigo);

  $('a[href*="/heroes/"]').each((_, link) => {
    const indice = indices.get(link);

    if (
      typeof indice !== 'number' ||
      indice <= seccion.startIndex ||
      indice >= seccion.endIndex
    ) {
      return;
    }

    const nombre = nombreHeroeDesdeHref(
      $(link).attr('href') || ''
    );

    if (!nombre) return;

    const clave = slugifyHero(nombre);

    if (
      clave === enemigoKey ||
      vistos.has(clave) ||
      !perteneceALinea(nombre, lane)
    ) {
      return;
    }

    const texto = limpiarNombre(
      $(link).closest('li').text() ||
      $(link).parent().text()
    );

    const delta = extraerDelta(texto);

    if (delta === null) return;

    vistos.add(clave);

    counters.push({
      name: nombre,
      winRate: '+' + delta.toFixed(1) + ' pp',
      edge: delta,
      reason: extraerRazonMatchup(texto, nombre)
    });
  });

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

  const counters = extraerCountersPorLinea(
    response.data,
    hero,
    lane
  );

  if (counters.length === 0) {
    throw new Error(
      'MLBBHub no devolvió counters utilizables para ' +
      hero +
      ' en la línea ' +
      (lane || 'seleccionada') +
      '.'
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