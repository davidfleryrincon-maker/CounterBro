const VERCEL_URL =
  "https://mlbb-counter-api-five.vercel.app";


/* =========================================================
   BASE DE DATOS DE HÉROES
   ========================================================= */

let HERO_DATABASE = [
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


/* =========================================================
   HÉROES POR LÍNEA
   ========================================================= */

const HERO_LANES = {

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
    "Suyou"
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


/* =========================================================
   IDIOMAS
   ========================================================= */

const i18n = {

  es: {

    addHero:
      "Agregar héroe a esta línea",

    btnAdd:
      "Agregar",

    btnAnalyze:
      "Analizar Counter",

    emptyPool:
      "Tu pool está vacío para esta línea. Agrega héroes arriba.",

    enterEnemy:
      "Por favor, ingresa el nombre del héroe enemigo.",

    fuzzyFound:
      "Interpretado como",

    analyzing:
      "Analizando matchup...",

    live:
      "Consultando counters en vivo...",

    noCounters:
      "No se encontraron counters registrados para este enemigo.",

    noPoolMatch:
      "Ningún héroe de tu pool tiene un counter directo registrado.",

    reset:
      "Analizar otra partida"

  },

  en: {

    addHero:
      "Add hero to this lane",

    btnAdd:
      "Add",

    btnAnalyze:
      "Analyze Counter",

    emptyPool:
      "Your pool is empty for this lane. Add heroes above.",

    enterEnemy:
      "Please enter the enemy hero name.",

    fuzzyFound:
      "Interpreted as",

    analyzing:
      "Analyzing matchup...",

    live:
      "Checking live counters...",

    noCounters:
      "No counters were found for this enemy.",

    noPoolMatch:
      "No hero in your pool has a registered direct counter.",

    reset:
      "Analyze another matchup"

  }

};


const lang =
  window.navigator.language?.startsWith("es")
    ? "es"
    : "en";

const txt =
  i18n[lang];


/* =========================================================
   UTILIDADES
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}


/* =========================================================
   POOL DEL USUARIO
   ========================================================= */

let userPool =
  JSON.parse(
    localStorage.getItem("mlbb_user_pool")
  ) || {

    exp: [],
    mid: [],
    gold: [],
    jungle: [],
    roam: []

  };


function guardarPool() {

  localStorage.setItem(
    "mlbb_user_pool",
    JSON.stringify(userPool)
  );

}


/* =========================================================
   SELECTOR DE LÍNEAS
   ========================================================= */

function seleccionarLinea(grupo, linea) {

  const select =
    $(grupo === "pool"
      ? "poolLinea"
      : "partidaLinea");

  if (!select) return;

  select.value = linea;


  document
    .querySelectorAll(
      `.lane-option[data-lane-group="${grupo}"]`
    )
    .forEach(button => {

      button.classList.toggle(
        "is-active",
        button.dataset.lane === linea
      );

    });


  if (grupo === "pool") {

    mostrarPoolActual();

  }

}


function sincronizarSelectoresDeLinea() {

  seleccionarLinea(
    "pool",
    $("poolLinea")?.value || "exp"
  );

  seleccionarLinea(
    "match",
    $("partidaLinea")?.value || "exp"
  );

}


/* =========================================================
   POOL VISUAL
   ========================================================= */

function mostrarPoolActual() {

  const linea =
    $("poolLinea").value;

  const container =
    $("poolTags");

  const heroes =
    userPool[linea] || [];


  container.innerHTML = "";


  if (!heroes.length) {

    container.innerHTML =
      `<span class="empty-msg">
        ${txt.emptyPool}
      </span>`;

    actualizarPoolCount();

    return;

  }


  heroes.forEach(
    (hero, index) => {

      const tag =
        document.createElement("div");

      tag.className =
        "tag";


      tag.innerHTML = `
        <span>${hero}</span>

        <button
          type="button"
          aria-label="Eliminar ${hero}"
        >
          &times;
        </button>
      `;


      tag
        .querySelector("button")
        .onclick = () =>
          eliminarHeroePool(
            linea,
            index
          );


      container.appendChild(tag);

    }
  );


  actualizarPoolCount();

}


function actualizarPoolCount() {

  const linea =
    $("poolLinea").value;

  const count =
    (userPool[linea] || []).length;

  const element =
    $("poolCount");

  if (element) {

    element.textContent =
      count;

  }

}


/* =========================================================
   AGREGAR / ELIMINAR HÉROES
   ========================================================= */

function agregarHeroePool() {

  const linea =
    $("poolLinea").value;

  const input =
    $("nuevoHeroePool");

  const raw =
    input.value.trim();


  if (!raw) return;


  const hero =
    identificarHeroe(raw);


  if (!userPool[linea]) {

    userPool[linea] = [];

  }


  const existe =
    userPool[linea].some(
      h =>
        limpiarTexto(h) ===
        limpiarTexto(hero)
    );


  if (!existe) {

    userPool[linea].push(hero);

    guardarPool();

  }


  mostrarPoolActual();

  input.value = "";

  input.focus();

}


function eliminarHeroePool(
  linea,
  index
) {

  userPool[linea].splice(
    index,
    1
  );

  guardarPool();

  mostrarPoolActual();

}


/* =========================================================
   LEVENSHTEIN
   ========================================================= */

function levenshtein(a, b) {

  const matrix =
    Array.from(
      {
        length:
          a.length + 1
      },
      (_, i) => [i]
    );


  for (
    let j = 1;
    j <= b.length;
    j++
  ) {

    matrix[0][j] = j;

  }


  for (
    let i = 1;
    i <= a.length;
    i++
  ) {

    for (
      let j = 1;
      j <= b.length;
      j++
    ) {

      matrix[i][j] =
        a[i - 1] === b[j - 1]

          ? matrix[i - 1][j - 1]

          : Math.min(

              matrix[i - 1][j - 1] + 1,

              matrix[i][j - 1] + 1,

              matrix[i - 1][j] + 1

            );

    }

  }


  return matrix[a.length][b.length];

}


/* =========================================================
   NORMALIZACIÓN
   ========================================================= */

function limpiarTexto(str) {

  return String(str || "")
    .toLowerCase()
    .replace(
      /['.\-\s]/g,
      ""
    )
    .trim();

}


/* =========================================================
   IDENTIFICACIÓN DE HÉROE
   ========================================================= */

function identificarHeroe(entrada) {

  if (!entrada)
    return entrada;


  const limpia =
    limpiarTexto(entrada);


  const exacto =
    HERO_DATABASE.find(
      hero =>
        limpiarTexto(hero) ===
        limpia
    );


  if (exacto)
    return exacto;


  let mejor =
    entrada;

  let menor =
    Infinity;


  HERO_DATABASE.forEach(
    hero => {

      const distancia =
        levenshtein(
          limpia,
          limpiarTexto(hero)
        );


      if (distancia < menor) {

        menor =
          distancia;

        mejor =
          hero;

      }

    }
  );


  if (
    menor <= 2 &&
    limpia.length >= 3
  ) {

    return mejor;

  }


  return entrada;

}


/* =========================================================
   VALIDACIÓN DE LÍNEA
   ========================================================= */

function esHeroeDeLinea(
  nombre,
  linea
) {

  const heroes =
    HERO_LANES[linea];


  if (!heroes)
    return true;


  const pertenece =
    heroes.some(
      hero =>
        limpiarTexto(hero) ===
        limpiarTexto(nombre)
    );


  if (pertenece)
    return true;


  const existeEnOtraLinea =
    Object
      .values(HERO_LANES)
      .some(
        list =>
          list.some(
            hero =>
              limpiarTexto(hero) ===
              limpiarTexto(nombre)
          )
      );


  return !existeEnOtraLinea;

}


/* =========================================================
   WIN RATE
   ========================================================= */

function parseWinRate(value) {

  const number =
    parseFloat(
      String(value || "")
        .replace("%", "")
    );


  return Number.isFinite(number)
    ? number
    : 0;

}


/* =========================================================
   ESTADO DE ANÁLISIS
   ========================================================= */

function mostrarEstadoAnalisis() {

  const resultados =
    $("resultadosCounter");


  resultados.style.display =
    "block";


  resultados.classList.add(
    "is-visible"
  );


  $("poolResult").innerHTML = `
    <div class="result-loading">

      <span class="loading-dot"></span>

      ${txt.analyzing}

    </div>
  `;


  $("generalResult").innerHTML = `
    <div class="result-loading">

      <span class="loading-dot"></span>

      ${txt.live}

    </div>
  `;


  $("resultsEnemy").textContent =
    $("enemigoPick").value.trim();


  $("resultsLane").textContent =
    $("partidaLinea")
      .value
      .toUpperCase();


  resultados.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


/* =========================================================
   RESULTADO DEL POOL
   ========================================================= */

function renderPoolResult(
  poolMatches,
  pool,
  enemy,
  fuzzyNotice
) {

  const target =
    $("poolResult");


  if (!poolMatches.length) {

    target.innerHTML = `

      ${fuzzyNotice}

      <div class="no-pool-result">

        <div class="no-pool-icon">
          ◎
        </div>

        <div>

          <strong>
            ${txt.noPoolMatch}
          </strong>

          <p>
            CounterBro puede mostrarte
            las mejores opciones generales
            mientras amplías tu pool.
          </p>

        </div>

      </div>


      <div class="fallback-pick">

        <span>
          Tu héroe principal guardado
        </span>

        <strong>
          ${pool[0] || "—"}
        </strong>

      </div>

    `;

    return;

  }


  const best =
    poolMatches[0];


  const alternatives =
    poolMatches.slice(1, 4);


  target.innerHTML = `

    ${fuzzyNotice}


    <div class="best-pick">


      <div class="best-pick-top">

        <span class="recommendation-label">
          🏆 TU MEJOR PICK
        </span>

        <span class="recommendation-badge">
          ${best.winRate || "—"}
        </span>

      </div>


      <div class="best-pick-name">
        ${best.name}
      </div>


      <div class="best-pick-caption">

        La mejor coincidencia
        dentro de tu pool
        para este matchup.

      </div>


      ${
        best.reason
          ? `

            <div class="reason-box">

              <span>
                💡
              </span>

              <div>

                <strong>
                  Por qué
                </strong>

                <p>
                  ${best.reason}
                </p>

              </div>

            </div>

          `
          : ""
      }

    </div>


    ${
      alternatives.length

        ? `

          <div class="alternatives-title">
            Otras opciones de tu pool
          </div>


          <div class="alternative-list">

            ${alternatives
              .map(
                (item, index) => `

                  <div class="alternative-item">

                    <span class="alternative-rank">
                      ${index + 2}
                    </span>

                    <strong>
                      ${item.name}
                    </strong>

                    <span>
                      ${item.winRate || "—"}
                    </span>

                  </div>

                `
              )
              .join("")}

          </div>

        `

        : ""
    }

  `;

}


/* =========================================================
   RESULTADO GENERAL
   ========================================================= */

function renderGeneralResult(
  list,
  enemy
) {

  const target =
    $("generalResult");


  if (!list.length) {

    target.innerHTML = `

      <div class="empty-result">

        ${txt.noCounters}

        <strong>
          ${enemy}
        </strong>.

      </div>

    `;

    return;

  }


  const best =
    list[0];


  const alternatives =
    list.slice(1, 6);


  target.innerHTML = `

    <div class="general-lead">

      <div>

        <span class="eyebrow">
          META
        </span>

        <strong>
          ${best.name}
        </strong>

      </div>


      <span class="general-rate">
        ${best.winRate || "—"}
      </span>

    </div>


    ${
      best.reason

        ? `

          <div class="reason-box compact">

            <span>
              💡
            </span>

            <div>

              <strong>
                Ventaja del matchup
              </strong>

              <p>
                ${best.reason}
              </p>

            </div>

          </div>

        `

        : ""
    }


    <div class="alternatives-title">
      Alternativas recomendadas
    </div>


    <div class="alternative-list">

      ${alternatives
        .map(
          (item, index) => `

            <div class="alternative-item">

              <span class="alternative-rank">
                ${index + 2}
              </span>

              <strong>
                ${item.name}
              </strong>

              <span>
                ${item.winRate || "—"}
              </span>

            </div>

          `
        )
        .join("")}

    </div>

  `;

}


/* =========================================================
   BUSCAR COUNTER
   ========================================================= */

async function buscarCounter() {

  const linea =
    $("partidaLinea").value;


  const input =
    $("enemigoPick")
      .value
      .trim();


  if (!input) {

    alert(
      txt.enterEnemy
    );

    $("enemigoPick").focus();

    return;

  }


  const enemy =
    identificarHeroe(input);


  const pool =
    userPool[linea] || [];


  mostrarEstadoAnalisis();


  const fuzzyNotice =

    limpiarTexto(enemy) !==
    limpiarTexto(input)

      ? `

        <div class="fuzzy-notice">

          ${txt.fuzzyFound}

          <strong>
            ${enemy}
          </strong>

        </div>

      `

      : "";


  try {

    const response =
      await fetch(

        `${VERCEL_URL}/?hero=${encodeURIComponent(enemy)}&lane=${encodeURIComponent(linea)}`

      );


    if (!response.ok) {

      throw new Error(
        "API error"
      );

    }


    const data =
      await response.json();


    const apiCounters =
      Array.isArray(data.counters)
        ? data.counters
        : [];


    const filtered =
      apiCounters.filter(
        counter =>
          esHeroeDeLinea(
            counter.name,
            linea
          )
      );


    const finalList =
      filtered.length >= 3
        ? filtered
        : apiCounters;


    const poolMatches =
      pool

        .map(hero => {

          const match =
            apiCounters.find(
              counter =>
                limpiarTexto(
                  counter.name
                ) ===
                limpiarTexto(hero)
            );


          if (!match)
            return null;


          return {

            name:
              hero,

            winRate:
              match.winRate,

            wrValue:
              parseWinRate(
                match.winRate
              ),

            reason:
              match.reason ||
              null

          };

        })

        .filter(Boolean)

        .sort(
          (a, b) =>
            b.wrValue -
            a.wrValue
        );


    renderPoolResult(
      poolMatches,
      pool,
      enemy,
      fuzzyNotice
    );


    renderGeneralResult(
      finalList.slice(0, 6),
      enemy
    );


    $("resultsEnemy").textContent =
      enemy;


    $("resultsLane").textContent =
      linea.toUpperCase();


  } catch (error) {

    console.error(error);


    $("generalResult").innerHTML = `

      <div class="error-result">

        No se pudo conectar
        con el servidor de counters.

      </div>

    `;


    $("poolResult").innerHTML = `

      <div class="error-result">

        No se pudo procesar
        la consulta.

      </div>

    `;

  }

}


/* =========================================================
   REINICIAR
   ========================================================= */

function reiniciarBusqueda() {

  $("enemigoPick").value = "";


  $("resultadosCounter").style.display =
    "none";


  $("resultadosCounter").classList.remove(
    "is-visible"
  );


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  $("enemigoPick").focus();

}


/* =========================================================
   IDIOMA
   ========================================================= */

function aplicarIdioma() {

  $("t-addHero").textContent =
    txt.addHero;


  $("t-btnAdd").textContent =
    txt.btnAdd;


  $("t-btnAnalyze").innerHTML = `

    <span>
      ⚡
    </span>

    ${txt.btnAnalyze}

  `;


  $("t-btnReset").textContent =
    `↻ ${txt.reset}`;

}


/* =========================================================
   SINCRONIZAR HÉROES
   ========================================================= */

async function sincronizarHeroesEnVivo() {

  try {

    const response =
      await fetch(
        `${VERCEL_URL}/?getHeroes=true`
      );


    const data =
      await response.json();


    if (
      Array.isArray(data.heroes) &&
      data.heroes.length
    ) {

      HERO_DATABASE =
        [
          ...new Set(
            [
              ...HERO_DATABASE,
              ...data.heroes
            ]
          )
        ];

    }

  } catch (_) {

    /*
      Se mantiene la base local
      si la API no responde.
    */

  }

}


/* =========================================================
   ATAJOS DE TECLADO
   ========================================================= */

$("nuevoHeroePool")
  .addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        agregarHeroePool();

      }

    }
  );


$("enemigoPick")
  .addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        buscarCounter();

      }

    }
  );


/* =========================================================
   SELECTOR POOL
   ========================================================= */

$("poolLinea")
  .addEventListener(
    "change",
    mostrarPoolActual
  );


/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

aplicarIdioma();

sincronizarSelectoresDeLinea();

mostrarPoolActual();

sincronizarHeroesEnVivo();
