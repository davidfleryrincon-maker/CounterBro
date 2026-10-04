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

const HERO_DATA = require('../../data/heroes.json');

function crearMapaHeroes() {
  const mapa = new Map();

  const heroes =
    HERO_DATA &&
    Array.isArray(HERO_DATA.heroes)
      ? HERO_DATA.heroes
      : [];

  heroes.forEach(nombre => {
    mapa.set(
      slugifyHero(nombre),
      nombre
    );
  });

  return mapa;
}

const HEROES_POR_SLUG =
  crearMapaHeroes();

function nombreHeroeDesdeHref(href) {
  const match =
    String(href || '').match(
      /\/heroes\/([^/?#]+)/i
    );

  if (!match) return null;

  let slug = match[1];

  try {
    slug =
      decodeURIComponent(slug);
  } catch (_) {
    // Conservamos el slug original si viene mal codificado.
  }

  slug = String(slug)
    .trim()
    .toLowerCase();

  const nombreConocido =
    HEROES_POR_SLUG.get(slug);

  if (nombreConocido) {
    return nombreConocido;
  }

  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, letra =>
      letra.toUpperCase()
    );
}

function obtenerBloqueCounter($, link) {
  let nodo = $(link);

  for (let nivel = 0; nivel < 8; nivel += 1) {
    nodo = nodo.parent();

    if (!nodo || !nodo.length) {
      break;
    }

    const enlacesHeroe =
      nodo.find(
        'a[href*="/heroes/"]'
      );

    const texto =
      limpiarNombre(nodo.text());

    const tieneDelta =
      /[+-]\d+(?:[.,]\d+)?\s*(?:pp|percentage points|%)/i
        .test(texto);

    if (
      enlacesHeroe.length === 1 &&
      tieneDelta
    ) {
      return texto;
    }
  }

  return limpiarNombre(
    $(link).parent().text()
  );
}

function extraerCounters(html, enemigo) {
  const $ = cheerio.load(html);
  const counters = [];
  const vistos = new Set();
  const enemigoKey =
    limpiarNombre(enemigo).toLowerCase();

  function agregarCounter(link) {
    if (counters.length >= 12) return;

    const href =
      $(link).attr('href') || '';

    const nombre =
      nombreHeroeDesdeHref(href);

    if (!nombre) return;

    const clave =
      nombre.toLowerCase();

    if (
      clave === enemigoKey ||
      vistos.has(clave)
    ) {
      return;
    }

    const textoBloque =
      obtenerBloqueCounter($, link);

    const delta =
      extraerDelta(textoBloque);

    if (delta === null) return;

    vistos.add(clave);

    counters.push({
      name: nombre,
      winRate:
        '+' +
        delta.toFixed(1) +
        ' pp',
      edge: delta,
      reason:
        extraerRazonMatchup(
          textoBloque,
          nombre
        )
    });
  }

  /*
    Buscamos los enlaces únicamente dentro del tramo
    "Proven Counters" -> "Kit Matchups".

    Esto evita confundir los counters medidos con:
    - Kit Matchups
    - Heroes Strong Against
    - Counters por rol
    - FAQ
  */

  const elementos =
    $('body *').toArray();

  const indices =
    new Map();

  elementos.forEach(
    (elemento, index) => {
      indices.set(
        elemento,
        index
      );
    }
  );

  const headings =
    $('h2, h3').toArray();

  for (const heading of headings) {
    const textoHeading =
      limpiarNombre(
        $(heading).text()
      );

    if (
      !/^Proven Counters\b/i.test(
        textoHeading
      )
    ) {
      continue;
    }

    const inicio =
      indices.get(heading);

    if (
      typeof inicio !== 'number'
    ) {
      continue;
    }

    let fin =
      elementos.length;

    for (const posibleFin of headings) {
      const indiceFin =
        indices.get(posibleFin);

      if (
        typeof indiceFin !== 'number' ||
        indiceFin <= inicio
      ) {
        continue;
      }

      const textoFin =
        limpiarNombre(
          $(posibleFin).text()
        );

      if (
        /^Kit Matchups\b/i.test(
          textoFin
        )
      ) {
        fin = indiceFin;
        break;
      }
    }

    $('a[href*="/heroes/"]').each(
      (_, link) => {
        if (counters.length >= 12) {
          return;
        }

        const indiceLink =
          indices.get(link);

        if (
          typeof indiceLink !== 'number' ||
          indiceLink <= inicio ||
          indiceLink >= fin
        ) {
          return;
        }

        agregarCounter(link);
      }
    );

    if (counters.length > 0) {
      break;
    }
  }

  /*
    Fallback controlado para pequeños cambios de HTML.
    No usa el texto visible del enlace como nombre: siempre
    toma el slug canónico del href y lo cruza con heroes.json.
  */

  if (counters.length === 0) {
    $('a[href*="/heroes/"]').each(
      (_, link) => {
        if (counters.length >= 12) {
          return;
        }

        agregarCounter(link);
      }
    );
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
