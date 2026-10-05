const LOCAL_HERO_DATA_URL = "/data/heroes.json";
const RONE_API_BASE = "https://arena.rone.dev/api";

const HERO_CACHE_KEY = "counterbro_local_heroes_v2";
const HERO_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

const RONE_REQUEST_TIMEOUT_MS = 12000;
const RONE_RETRIES = 2;

let HERO_DATABASE = [];
let HERO_CATALOG = [];
let HERO_LANES = {
  exp: [],
  mid: [],
  gold: [],
  jungle: [],
  roam: []
};

let heroesReadyPromise = null;
let heroesReady = false;
let startupThoughtTimer = null;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizarNombreHeroe(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function extraerLanesRone(record) {
  const roadsort = record?.data?.hero?.data?.roadsort;

  if (!Array.isArray(roadsort)) {
    return [];
  }

  const lanes = new Set();

  roadsort.forEach(item => {
    const data = item?.data || {};

    [
      data.road_sort_title,
      item?.caption,
      data.road_sort_id
    ].forEach(value => {
      const text = String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (text.includes("jungle") || text.includes("jungler")) {
        lanes.add("jungle");
      } else if (text.includes("roam") || text.includes("roamer")) {
        lanes.add("roam");
      } else if (text.includes("gold") || text.includes("goldlane")) {
        lanes.add("gold");
      } else if (
        text === "mid" ||
        text.includes("midlane") ||
        text.includes("middle")
      ) {
        lanes.add("mid");
      } else if (
        text.includes("exp") ||
        text.includes("explane")
      ) {
        lanes.add("exp");
      }
    });
  });

  return Array.from(lanes);
}

function transformarCatalogoRone(payload) {
  if (
    payload?.code !== undefined &&
    Number(payload.code) !== 0
  ) {
    throw new Error(
      "Rone Arena respondió con código " +
      payload.code +
      ": " +
      (payload.message || "error desconocido")
    );
  }

  const records = Array.isArray(payload?.data?.records)
    ? payload.data.records
    : [];

  const byId = new Map();

  records.forEach(record => {
    const id = Number(record?.data?.hero_id);
    const name = String(
      record?.data?.hero?.data?.name || ""
    ).trim();

    if (!Number.isFinite(id) || !name) {
      return;
    }

    byId.set(id, {
      id,
      name,
      lanes: extraerLanesRone(record)
    });
  });

  const heroes = Array.from(byId.values());

  if (heroes.length < 50) {
    throw new Error(
      "Rone Arena devolvió solo " +
      heroes.length +
      " héroes en /heroes/positions."
    );
  }

  const lanes = {
    exp: [],
    mid: [],
    gold: [],
    jungle: [],
    roam: []
  };

  heroes.forEach(hero => {
    hero.lanes.forEach(lane => {
      if (lanes[lane]) {
        lanes[lane].push(hero.name);
      }
    });
  });

  Object.keys(lanes).forEach(lane => {
    lanes[lane] = Array.from(
      new Set(lanes[lane])
    ).sort((a, b) => a.localeCompare(b));
  });

  return {
    schemaVersion: 2,
    heroes,
    lanes,
    source: "Rone Arena",
    syncedAt: new Date().toISOString()
  };
}

function normalizarBaseLocal(data) {
  const rawHeroes = Array.isArray(data?.heroes)
    ? data.heroes
    : [];

  const heroes = rawHeroes
    .map(item => {
      if (typeof item === "string") {
        return {
          id: null,
          name: item.trim(),
          lanes: []
        };
      }

      const id = Number(item?.id);

      return {
        id: Number.isFinite(id) ? id : null,
        name: String(item?.name || "").trim(),
        lanes: Array.isArray(item?.lanes)
          ? item.lanes.filter(Boolean)
          : []
      };
    })
    .filter(hero => hero.name);

  const lanes = {
    exp: [],
    mid: [],
    gold: [],
    jungle: [],
    roam: []
  };

  Object.keys(lanes).forEach(lane => {
    if (Array.isArray(data?.lanes?.[lane])) {
      lanes[lane] = Array.from(
        new Set(
          data.lanes[lane]
            .filter(Boolean)
            .map(String)
        )
      );
    }
  });

  heroes.forEach(hero => {
    hero.lanes.forEach(lane => {
      if (lanes[lane] && !lanes[lane].includes(hero.name)) {
        lanes[lane].push(hero.name);
      }
    });
  });

  return {
    schemaVersion: 2,
    heroes,
    lanes,
    source: data?.source || "CounterBro local snapshot",
    syncedAt: data?.syncedAt || null
  };
}

function aplicarDatosDeHeroes(data) {
  const base = normalizarBaseLocal(data);

  if (base.heroes.length < 50) {
    throw new Error(
      "La base de héroes no es suficiente."
    );
  }

  const catalogByName = new Map();

  base.heroes.forEach(hero => {
    const key = normalizarNombreHeroe(hero.name);

    if (!key) {
      return;
    }

    const previous = catalogByName.get(key);

    if (!previous || (!previous.id && hero.id)) {
      catalogByName.set(key, hero);
    }
  });

  HERO_CATALOG = Array.from(
    catalogByName.values()
  );

  HERO_DATABASE = HERO_CATALOG
    .map(hero => hero.name)
    .sort((a, b) => a.localeCompare(b));

  Object.keys(HERO_LANES).forEach(lane => {
    HERO_LANES[lane] = [];
  });

  Object.keys(HERO_LANES).forEach(lane => {
    HERO_LANES[lane] = Array.from(
      new Set(
        (base.lanes[lane] || []).filter(Boolean)
      )
    );
  });

  HERO_CATALOG.forEach(hero => {
    (hero.lanes || []).forEach(lane => {
      if (
        HERO_LANES[lane] &&
        !HERO_LANES[lane].includes(hero.name)
      ) {
        HERO_LANES[lane].push(hero.name);
      }
    });
  });

  Object.keys(HERO_LANES).forEach(lane => {
    HERO_LANES[lane].sort(
      (a, b) => a.localeCompare(b)
    );
  });

  const missingLane = Object.keys(HERO_LANES).find(
    lane => HERO_LANES[lane].length < 5
  );

  if (missingLane) {
    throw new Error(
      "La base no tiene suficientes héroes para " +
      missingLane +
      "."
    );
  }

  heroesReady = true;
}

async function fetchJsonWithRetry(url, label) {
  let lastError = null;

  for (
    let attempt = 1;
    attempt <= RONE_RETRIES;
    attempt += 1
  ) {
    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      RONE_REQUEST_TIMEOUT_MS
    );

    try {
      const response = await fetch(
        url,
        {
          method: "GET",
          headers: {
            Accept: "application/json"
          },
          cache: "no-store",
          signal: controller.signal
        }
      );

      const text = await response.text();

      let data = null;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          label +
          ": Rone Arena no devolvió JSON válido (HTTP " +
          response.status +
          ")."
        );
      }

      if (!response.ok) {
        const message =
          data?.message ||
          data?.error ||
          "HTTP " + response.status;

        const error = new Error(
          label + ": " + message
        );

        error.status = response.status;

        throw error;
      }

      if (
        data?.code !== undefined &&
        Number(data.code) !== 0
      ) {
        const error = new Error(
          label +
          ": código Rone " +
          data.code +
          " - " +
          (data.message || "error desconocido")
        );

        error.roneCode = data.code;

        throw error;
      }

      return data;

    } catch (error) {
      lastError = error;

      const status = error?.status;

      const retryable =
        !status ||
        status === 408 ||
        status === 425 ||
        status === 429 ||
        status >= 500;

      if (
        attempt >= RONE_RETRIES ||
        !retryable
      ) {
        break;
      }

      await sleep(900 * attempt);

    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}

