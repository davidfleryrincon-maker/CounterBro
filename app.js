const VERCEL_URL =
  "https://mlbb-counter-api-five.vercel.app";

const HERO_CACHE_KEY =
  "counterbro_live_heroes";

const HERO_CACHE_TTL_MS =
  6 * 60 * 60 * 1000;


/* =======================================================
   BASE DE HÉROES DE RESPALDO
   =======================================================
   Esta lista conserva el comportamiento estable de CounterBro.
   La sincronización en vivo puede agregar/actualizar datos, pero
   nunca deja la aplicación sin una base funcional si MLBBHub
   falla temporalmente.
   ======================================================= */

const HERO_DATABASE_BASE = [
  "Miya",
  "Balmond",
  "Saber",
  "Alice",
  "Nana",
  "Tigreal",
  "Alucard",
  "Akai",
  "Franco",
  "Bane",
  "Bruno",
  "Clint",
  "Rafaela",
  "Eudora",
  "Zilong",
  "Fanny",
  "Layla",
  "Minotauro",
  "Minotaur",
  "Lolita",
  "Hayabusa",
  "Freya",
  "Gord",
  "Natalia",
  "Kagura",
  "Chou",
  "Sun",
  "Alpha",
  "Ruby",
  "Yi Sun-shin",
  "Moskov",
  "Moscov",
  "Johnson",
  "Cyclops",
  "Estes",
  "Hilda",
  "Aurora",
  "Lapu-Lapu",
  "Vexana",
  "Harley",
  "Irithel",
  "Grock",
  "Argus",
  "Odette",
  "Lancelot",
  "Diggie",
  "Hylos",
  "Zhask",
  "Helcurt",
  "Pharsa",
  "Lesley",
  "Jawhead",
  "Angela",
  "Gusion",
  "Valir",
  "Martis",
  "Uranus",
  "Hanabi",
  "Chang'e",
  "Kaja",
  "Selena",
  "Aldous",
  "Claude",
  "Vale",
  "Leomord",
  "Lunox",
  "Hanzo",
  "Belerick",
  "Kimmy",
  "Thamuz",
  "Harith",
  "Minsitthar",
  "Badang",
  "Khufra",
  "Granger",
  "Guinevere",
  "Esmeralda",
  "Terizla",
  "X.Borg",
  "Ling",
  "Dyrroth",
  "Lylia",
  "Baxia",
  "Masha",
  "Wanwan",
  "Silvanna",
  "Cecilion",
  "Carmilla",
  "Atlas",
  "Popol and Kupa",
  "Yu Zhong",
  "Luo Yi",
  "Benedetta",
  "Khaleed",
  "Barats",
  "Brody",
  "Yve",
  "Mathilda",
  "Paquito",
  "Gloo",
  "Phoveus",
  "Natan",
  "Aulus",
  "Aamon",
  "Valentina",
  "Edith",
  "Yin",
  "Melissa",
  "Xavier",
  "Julian",
  "Fredrinn",
  "Joy",
  "Novaria",
  "Arlott",
  "Ixia",
  "Nolan",
  "Cici",
  "Chip",
  "Zhuxin",
  "Lukas",
  "Suyu",
  "Suyou",
  "Kaela",
  "Calea",
  "Gatotkaca",
  "Beatrix",
  "Karina",
  "Marcel",
  "Kadita",
  "Faramis",
  "Floryn",
  "Hirara"
];




