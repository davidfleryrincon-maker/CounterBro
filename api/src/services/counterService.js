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

  /*
    MLBBHub muestra una sección "Proven Counters".
    Tomamos los héroes enlazados desde esa sección y
    buscamos su ventaja estadística en el bloque cercano.
  */

  const headings = $('h2, h3').toArray();

  let inicio = null;
  let fin = null;

  for (const heading of headings) {
    const texto = limpiarNombre($(heading).text());

    if (!inicio && /^Proven Counters$/i.test(texto)) {
      inicio = heading;
      continue;
    }

    if (
      inicio &&
      /^Kit Matchups$/i.test(texto)
    ) {
      fin = heading;
      break;
    }
  }

  if (inicio) {
    let actual = $(inicio).next();

    while (actual.length) {
      if (
        fin &&
        actual[0] === fin
      ) {
        break;
      }

      actual.find('a[href*="/heroes/"]').each((_, link) => {
        const href = $(link).attr('href') || '';
        const match = href.match(
          /\/heroes\/([^/?#]+)/i
        );

        if (!match) return;

        const nombre = limpiarNombre(
          $(link).text()
        );

        if (!nombre) return;

        const clave = nombre.toLowerCase();

        if (
          clave ===
          limpiarNombre(enemigo).toLowerCase()
        ) {
          return;
        }

        if (vistos.has(clave)) return;

        const contenedor = $(link).closest('li').length
          ? $(link).closest('li')
          : $(link).parent();

        const textoBloque = limpiarNombre(
          contenedor.text()
        );

        const delta = extraerDelta(
          textoBloque
        );

        if (delta === null) return;

        vistos.add(clave);

        counters.push({
          name: nombre,
          winRate:
            '+' +
            delta.toFixed(1) +
            ' pp',
          edge:
            delta,
          reason:
            extraerRazonMatchup(
              textoBloque,
              nombre
            )
        });
      });

      actual = actual.next();
    }
  }

  /*
    Fallback para cambios de estructura de MLBBHub:
    si el bloque anterior no pudo localizarse, buscamos
    enlaces de héroes y su delta en el contenedor cercano.
  */

  if (counters.length === 0) {
    $('a[href*="/heroes/"]').each((_, link) => {
      if (counters.length >= 12) return;

      const href = $(link).attr('href') || '';

      if (!href.match(/\/heroes\/[^/?#]+/i)) {
        return;
      }

      const nombre = limpiarNombre(
        $(link).text()
      );

      if (!nombre) return;

      const clave = nombre.toLowerCase();

      if (
        clave ===
        limpiarNombre(enemigo).toLowerCase()
      ) {
        return;
      }

      if (vistos.has(clave)) return;

      const contenedor = $(link).closest('li').length
        ? $(link).closest('li')
        : $(link).parent();

      const textoBloque =
        limpiarNombre(
          contenedor.text()
        );

      const delta = extraerDelta(
        textoBloque
      );

      if (delta === null) return;

      vistos.add(clave);

      counters.push({
        name: nombre,
        winRate:
          '+' +
          delta.toFixed(1) +
          ' pp',
        edge:
          delta,
        reason:
          extraerRazonMatchup(
            textoBloque,
            nombre
          )
      });
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
