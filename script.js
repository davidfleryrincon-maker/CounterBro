const API_URL = "/api/counter";

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

async function agregarHeroeAPool() {
  const nombreRaw = inputNuevoHeroe.value.trim();
  if (!nombreRaw) return;

  btnAgregarHeroe.disabled = true;
  btnAgregarHeroe.innerText = "Verificando...";

  try {
    // Validar en tiempo real contra mlbbhub a través de la API
    const response = await fetch(`${API_URL}?action=validate_hero`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hero: nombreRaw,
        lane: lineaSeleccionadaPool
      })
    });

    const data = await response.json();

    if (!data.valido) {
      alert(data.mensaje);
      return;
    }

    const heroNombreOficial = data.heroCorregido;

    if (!miPoolPorLineas[lineaSeleccionadaPool]) {
      miPoolPorLineas[lineaSeleccionadaPool] = [];
    }

    if (!miPoolPorLineas[lineaSeleccionadaPool].includes(heroNombreOficial)) {
      miPoolPorLineas[lineaSeleccionadaPool].push(heroNombreOficial);
      guardarPoolEnLocalStorage();
      renderPoolTags();
    } else {
      alert(`El héroe ${heroNombreOficial} ya está en tu pool para ${lineaSeleccionadaPool}.`);
    }

    inputNuevoHeroe.value = "";
    inputNuevoHeroe.focus();

  } catch (error) {
    console.error("Error al agregar héroe:", error);
    alert("Hubo un problema de conexión al validar el héroe.");
  } finally {
    btnAgregarHeroe.disabled = false;
    btnAgregarHeroe.innerText = "Agregar";
  }
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
  const enemigoRaw = inputEnemigo.value.trim();
  const linea = selectLineaMatchup.value;

  if (!enemigoRaw) {
    alert("Por favor, ingresa el nombre del héroe enemigo.");
    inputEnemigo.focus();
    return;
  }

  btnAnalizar.disabled = true;
  btnAnalizar.innerText = "Consultando MLBBHub en tiempo real...";

  const poolActualLinea = miPoolPorLineas[linea] || [];

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "analyze",
        hero: enemigoRaw,
        lane: linea,
        userPool: poolActualLinea
      })
    });

    if (!response.ok) throw new Error("Error en el servidor");

    const data = await response.json();

    if (data.errorInvalido) {
      alert(data.mensaje);
      resultadosSection.classList.add("hidden");
      return;
    }

    // Actualiza el campo de texto con el nombre corregido si aplica
    if (data.heroAnalizado) {
      inputEnemigo.value = data.heroAnalizado;
    }

    mostrarResultados(data, linea);

  } catch (error) {
    console.error("Error analizando matchup:", error);
    alert("Hubo un error de conexión procesando el matchup.");
  } finally {
    btnAnalizar.disabled = false;
    btnAnalizar.innerHTML = "<span>⚡ ANALIZAR MATCHUP Y COUNTERS</span>";
  }
}

function mostrarResultados(data, linea) {
  resultadosSection.classList.remove("hidden");

  // Bloque 1: Tu Pool Personal
  if (data.poolCounter) {
    tituloPoolCounter.innerText = `${data.poolCounter.nombre} (${data.poolCounter.winrate || 'Alta'}% Winrate)`;
    descPoolCounter.innerText = data.poolCounter.razon;
  } else {
    tituloPoolCounter.innerText = "Ningún héroe de tu pool en esta línea";
    descPoolCounter.innerText = `No tienes registrado en tu pool de ${linea} un counter directo para este héroe.`;
  }

  // Bloque 2: Lista de Counters del Meta por Línea
  listaMetaCounters.innerHTML = "";
  if (data.metaCounters && data.metaCounters.length > 0) {
    data.metaCounters.forEach((counter) => {
      const item = document.createElement("div");
      item.className = "meta-counter-item";
      item.style.marginBottom = "10px";
      item.innerHTML = `
        <strong>${counter.nombre}</strong> <span style="color: #10b981; font-size: 0.85rem;">(${counter.winrate})</span>
        <p class="text-muted">${counter.razon}</p>
      `;
      listaMetaCounters.appendChild(item);
    });
  } else {
    listaMetaCounters.innerHTML = `<p class="text-muted">No se encontraron counters válidos para ${linea}.</p>`;
  }

  resultadosSection.scrollIntoView({ behavior: "smooth" });
}