const HERO_LANES_BASE = {

  exp: [
    "Balmond",
    "Zilong",
    "Chou",
    "Sun",
    "Alpha",
    "Ruby",
    "Hilda",
    "Lapu-Lapu",
    "Argus",
    "Jawhead",
    "Martis",
    "Uranus",
    "Aldous",
    "Leomord",
    "Thamuz",
    "Minsitthar",
    "Badang",
    "Guinevere",
    "Esmeralda",
    "Terizla",
    "X.Borg",
    "Dyrroth",
    "Masha",
    "Silvanna",
    "Yu Zhong",
    "Benedetta",
    "Khaleed",
    "Barats",
    "Paquito",
    "Gloo",
    "Phoveus",
    "Aulus",
    "Edith",
    "Yin",
    "Julian",
    "Fredrinn",
    "Joy",
    "Arlott",
    "Cici",
    "Lukas",
    "Suyu",
    "Suyou",
    "Alice",
    "Bane",
    "Gatotkaca"
  ],

  mid: [
    "Alice",
    "Nana",
    "Eudora",
    "Gord",
    "Kagura",
    "Cyclops",
    "Aurora",
    "Vexana",
    "Odette",
    "Pharsa",
    "Valir",
    "Chang'e",
    "Vale",
    "Lunox",
    "Harith",
    "Lylia",
    "Cecilion",
    "Luo Yi",
    "Yve",
    "Valentina",
    "Xavier",
    "Novaria",
    "Zhuxin",
    "Julian",
    "Zhask",
    "Kadita",
    "Faramis"
  ],

  gold: [
    "Miya",
    "Bruno",
    "Clint",
    "Layla",
    "Moskov",
    "Moscov",
    "Irithel",
    "Lesley",
    "Hanabi",
    "Claude",
    "Kimmy",
    "Granger",
    "Wanwan",
    "Brody",
    "Natan",
    "Melissa",
    "Ixia",
    "Popol and Kupa",
    "Harith",
    "Lunox",
    "Alice",
    "Beatrix"
  ],

  jungle: [
    "Saber",
    "Alucard",
    "Fanny",
    "Hayabusa",
    "Freya",
    "Yi Sun-shin",
    "Harley",
    "Lancelot",
    "Helcurt",
    "Gusion",
    "Hanzo",
    "Ling",
    "Baxia",
    "Aamon",
    "Nolan",
    "Barats",
    "Martis",
    "Alpha",
    "Julian",
    "Balmond",
    "Bane",
    "Jawhead",
    "Paquito",
    "Fredrinn",
    "Dyrroth",
    "Gloo",
    "Chou",
    "Popol and Kupa",
    "Karina",
    "Lukas",
    "Suyu",
    "Suyou",
    "Hirara"
  ],

  roam: [
    "Tigreal",
    "Akai",
    "Franco",
    "Rafaela",
    "Minotauro",
    "Minotaur",
    "Lolita",
    "Natalia",
    "Johnson",
    "Estes",
    "Grock",
    "Diggie",
    "Hylos",
    "Angela",
    "Kaja",
    "Selena",
    "Belerick",
    "Khufra",
    "Carmilla",
    "Atlas",
    "Mathilda",
    "Chip",
    "Chou",
    "Jawhead",
    "Edith",
    "Minsitthar",
    "Hilda",
    "Valir",
    "Gatotkaca",
    "Kadita",
    "Marcel",
    "Faramis",
    "Floryn"
  ]

};




let HERO_DATABASE = [];
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
]

function aplicarDatosDeHeroes(data) {
  const lanesValidas = [
    "exp",
    "mid",
    "gold",
    "jungle",
    "roam"
  ];

  const nuevasLanes = {};

  lanesValidas.forEach(linea => {
    const heroesDeLinea =
      Array.isArray(data?.lanes?.[linea])
        ? data.lanes[linea].filter(Boolean)
        : [];

    if (heroesDeLinea.length < 5) {
      throw new Error(
        "La base preparada no tiene suficientes héroes para " +
        linea +
        "."
      );
    }

    nuevasLanes[linea] =
      Array.from(new Set(heroesDeLinea));
  });

  const heroes =
    Array.isArray(data?.heroes)
      ? data.heroes.filter(Boolean)
      : [];

  if (heroes.length < 50) {
    throw new Error(
      "La base preparada de héroes no es suficiente."
    );
  }

  HERO_LANES = nuevasLanes;
  HERO_DATABASE =
    Array.from(new Set([
      ...heroes,
      ...Object.values(nuevasLanes).flat()
    ]));

  heroesReady = true;
}

function actualizarFraseStartup() {
  const thought =
    document.getElementById("startupThought");

  if (!thought) {
    return;
  }

  const index =
    Math.floor(
      Math.random() *
      STARTUP_THOUGHTS.length
    );

  thought.textContent =
    "“" +
    STARTUP_THOUGHTS[index] +
    "”";
}

