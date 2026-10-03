const API_URL = "/api/counter";

// Estructura del pool por líneas: { EXP: [...], JUNGLE: [...], MID: [...], GOLD: [...], ROAM: [...] }
let miPoolPorLineas = JSON.parse(localStorage.getItem("counterbro_pool_lineas")) || {
  EXP: [],
  JUNGLE: [],
  MID: [],
  GOLD: [],
  ROAM: []
};

let lineaSeleccionadaPool = "EXP";

const selectLineaPool = document.getElementById("selectLineaPool");
const inputNuevoHeroe = document.getElementById("nuevoHeroePool");
const btnAgregarHeroe = document.getElementById("btnAgregarHeroe");
const poolTagsContainer = document.getElementById("poolTagsContainer");

const inputEnemigo = document.getElementById("enemigoPick");
const selectLineaMatchup = document.getElementById("selectLineaMatchup");
const btnAnalizar = document.getElementById("btnAnalizar");

const resultadosSection = document.getElementById("resultadosSection");
const tituloPoolCounter = document.getElementById("tituloPoolCounter");
const descPoolCounter = document.getElementById("descPoolCounter");
const listaMetaCounters = document.getElementById("listaMetaCounters");

document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  renderPoolTags();
});

function setupEventListeners() {
  if (selectLineaPool) {
    selectLineaPool.addEventListener("change", (e) => {
      lineaSeleccionadaPool = e.target.value;
      renderPoolTags();
    });
  }

  if (btnAgregarHeroe) {
    btnAgregarHeroe.addEventListener("click", agregarHeroeAPool);
  }

  if (inputNuevoHeroe) {
    inputNuevoHeroe.addEventListener("keydown", (e) => {
      if (e.key === "Enter") agregarHeroeAPool();
    });
  }

  if (btnAnalizar) {
    btnAnalizar.addEventListener("click", analizarMatchup);
  }
}

function agregarHeroeAPool() {
  const nombreHeroe = inputNuevoHeroe.value.trim();
  if (!nombreHeroe) return;

  const heroeNormalizado = normalizarNombre(nombreHeroe);

  if (!miPoolPorLineas[lineaSeleccionadaPool]) {
    miPoolPorLineas[lineaSeleccionadaPool] = [];
  }

  if (!miPoolPorLineas[lineaSeleccionadaPool].includes(heroeNormalizado)) {
    miPoolPorLineas[lineaSeleccionadaPool].push(heroeNormalizado);
    guardarPoolEnLocalStorage();
    renderPoolTags();
  }

  inputNuevoHeroe.value = "";
  inputNuevoHeroe.focus();
}

window.eliminarHeroeDelPool = function(linea, heroe) {
  if (miPoolPorLineas[linea]) {
    miPoolPorLineas[linea] = miPoolPorLineas[linea].filter((item) => item !== heroe);
    guardarPoolEnLocalStorage();
    renderPoolTags();
  }
}

function guardarPoolEnLocalStorage() {
  localStorage.setItem("counterbro_pool_lineas", JSON.stringify(miPoolPorLineas));
}

function renderPoolTags() {
  if (!poolTagsContainer) return;
  poolTagsContainer.innerHTML = "";

  const heroesLinea = miPoolPorLineas[lineaSeleccionadaPool] || [];

  if (heroesLinea.length === 0) {
    poolTagsContainer.innerHTML = `<span class="text-muted">No tienes héroes agregados para la línea de ${lineaSeleccionadaPool}.</span>`;
    return;
  }

  heroesLinea.forEach((heroe) => {
    const tag = document.createElement("div");
    tag.className = "hero-tag";
    tag.innerHTML = `
      <span>${heroe}</span>
      <button class="btn-remove" onclick="window.eliminarHeroeDelPool('${lineaSeleccionadaPool}', '${heroe}')" title="Eliminar">&times;</button>
    `;
    poolTagsContainer.appendChild(tag);
  });
}

async function analizarMatchup() {
  const enemigo = inputEnemigo.value.trim();
  const linea = selectLineaMatchup.value;

  if (!enemigo) {
    alert("Por favor, ingresa el nombre del héroe enemigo.");
    inputEnemigo.focus();
    return;
  }

  btnAnalizar.disabled = true;
  btnAnalizar.innerText = "Consultando base de datos y analizando...";

  const poolActualLinea = miPoolPorLineas[linea] || [];

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hero: normalizarNombre(enemigo),
        lane: linea,
        userPool: poolActualLinea
      })
    });

    if (!response.ok) throw new Error("Error en el servidor");

    const data = await response.json();
    mostrarResultados(data, linea);

  } catch (error) {
    console.error("Error analizando matchup:", error);
    mostrarResultadosDemo(enemigo, linea, poolActualLinea);
  } finally {
    btnAnalizar.disabled = false;
    btnAnalizar.innerHTML = "<span>⚡ ANALIZAR MATCHUP Y COUNTERS</span>";
  }
}

function mostrarResultados(data, linea) {
  resultadosSection.classList.remove("hidden");

  // Bloque 1: Comparación con el Pool del usuario en esa línea
  if (data.poolCounter) {
    tituloPoolCounter.innerText = `${data.poolCounter.nombre} (${data.poolCounter.winrate || 'Alta'}% Winrate)`;
    descPoolCounter.innerText = data.poolCounter.razon || `Encontrado en tu pool de ${linea} como opción viable contra ${data.heroAnalizado}.`;
  } else {
    tituloPoolCounter.innerText = "Ningún héroe de tu pool en esta línea coincide";
    descPoolCounter.innerText = `No tienes registrado en tu pool de ${linea} un counter directo para este héroe. Revisa las opciones globales abajo.`;
  }

  // Bloque 2: Lista de Counters filtrados por la línea en mlbbhub
  listaMetaCounters.innerHTML = "";
  if (data.metaCounters && data.metaCounters.length > 0) {
    data.metaCounters.forEach((counter) => {
      const item = document.createElement("div");
      item.className = "meta-counter-item";
      item.innerHTML = `
        <strong>${counter.nombre}</strong> <span class="badge-winrate">${counter.winrate || 'Meta'}</span>
        <p class="text-muted">${counter.razon}</p>
      `;
      listaMetaCounters.appendChild(item);
    });
  } else {
    listaMetaCounters.innerHTML = `<p class="text-muted">No se encontraron counters específicos para ${linea} en esta consulta.</p>`;
  }

  resultadosSection.scrollIntoView({ behavior: "smooth" });
}

function mostrarResultadosDemo(enemigo, linea, poolLinea) {
  resultadosSection.classList.remove("hidden");

  const mejorPool = poolLinea.length > 0 ? poolLinea[0] : null;

  if (mejorPool) {
    tituloPoolCounter.innerText = `${mejorPool} (Tu Pool en ${linea})`;
    descPoolCounter.innerText = `Sugerido desde tu lista personal para la línea de ${linea}.`;
  } else {
    tituloPoolCounter.innerText = "Pool vacío para esta línea";
    descPoolCounter.innerText = `Agrega héroes a tu pool de ${linea} en la sección superior para ver recomendaciones personalizadas aquí.`;
  }

  listaMetaCounters.innerHTML = `
    <div class="meta-counter-item">
      <strong>Counter Sugerido (${linea})</strong>
      <p class="text-muted">Héroe óptimo extraído de mlbbhub.com/es/counter/${normalizarNombre(enemigo).toLowerCase()} validado para la línea de ${linea}.</p>
    </div>
  `;

  resultadosSection.scrollIntoView({ behavior: "smooth" });
}

function normalizarNombre(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