async function cargarHeroesDesdeCache() {
  try {
    const raw = localStorage.getItem(
      HERO_CACHE_KEY
    );

    if (!raw) {
      return false;
    }

    const cache = JSON.parse(raw);

    if (
      !cache ||
      !cache.savedAt ||
      !cache.data
    ) {
      return false;
    }

    if (
      Date.now() - cache.savedAt >
      HERO_CACHE_TTL_MS
    ) {
      return false;
    }

    aplicarDatosDeHeroes(cache.data);

    console.info(
      "CounterBro: usando catálogo local cacheado.",
      {
        heroes: HERO_DATABASE.length,
        source: cache.data.source || null
      }
    );

    return true;

  } catch (error) {
    console.warn(
      "CounterBro: cache local inválida.",
      error
    );

    return false;
  }
}

async function cargarBaseLocal() {
  const response = await fetch(
    LOCAL_HERO_DATA_URL,
    {
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(
      "No se pudo cargar " +
      LOCAL_HERO_DATA_URL +
      " (HTTP " +
      response.status +
      ")."
    );
  }

  const data = await response.json();

  aplicarDatosDeHeroes(data);

  localStorage.setItem(
    HERO_CACHE_KEY,
    JSON.stringify({
      savedAt: Date.now(),
      data
    })
  );

  return true;
}

async function sincronizarCatalogoRone() {
  const url =
    RONE_API_BASE +
    "/heroes/positions?size=200&index=1&order=asc&lang=en";

  const payload =
    await fetchJsonWithRetry(
      url,
      "Catálogo de héroes"
    );

  const data =
    transformarCatalogoRone(payload);

  aplicarDatosDeHeroes(data);

  localStorage.setItem(
    HERO_CACHE_KEY,
    JSON.stringify({
      savedAt: Date.now(),
      data
    })
  );

  console.info(
    "CounterBro: catálogo Rone sincronizado.",
    {
      heroes: HERO_DATABASE.length,
      source: data.source,
      syncedAt: data.syncedAt
    }
  );

  return true;
}

async function cargarBasePreparada() {
  let baseDisponible = false;

  try {
    baseDisponible =
      await cargarHeroesDesdeCache();
  } catch (error) {
    console.warn(
      "CounterBro: no pudo usar la caché local.",
      error
    );
  }

  if (!baseDisponible) {
    try {
      baseDisponible =
        await cargarBaseLocal();
    } catch (error) {
      console.error(
        "CounterBro: falló la base local.",
        error
      );
    }
  }

  if (!baseDisponible) {
    throw new Error(
      "No existe una base local válida de héroes."
    );
  }

  try {
    await sincronizarCatalogoRone();
  } catch (error) {
    console.warn(
      "CounterBro: no se pudo refrescar el catálogo Rone; se conserva la base local.",
      error
    );
  }

  return true;
}

async function consultarCountersRone(heroName) {
  const normalized =
    normalizarNombreHeroe(heroName);

  const catalogHero =
    HERO_CATALOG.find(
      hero =>
        normalizarNombreHeroe(hero.name) ===
        normalized
    );

  const identifier =
    catalogHero?.id ||
    heroName;

  const url =
    RONE_API_BASE +
    "/heroes/" +
    encodeURIComponent(identifier) +
    "/counters?days=7&rank=all&size=200&index=1&lang=en";

  const payload =
    await fetchJsonWithRetry(
      url,
      "Counters de " + heroName
    );

  const records =
    Array.isArray(payload?.data?.records)
      ? payload.data.records
      : [];

  if (records.length === 0) {
    throw new Error(
      "Rone Arena no devolvió counters para " +
      heroName +
      "."
    );
  }

  const namesById =
    new Map(
      HERO_CATALOG
        .filter(hero => Number.isFinite(hero.id))
        .map(hero => [
          Number(hero.id),
          hero.name
        ])
    );

  const rows = [];

  records.forEach(record => {
    const subHeroes =
      Array.isArray(record?.data?.sub_hero)
        ? record.data.sub_hero
        : [];

    subHeroes.forEach(counter => {
      const heroId =
        Number(counter?.heroid);

      const edge =
        Number(counter?.increase_win_rate);

      const heroWinRate =
        Number(counter?.hero_win_rate);

      if (
        !Number.isFinite(heroId) ||
        !Number.isFinite(edge)
      ) {
        return;
      }

      const name =
        namesById.get(heroId);

      if (!name) {
        return;
      }

      rows.push({
        id: heroId,
        name,
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
    const previous =
      unique.get(row.id);

    if (
      !previous ||
      row.edge > previous.edge
    ) {
      unique.set(row.id, row);
    }
  });

  const counters =
    Array.from(
      unique.values()
    )
      .sort(
        (a, b) =>
          b.edge - a.edge
      )
      .slice(0, 20)
      .map(row => ({
        name: row.name,
        winRate:
          (row.edge >= 0 ? "+" : "") +
          (row.edge * 100).toFixed(1) +
          " pp",
        edge:
          row.edge * 100,
        heroWinRate:
          row.heroWinRate,
        reason:
          "Ventaja estadística del matchup según Rone Arena."
      }));

  if (counters.length === 0) {
    throw new Error(
      "Rone Arena respondió, pero CounterBro no pudo asociar los IDs de sus counters con el catálogo de héroes."
    );
  }

  const targetName =
    records
      .map(
        record =>
          String(
            record?.data?.main_hero?.data?.name ||
            ""
          ).trim()
      )
      .find(Boolean) ||
    heroName;

  return {
    hero: targetName,
    source: "Rone Arena",
    counters
  };
}

const STARTUP_THOUGHTS = [
  "Despertando a Nana de su quinta siesta",
  "Contratando al primer Lord de esta partida",
  "Haciendo inventario de Minions",
  "Buscando a Eudora entre los arbustos",
  "Revisando por qué alguien eligió Hanabi",
  "Contando cuántas veces murió Yin",
  "Alimentando a la Tortuga",
  "Preguntándole a Johnson dónde va",
  "Revisando el arbusto sospechoso",
  "Ajustando la puntería de Franco",
  "Contando torres destruidas",
  "Buscando el oro de las torres",
  "Revisando quién se robó el buff rojo",
  "Enseñándole nuevos trucos a Helcurt",
  "Diseñando nuevos Backeos",
  "Revisando si Tigreal sigue campeando",
  "Buscando una partida sin trolls",
  "Contando hasta diez antes de iniciar",
  "Revisando mis archivos secretos",
  "Fingiendo que todo está bajo control",
  "Consultando al departamento de estrategia",
  "Ignorando temporalmente mis problemas",
  "Ordenando mis pensamientos digitales",
  "Recordando por qué estoy aquí"
];

/* =======================================================
   IDIOMAS
   ======================================================= */

const i18n = {

  es: {

    step1:
      "1. Configurar tu Pool de Héroes",

    selectLane:
      "Seleccionar Línea:",

    addHero:
      "Agregar héroe a esta línea:",

    btnAdd:
      "Agregar",

    step2:
      "2. Buscar Counter de Línea",

    yourLane:
      "Línea que jugarás:",

    enemyPick:
      "Pick Enemigo en tu línea:",

    btnAnalyze:
      "Analizar Matchup",

    block1Title:
      "🥇 TU MEJOR OPCIÓN",

    block1Sub:
      "Según los héroes que sabes usar en esta línea",

    block2Title:
      "🌍 OPCIÓN ESTADÍSTICAMENTE FAVORABLE",

    block2Sub:
      "Según los datos del meta",

    btnReset:
      "🔄 Analizar Nueva Partida",

    emptyPool:
      "Tu pool está vacío para esta línea. Agrega héroes arriba.",

    fuzzyFound:
      "Interpretado como: ",

    enterEnemy:
      "Por favor, ingresa el nombre del héroe enemigo."

  },

  en: {

    step1:
      "1. Configure Your Hero Pool",

    selectLane:
      "Select Lane:",

    addHero:
      "Add hero to this lane:",

    btnAdd:
      "Add",

    step2:
      "2. Search Lane Counter",

    yourLane:
      "Lane you will play:",

    enemyPick:
      "Enemy Pick in your lane:",

    btnAnalyze:
      "Analyze Matchup",

    block1Title:
      "🥇 YOUR BEST OPTION",

    block1Sub:
      "Based on the heroes you know how to use in this lane",

    block2Title:
      "🌍 STATISTICALLY FAVORABLE OPTION",

    block2Sub:
      "Based on meta data",

    btnReset:
      "🔄 Analyze New Matchup",

    emptyPool:
      "Your pool is empty for this lane. Add heroes above.",

    fuzzyFound:
      "Interpreted as: ",

    enterEnemy:
      "Please enter the enemy hero name."

  }

};


const lang =
  window.navigator.language.startsWith("es")
    ? "es"
    : "en";

const txt =
  i18n[lang];


function aplicarIdioma() {

  const elementos = {

    "t-step1": txt.step1,
    "t-selectLane": txt.selectLane,
    "t-addHero": txt.addHero,
    "t-btnAdd": txt.btnAdd,
    "t-step2": txt.step2,
    "t-yourLane": txt.yourLane,
    "t-enemyPick": txt.enemyPick,
    "t-btnAnalyze": txt.btnAnalyze,
    "t-block1Title": txt.block1Title,
    "t-block1Sub": txt.block1Sub,
    "t-block2Title": txt.block2Title,
    "t-block2Sub": txt.block2Sub,
    "t-btnReset": txt.btnReset

  };

  Object.entries(elementos)
    .forEach(([id, value]) => {

      const element =
        document.getElementById(id);

      if (element) {
        element.innerText = value;
      }

    });

}


/* =======================================================
   POOL DEL USUARIO
   ======================================================= */

let userPool;

try {

  userPool =
    JSON.parse(
      localStorage.getItem(
        "mlbb_user_pool"
      )
    ) || {

      exp: [],
      mid: [],
      gold: [],
      jungle: [],
      roam: []

    };

} catch (error) {

  userPool = {

    exp: [],
    mid: [],
    gold: [],
    jungle: [],
    roam: []

  };

}


function guardarPool() {

  localStorage.setItem(
    "mlbb_user_pool",
    JSON.stringify(userPool)
  );

}


/* =======================================================
   LIMPIAR TEXTO
   ======================================================= */

function limpiarTexto(texto) {

  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

}


/* =======================================================
   DISTANCIA LEVENSHTEIN
   ======================================================= */

function distanciaLevenshtein(a, b) {

  const matriz = [];

  for (
    let i = 0;
    i <= b.length;
    i++
  ) {

    matriz[i] = [i];

  }

  for (
    let j = 0;
    j <= a.length;
    j++
  ) {

    matriz[0][j] = j;

  }

  for (
    let i = 1;
    i <= b.length;
    i++
  ) {

    for (
      let j = 1;
      j <= a.length;
      j++
    ) {

      if (
        b.charAt(i - 1) ===
        a.charAt(j - 1)
      ) {

        matriz[i][j] =
          matriz[i - 1][j - 1];

      } else {

        matriz[i][j] =
          Math.min(

            matriz[i - 1][j] + 1,

            matriz[i][j - 1] + 1,

            matriz[i - 1][j - 1] + 1

          );

      }

    }

  }

  return matriz[b.length][a.length];

}


/* =======================================================
   IDENTIFICAR HÉROE
   ======================================================= */

function identificarHeroe(entrada) {

  const texto =
    limpiarTexto(entrada);

  if (!texto) {
    return entrada;
  }


  const coincidenciaExacta =
    HERO_DATABASE.find(
      hero =>
        limpiarTexto(hero) === texto
    );

  if (coincidenciaExacta) {
    return coincidenciaExacta;
  }


  /*
     =====================================================
     RECONOCIMIENTO TOLERANTE

     Combina coincidencia parcial, prefijo y distancia
     para tolerar errores habituales al escribir héroes.
  */

  let mejorCoincidencia = null;
  let mejorPuntaje = -Infinity;
  let mejorDistancia = Infinity;


  HERO_DATABASE.forEach(hero => {

    const limpio =
      limpiarTexto(hero);

    if (!limpio) {
      return;
    }


    const distancia =
      distanciaLevenshtein(
        texto,
        limpio
      );


    const longitudMaxima =
      Math.max(
        texto.length,
        limpio.length
      );


    const similitud =
      longitudMaxima === 0
        ? 0
        : 1 -
          (
            distancia /
            longitudMaxima
          );


    const contiene =
      texto.length >= 4 &&
      (
        limpio.includes(texto) ||
        texto.includes(limpio)
      );


    const mismoInicio =
      texto.length >= 4 &&
      limpio.startsWith(
        texto.slice(
          0,
          Math.min(
            5,
            texto.length
          )
        )
      );


    let puntaje =
      similitud;


    if (contiene) {
      puntaje += 0.18;
    }


    if (mismoInicio) {
      puntaje += 0.08;
    }


    if (
      texto.length >= 5 &&
      limpio.length >= 5 &&
      texto.slice(0, 3) ===
      limpio.slice(0, 3)
    ) {
      puntaje += 0.04;
    }


    if (
      puntaje > mejorPuntaje ||
      (
        puntaje === mejorPuntaje &&
        distancia < mejorDistancia
      )
    ) {

      mejorPuntaje =
        puntaje;

      mejorDistancia =
        distancia;

      mejorCoincidencia =
        hero;

    }

  });


  const limiteDistancia =
    texto.length <= 4
      ? 1
      : texto.length <= 7
        ? 2
        : 3;


  const limiteSimilitud =
    texto.length <= 4
      ? 0.80
      : texto.length <= 7
        ? 0.68
        : 0.62;


  if (
    mejorCoincidencia &&
    mejorDistancia <= limiteDistancia &&
    (
      mejorPuntaje >= limiteSimilitud ||
      (
        texto.length >= 5 &&
        mejorPuntaje >= 0.68
      )
    )
  ) {

    return mejorCoincidencia;

  }


  return entrada;

}


/* =======================================================
   VALIDAR HÉROE POR LÍNEA
   ======================================================= */

/*
   ESTA ES UNA REGLA CRÍTICA DE COUNTERBRO.

   Un héroe solamente es válido si aparece
   explícitamente en la línea seleccionada.

   Si no tenemos información de la línea,
   NO lo consideramos válido.

   Esto evita que un counter estadísticamente
   bueno de otra posición termine apareciendo
   como recomendación.
*/

function esHeroeDeLinea(
  nombreHeroe,
  linea
) {

  const heroesDeLinea =
    HERO_LANES[linea];


  if (
    !Array.isArray(
      heroesDeLinea
    )
  ) {

    return false;

  }


  return heroesDeLinea.some(
    hero =>
      limpiarTexto(hero) ===
      limpiarTexto(nombreHeroe)
  );

}


/* =======================================================
   OBTENER HÉROES VÁLIDOS DE UNA LÍNEA
   ======================================================= */

function obtenerHeroesDeLinea(linea) {

  if (
    !Array.isArray(
      HERO_LANES[linea]
    )
  ) {

    return [];

  }


  return HERO_LANES[linea];

}


/* =======================================================
   WIN RATE
   ======================================================= */

function parseWinRate(wrStr) {

  if (
    wrStr === null ||
    wrStr === undefined
  ) {

    return 0;

  }


  if (
    typeof wrStr === "number"
  ) {

    return wrStr;

  }


  const num =
    parseFloat(
      String(wrStr)
        .replace("%", "")
        .replace(",", ".")
    );


  return isNaN(num)
    ? 0
    : num;

}


/* =======================================================
   SELECTOR VISUAL DE LÍNEAS
   ======================================================= */

function seleccionarLinea(
  grupo,
  linea
) {

  const selectId =
    grupo === "pool"
      ? "poolLinea"
      : "partidaLinea";


  const select =
    document.getElementById(
      selectId
    );


  if (!select) {
    return;
  }


  select.value =
    linea;


  document
    .querySelectorAll(
      `.lane-option[data-lane-group="${grupo}"]`
    )
    .forEach(button => {

      button.classList.toggle(
        "is-active",
        button.dataset.lane ===
        linea
      );

    });


  if (
    grupo === "pool"
  ) {

    mostrarPoolActual();

  }

}


/* =======================================================
   SINCRONIZAR SELECTORES
   ======================================================= */

function sincronizarSelectoresDeLinea() {

  const poolLinea =
    document.getElementById(
      "poolLinea"
    )?.value || "exp";


  const partidaLinea =
    document.getElementById(
      "partidaLinea"
    )?.value || "exp";


  document
    .querySelectorAll(
      '.lane-option[data-lane-group="pool"]'
    )
    .forEach(button => {

      button.classList.toggle(
        "is-active",
        button.dataset.lane ===
        poolLinea
      );

    });


  document
    .querySelectorAll(
      '.lane-option[data-lane-group="match"]'
    )
    .forEach(button => {

      button.classList.toggle(
        "is-active",
        button.dataset.lane ===
        partidaLinea
      );

    });

}


/* =======================================================
   MOSTRAR POOL ACTUAL
   ======================================================= */

function mostrarPoolActual() {

  const select =
    document.getElementById(
      "poolLinea"
    );


  const container =
    document.getElementById(
      "poolTags"
    );


  if (
    !select ||
    !container
  ) {

    return;

  }


  const linea =
    select.value;


  container.innerHTML =
    "";


  const heroes =
    userPool[linea] || [];


  if (
    heroes.length === 0
  ) {

    container.innerHTML =
      `<span class="empty-msg">${txt.emptyPool}</span>`;

    return;

  }


  heroes.forEach(
    (hero, index) => {

      const tag =
        document.createElement(
          "div"
        );

      tag.className =
        "tag";


      const nombre =
        document.createElement(
          "span"
        );

      nombre.textContent =
        hero;


      const eliminar =
        document.createElement(
          "span"
        );

      eliminar.textContent =
        "×";

      eliminar.className =
        "tag-remove";


      eliminar.onclick =
        () =>
          eliminarHeroePool(
            linea,
            index
          );


      tag.appendChild(
        nombre
      );

      tag.appendChild(
        eliminar
      );


      container.appendChild(
        tag
      );

    }
  );

}


/* =======================================================
   AGREGAR HÉROE AL POOL
   ======================================================= */

async function agregarHeroePool() {

  const select =
    document.getElementById(
      "poolLinea"
    );


  const input =
    document.getElementById(
      "nuevoHeroePool"
    );


  if (
    !select ||
    !input
  ) {

    return;

  }

  const baseLista =
    await asegurarHeroesListos();

  if (!baseLista) {
    return;
  }


  const linea =
    select.value;


  const nombreRaw =
    input.value.trim();


  if (!nombreRaw) {
    return;
  }


  const nombreIdentificado =
    identificarHeroe(
      nombreRaw
    );


  if (
    !HERO_DATABASE.some(
      hero =>
        limpiarTexto(hero) ===
        limpiarTexto(
          nombreIdentificado
        )
    )
  ) {

    alert(
      `No reconocí el héroe "${nombreRaw}".`
    );

    return;

  }


  // El pool personal es independiente de la clasificación automática
  // de MLBBHub. Si sabes jugar un héroe en esta línea, puedes agregarlo.


  const yaExiste =
    userPool[linea].some(
      hero =>
        limpiarTexto(hero) ===
        limpiarTexto(
          nombreIdentificado
        )
    );


  if (yaExiste) {

    input.value =
      "";

    return;

  }


  userPool[linea].push(
    nombreIdentificado
  );


  guardarPool();


  input.value =
    "";


  mostrarPoolActual();

}


/* =======================================================
   ELIMINAR HÉROE DEL POOL
   ======================================================= */

function eliminarHeroePool(
  linea,
  index
) {

  if (
    !userPool[linea]
  ) {

    return;

  }


  userPool[linea].splice(
    index,
    1
  );


  guardarPool();


  mostrarPoolActual();

}


/* =======================================================
   ESCAPAR HTML
   ======================================================= */

function escapeHtml(text) {

  return String(text ?? "")
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* =======================================================
   MODAL DE ANÁLISIS
   ======================================================= */

function mostrarModalAnalisis() {

  const modal =
    document.getElementById(
      "analysisOverlay"
    );


  if (!modal) {
    return;
  }


  modal.classList.add(
    "is-visible"
  );

  document.body.classList.add(
    "analysis-open"
  );

}


function ocultarModalAnalisis() {

  const modal =
    document.getElementById(
      "analysisOverlay"
    );


  if (modal) {

    modal.classList.remove(
      "is-visible"
    );

  }


  document.body.classList.remove(
    "analysis-open"
  );

}


/* =======================================================
   BUSCAR COUNTER
   ======================================================= */

async function esperarMinimoAnalisis(
  inicio
) {
  const minimo = 2500;

  const transcurrido =
    performance.now() - inicio;

  if (transcurrido >= minimo) {
    return;
  }

  await new Promise(
    resolve =>
      setTimeout(
        resolve,
        minimo - transcurrido
      )
  );
}


async function buscarCounter() {

  const partidaSelect =
    document.getElementById(
      "partidaLinea"
    );


  const enemigoInput =
    document.getElementById(
      "enemigoPick"
    );


  if (
    !partidaSelect ||
    !enemigoInput
  ) {

    return;

  }


  const linea =
    partidaSelect.value;


  const inputEnemigo =
    enemigoInput.value.trim();


  if (!inputEnemigo) {

    alert(
      txt.enterEnemy
    );

    return;

  }


  /*
     La base central preparada debe estar lista
     antes de reconocer o validar cualquier héroe.
     Esto elimina la carrera entre carga e interacción.
  */

  const baseLista =
    await asegurarHeroesListos();

  if (!baseLista) {
    return;
  }


  const enemigoFinal =
    identificarHeroe(
      inputEnemigo
    );


  const pool =
    userPool[linea] || [];


  const resultados =
    document.getElementById(
      "resultadosCounter"
    );


  const poolResult =
    document.getElementById(
      "poolResult"
    );


  const generalResult =
    document.getElementById(
      "generalResult"
    );


  if (
    !resultados ||
    !poolResult ||
    !generalResult
  ) {

    return;

  }


  /*
     =====================================================
     ESTADO DE ANÁLISIS
     =====================================================
  */

  mostrarModalAnalisis();

  const analysisStartedAt =
    performance.now();


  const analyzeButton =
    document.getElementById(
      "t-btnAnalyze"
    );


  if (analyzeButton) {

    analyzeButton.disabled =
      true;

    analyzeButton.classList.add(
      "is-loading"
    );

    analyzeButton.dataset.originalText =
      analyzeButton.innerHTML;

    analyzeButton.innerHTML =
      `
        <span class="analysis-spinner"></span>
        Analizando...
      `;

  }


  resultados.style.display =
    "block";


  const fuzzyNotice =
    limpiarTexto(
      enemigoFinal
    ) !==
    limpiarTexto(
      inputEnemigo
    )

      ? `
        <div class="fuzzy-notice">
          ${txt.fuzzyFound}
          <strong>
            ${escapeHtml(enemigoFinal)}
          </strong>
        </div>
        `

      : "";


  try {

    const heroReconocido =
      HERO_DATABASE.some(
        hero =>
          limpiarTexto(hero) ===
          limpiarTexto(enemigoFinal)
      );


    if (!heroReconocido) {

      await finalizarEstadoAnalisis(
        analysisStartedAt
      );

      generalResult.innerHTML =
        `
        <div class="error-result hero-not-found">
          <strong>No pude identificar ese héroe.</strong>
          <p>
            Revisa el nombre e inténtalo nuevamente.
            Puedes escribirlo aunque tenga pequeños errores.
          </p>
        </div>
        `;

      poolResult.innerHTML =
        `
        <div class="error-result hero-not-found">
          CounterBro necesita identificar primero
          el héroe enemigo.
        </div>
        `;

      return;

    }


    const apiCounters =
      (await consultarCountersRone(enemigoFinal)).counters;


    const resultsEnemy =
      document.getElementById(
        "resultsEnemy"
      );

    const resultsLane =
      document.getElementById(
        "resultsLane"
      );


    if (resultsEnemy) {
      resultsEnemy.textContent =
        enemigoFinal;
    }


    if (resultsLane) {
      resultsLane.textContent =
        linea.toUpperCase();
    }


    /*
       =====================================================
       FILTRO ESTRICTO DE LÍNEA
       =====================================================

       Este punto es fundamental.

       Aunque la API devuelva un héroe con un
       win rate excelente, CounterBro lo elimina
       si no pertenece a la línea seleccionada.

       NO existe fallback a apiCounters.
    */

    const countersFiltradosPorLinea =
      apiCounters
        .filter(
          counter =>
            counter &&
            counter.name &&
            esHeroeDeLinea(
              counter.name,
              linea
            )
        );


    /*
       =====================================================
       ORDENAR COUNTERS VÁLIDOS
       =====================================================
    */

    countersFiltradosPorLinea.sort(
      (a, b) =>
        parseWinRate(
          b.winRate
        ) -
        parseWinRate(
          a.winRate
        )
    );


    /*
       =====================================================
       BLOQUE GENERAL
       =====================================================
    */

    if (
      countersFiltradosPorLinea.length >
      0
    ) {

      let htmlBloque =
        fuzzyNotice;


      htmlBloque +=
        `
        <div class="result-context">
          <strong>
            Counters válidos para ${escapeHtml(
              linea.toUpperCase()
            )}
          </strong>
          <span>
            ${countersFiltradosPorLinea.length}
            opción(es) verificadas
          </span>
        </div>
        `;


      countersFiltradosPorLinea
        .slice(0, 6)
        .forEach(
          (counter, index) => {

            const reasonHtml =
              counter.reason

                ? `
                  <div class="hero-reason">
                    💡 ${escapeHtml(
                      counter.reason
                    )}
                  </div>
                  `

                : "";


            htmlBloque +=
              `
              <div class="item-badge">

                <div class="counter-rank">
                  ${index + 1}
                </div>

                <div class="counter-content">

                  <strong>
                    ${escapeHtml(
                      counter.name
                    )}
                  </strong>

                  <span class="counter-winrate">
                    ${escapeHtml(
                      counter.winRate ??
                      "N/D"
                    )}
                  </span>

                  ${reasonHtml}

                </div>

              </div>
              `;

          }
        );


      generalResult.innerHTML =
        htmlBloque;

    } else {

      generalResult.innerHTML =
        `
        ${fuzzyNotice}

        <div class="empty-result">

          <strong>
            No encontramos counters verificados
            para ${escapeHtml(
              enemigoFinal
            )}.
          </strong>

          <p>
            No mostraremos héroes de otras líneas
            como reemplazo.
          </p>

        </div>
        `;

    }


    /*
       =====================================================
       BLOQUE DEL POOL PERSONAL
       =====================================================
    */

    if (
      pool.length === 0
    ) {

      poolResult.innerHTML =
        `
        ${fuzzyNotice}

        <p class="empty-msg">
          ${txt.emptyPool}
        </p>
        `;

    } else {

      const poolCoincidentes =
        [];


      /*
         El pool personal es una lista de héroes que el usuario
         sabe jugar en esta línea. Por eso puede incluir héroes
         que MLBBHub clasifica actualmente en otra posición.
         
         El bloque general sigue usando el filtro estricto de
         línea. Aquí, en cambio, buscamos en todos los counters
         devueltos por la API para respetar el pool personal.
      */

      pool.forEach(
        miHeroe => {

          const coincidencia =
            apiCounters.find(
              counter =>
                counter &&
                counter.name &&
                limpiarTexto(
                  counter.name
                ) ===
                limpiarTexto(
                  miHeroe
                )
            );


          if (
            coincidencia
          ) {

            poolCoincidentes.push({

              name:
                miHeroe,

              winRate:
                coincidencia.winRate,

              wrValue:
                parseWinRate(
                  coincidencia.winRate
                ),

              reason:
                coincidencia.reason ||
                null

            });

          }

        }
      );


      poolCoincidentes.sort(
        (a, b) =>
          b.wrValue -
          a.wrValue
      );


      if (
        poolCoincidentes.length >
        0
      ) {

        const mejor =
          poolCoincidentes[0];


        const alternativas =
          poolCoincidentes
            .slice(1);


        let htmlPool =
          fuzzyNotice;


        htmlPool +=
          `
          <div class="pool-recommendation">

            <div class="recommendation-label">
              🏆 TU MEJOR PICK
            </div>

            <div class="recommendation-hero">
              ${escapeHtml(
                mejor.name
              )}
            </div>

            <div class="recommendation-meta">

              <span>
                Ventaja: ${escapeHtml(
                  mejor.winRate
                )}
              </span>

              <span>
                Línea:
                ${escapeHtml(
                  linea.toUpperCase()
                )}
              </span>

            </div>

            ${
              mejor.reason
                ? `
                  <div class="hero-reason">
                    💡 ${escapeHtml(
                      mejor.reason
                    )}
                  </div>
                  `
                : ""
            }

          </div>
          `;


        if (
          alternativas.length >
          0
        ) {

          htmlPool +=
            `
            <div class="pool-alternatives">

              <div class="alternatives-title">
                Otras opciones de tu pool
              </div>
            `;


          alternativas.forEach(
            alternativa => {

              htmlPool +=
                `
                <div class="item-badge">

                  <div class="counter-rank">
                    +
                  </div>

                  <div class="counter-content">

                    <strong>
                      ${escapeHtml(
                        alternativa.name
                      )}
                    </strong>

                    <span class="counter-winrate">
                      ${escapeHtml(
                        alternativa.winRate
                      )}
                    </span>

                    ${
                      alternativa.reason
                        ? `
                          <div class="hero-reason">
                            💡 ${escapeHtml(
                              alternativa.reason
                            )}
                          </div>
                          `
                        : ""
                    }

                  </div>

                </div>
                `;

            }
          );


          htmlPool +=
            `
            </div>
            `;

        }


        poolResult.innerHTML =
          htmlPool;

      } else {

        poolResult.innerHTML =
          `
          ${fuzzyNotice}

          <div class="empty-result">

            <strong>
              Ningún héroe de tu pool tiene
              un counter verificado para
              ${escapeHtml(
                linea.toUpperCase()
              )}.
            </strong>

            <p>
              CounterBro no reemplazará esta
              recomendación con un héroe de
              otra línea.
            </p>

          </div>
          `;

      }

    }

  } catch (error) {

    console.error(
      "Error CounterBro:",
      error
    );


    generalResult.innerHTML =
      `
      <div class="error-result">

        <strong>
          No pudimos consultar los counters.
        </strong>

        <p>
          Revisa tu conexión e inténtalo
          nuevamente.
        </p>

      </div>
      `;


    poolResult.innerHTML =
      `
      <div class="error-result">

        No se pudo procesar el matchup.

      </div>
      `;

  }

  await finalizarEstadoAnalisis(
    analysisStartedAt
  );

}


/* =======================================================
   FINALIZAR ESTADO DE ANÁLISIS
   ======================================================= */

async function finalizarEstadoAnalisis(
  analysisStartedAt
) {

  await esperarMinimoAnalisis(
    analysisStartedAt
  );

  const analyzeButton =
    document.getElementById(
      "t-btnAnalyze"
    );


  if (!analyzeButton) {
    return;
  }


  analyzeButton.disabled =
    false;

  ocultarModalAnalisis();


  analyzeButton.classList.remove(
    "is-loading"
  );


  if (
    analyzeButton.dataset.originalText
  ) {

    analyzeButton.innerHTML =
      analyzeButton.dataset.originalText;

    delete analyzeButton.dataset.originalText;

  }

}


/* =======================================================
   REINICIAR BÚSQUEDA
   ======================================================= */

function reiniciarBusqueda() {

  const enemigo =
    document.getElementById(
      "enemigoPick"
    );


  const resultados =
    document.getElementById(
      "resultadosCounter"
    );


  if (enemigo) {

    enemigo.value =
      "";

  }


  if (resultados) {

    resultados.style.display =
      "none";

  }

}


/* =======================================================
   ENTER PARA ANALIZAR
   ======================================================= */

function activarEnterEnInput() {

  const enemigo =
    document.getElementById(
      "enemigoPick"
    );


  const nuevoHeroe =
    document.getElementById(
      "nuevoHeroePool"
    );


  if (enemigo) {

    enemigo.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Enter"
        ) {

          event.preventDefault();

          buscarCounter();

        }

      }
    );

  }


  if (nuevoHeroe) {

    nuevoHeroe.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Enter"
        ) {

          event.preventDefault();

          agregarHeroePool();

        }

      }
    );

  }

}


/* =======================================================
   INICIALIZACIÓN
   ======================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    aplicarIdioma();

    sincronizarSelectoresDeLinea();

    mostrarPoolActual();

    activarEnterEnInput();

    const baseLista =
      await asegurarHeroesListos();

    if (baseLista) {
      sincronizarSelectoresDeLinea();
      mostrarPoolActual();
    }

  }
);