function iniciarAnimacionStartup() {
  actualizarFraseStartup();

  if (startupThoughtTimer) {
    clearInterval(
      startupThoughtTimer
    );
  }

  startupThoughtTimer =
    setInterval(
      actualizarFraseStartup,
      1500
    );

  return startupThoughtTimer;
}

function actualizarEstadoStartup(
  texto,
  estado = "loading"
) {
  const overlay =
    document.getElementById(
      "startupOverlay"
    );

  const status =
    document.getElementById(
      "startupStatus"
    );

  const progressText =
    document.getElementById(
      "startupProgressText"
    );

  if (overlay) {
    overlay.classList.toggle(
      "is-error",
      estado === "error"
    );
  }

  if (status) {
    status.innerHTML =
      `<span></span>${escapeHtml(texto)}`;
  }

  if (progressText) {
    progressText.textContent =
      estado === "error"
        ? "REINTENTO NECESARIO"
        : "SINCRONIZANDO DATOS";
  }
}

function mostrarStartupOverlay() {
  const overlay =
    document.getElementById(
      "startupOverlay"
    );

  if (!overlay) {
    return;
  }

  overlay.classList.add(
    "is-visible"
  );

  overlay.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "startup-open"
  );
}

async function activarBotonEntradaStartup() {
  const startupButton =
    document.getElementById(
      "startupEnterButton"
    );

  if (startupButton) {
    startupButton.disabled = true;
    startupButton.textContent =
      "CARGANDO DATOS";
  }

  await new Promise(
    resolve =>
      setTimeout(
        resolve,
        5000
      )
  );

  if (startupButton) {
    startupButton.disabled = false;
    startupButton.textContent =
      "TODO LISTO. COMENCEMOS.";
  }

  actualizarEstadoStartup(
    "Bases de datos cargadas. CounterBro está listo."
  );
}


function entrarACounterBro() {
  const startupButton =
    document.getElementById(
      "startupEnterButton"
    );

  if (
    startupButton &&
    startupButton.disabled
  ) {
    return;
  }

  if (startupThoughtTimer) {
    clearInterval(
      startupThoughtTimer
    );

    startupThoughtTimer = null;
  }

  ocultarStartupOverlay();
}


function ocultarStartupOverlay() {
  const overlay =
    document.getElementById(
      "startupOverlay"
    );

  if (!overlay) {
    return;
  }

  overlay.classList.remove(
    "is-visible",
    "is-error"
  );

  overlay.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "startup-open"
  );
}

function mostrarErrorStartup() {
  const overlay =
    document.getElementById(
      "startupOverlay"
    );

  if (!overlay) {
    return;
  }

  actualizarEstadoStartup(
    "No pude cargar la base preparada. Puedes recargar la página.",
    "error"
  );

  const thought =
    document.getElementById(
      "startupThought"
    );

  if (thought) {
    thought.textContent =
      "“Algo salió mal... dame otro intento y vuelvo a pensar.”";
  }

  overlay.classList.add(
    "is-visible",
    "is-error"
  );

  overlay.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "startup-open"
  );
}

async function cargarHeroesDesdeCache() {
  try {
    const raw =
      localStorage.getItem(
        HERO_CACHE_KEY
      );

    if (!raw) {
      return false;
    }

    const cache =
      JSON.parse(raw);

    if (
      !cache ||
      !cache.savedAt ||
      !cache.data
    ) {
      return false;
    }

    if (
      Date.now() -
      cache.savedAt >
      HERO_CACHE_TTL_MS
    ) {
      localStorage.removeItem(
        HERO_CACHE_KEY
      );

      return false;
    }

    aplicarDatosDeHeroes(
      cache.data
    );

    console.info(
      "CounterBro: usando la última base preparada guardada localmente.",
      {
        heroes:
          HERO_DATABASE.length,
        savedAt:
          cache.savedAt
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

async function cargarBasePreparada() {
  const response =
    await fetch(
      `${VERCEL_URL}/?getHeroes=true`,
      {
        cache: "no-store"
      }
    );

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}`
    );
  }

  const data =
    await response.json();

  if (
    !data ||
    !Array.isArray(data.heroes) ||
    !data.lanes
  ) {
    throw new Error(
      "Respuesta de base preparada inválida."
    );
  }

  aplicarDatosDeHeroes(
    data
  );

  localStorage.setItem(
    HERO_CACHE_KEY,
    JSON.stringify({
      savedAt:
        Date.now(),
      data
    })
  );

  console.info(
    "CounterBro: base preparada recibida.",
    {
      heroes:
        HERO_DATABASE.length,
      lanes: {
        exp:
          HERO_LANES.exp.length,
        mid:
          HERO_LANES.mid.length,
        gold:
          HERO_LANES.gold.length,
        jungle:
          HERO_LANES.jungle.length,
        roam:
          HERO_LANES.roam.length
      },
      source:
        data.source || null,
      syncedAt:
        data.syncedAt || null
    }
  );

  return true;
}

async function inicializarBaseDeHeroes() {
  mostrarStartupOverlay();

  iniciarAnimacionStartup();

  actualizarEstadoStartup(
    "Verificando la base de héroes"
  );

  const inicio =
    performance.now();

  try {
    const cacheValida =
      await cargarHeroesDesdeCache();

    if (cacheValida) {
      actualizarEstadoStartup(
        "Base local encontrada. Confirmando datos preparados..."
      );
    }

    await cargarBasePreparada();

    const tiempo =
      Math.round(
        performance.now() -
        inicio
      );

    const loader =
      document.getElementById(
        "startupLoader"
      );

    if (loader) {
      loader.classList.add(
        "is-ready"
      );
    }

    actualizarEstadoStartup(
      `Base lista · ${HERO_DATABASE.length} héroes disponibles`
    );

    const progressText =
      document.getElementById(
        "startupProgressText"
      );

    if (progressText) {
      progressText.textContent =
        `SISTEMA LISTO · ${tiempo} MS`;
    }

    await activarBotonEntradaStartup();

    return true;

  } catch (error) {
    console.error(
      "CounterBro: no fue posible cargar la base preparada.",
      error
    );

    if (
      HERO_DATABASE.length > 0 &&
      Object.values(HERO_LANES)
        .every(
          heroes =>
            Array.isArray(heroes) &&
            heroes.length >= 5
        )
    ) {
      actualizarEstadoStartup(
        "Usando la última base válida disponible..."
      );

      await activarBotonEntradaStartup();

      return true;
    }

    /*
       Si la base preparada no está disponible y tampoco
       tenemos una cache local válida, usamos la base de
       respaldo integrada en CounterBro.

       Esto evita bloquear toda la aplicación por una
       caída temporal del backend de sincronización.
    */
    try {
      aplicarDatosDeHeroes({
        heroes: HERO_DATABASE_BASE,
        lanes: HERO_LANES_BASE,
        source: "CounterBro fallback"
      });

      actualizarEstadoStartup(
        "Usando la base de respaldo integrada..."
      );

      await activarBotonEntradaStartup();

      return true;

    } catch (fallbackError) {
      console.error(
        "CounterBro: tampoco fue posible activar la base de respaldo.",
        fallbackError
      );

      mostrarErrorStartup();

      return false;
    }

  }
}

function asegurarHeroesListos() {
  if (heroesReady) {
    return Promise.resolve(true);
  }

  if (!heroesReadyPromise) {
    heroesReadyPromise =
      inicializarBaseDeHeroes();
  }

  return heroesReadyPromise;
}


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


  if (
    !esHeroeDeLinea(
      nombreIdentificado,
      linea
    )
  ) {

    alert(
      `${nombreIdentificado} no está registrado como héroe de la línea ${linea.toUpperCase()}.`
    );

    return;

  }


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


    const response =
      await fetch(
        `${VERCEL_URL}/?hero=${encodeURIComponent(
          enemigoFinal
        )}&lane=${encodeURIComponent(
          linea
        )}`
      );


    if (
      !response.ok
    ) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    const apiCounters =
      Array.isArray(
        data.counters
      )
        ? data.counters
        : [];


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
         Solo buscamos dentro de:
         1. Los héroes que el usuario tiene en su pool.
         2. Los counters devueltos por la API.
         3. Los counters que pasaron el filtro
            obligatorio de línea.
      */

      pool.forEach(
        miHeroe => {

          if (
            !esHeroeDeLinea(
              miHeroe,
              linea
            )
          ) {

            return;

          }


          const coincidencia =
            countersFiltradosPorLinea.find(
              counter =>
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