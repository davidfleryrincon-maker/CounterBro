const API_URL = "/api/counter";
let miPool = JSON.parse(localStorage.getItem("mlbb_user_pool")) || [];

const inputNuevoHeroe = document.getElementById("nuevoHeroePool");
const btnAgregarHeroe = document.getElementById("btnAgregarHeroe");
const poolTagsContainer = document.getElementById("poolTagsContainer");

const inputEnemigo = document.getElementById("enemigoPick");
const selectRol = document.getElementById("rolFiltro");
const btnAnalizar = document.getElementById("btnAnalizar");

const resultadosSection = document.getElementById("resultadosSection");
const tituloPoolCounter = document.getElementById("tituloPoolCounter");
const descPoolCounter = document.getElementById("descPoolCounter");
const tituloMetaCounter = document.getElementById("tituloMetaCounter");
const descMetaCounter = document.getElementById("descMetaCounter");

document.addEventListener("DOMContentLoaded", () => {
  renderPoolTags();
  setupEventListeners();
});

function setupEventListeners() {
  btnAgregarHeroe.addEventListener("click", agregarHeroeAPool);
  inputNuevoHeroe.addEventListener("keydown", (e) => {
    if (e.key === "Enter") agregarHeroeAPool();
  });

  btnAnalizar.addEventListener("click", analizarMatchup);
  inputEnemigo.addEventListener("keydown", (e) => {
    if (e.key === "Enter") analizarMatchup();
  });
}

function agregarHeroeAPool() {
  const nombreHeroe = inputNuevoHeroe.value.trim();
  if (!nombreHeroe) return;

  const heroeNormalizado = normalizarNombre(nombreHeroe);

  if (!miPool.includes(heroeNormalizado)) {
    miPool.push(heroeNormalizado);
    guardarPoolEnLocalStorage();
    renderPoolTags();
  }

  inputNuevoHeroe.value = "";
  inputNuevoHeroe.focus();
}

window.eliminarHeroeDelPool = function(heroe) {
  miPool = miPool.filter((item) => item !== heroe);
  guardarPoolEnLocalStorage();
  renderPoolTags();
}

function guardarPoolEnLocalStorage() {
  localStorage.setItem("mlbb_user_pool", JSON.stringify(miPool));
}

function renderPoolTags() {
  poolTagsContainer.innerHTML = "";

  if (miPool.length === 0) {
    poolTagsContainer.innerHTML = `<span class="text-muted">No has agregado héroes a tu pool aún.</span>`;
    return;
  }

  miPool.forEach((heroe) => {
    const tag = document.createElement("div");
    tag.className = "hero-tag";
    tag.innerHTML = `
      <span>${heroe}</span>
      <button class="btn-remove" onclick="window.eliminarHeroeDelPool('${heroe}')" title="Eliminar">&times;</button>
    `;
    poolTagsContainer.appendChild(tag);
  });
}

async function analizarMatchup() {
  const enemigo = inputEnemigo.value.trim();
  const rol = selectRol.value;

  if (!enemigo) {
    alert("Por favor, ingresa el nombre del héroe enemigo.");
    inputEnemigo.focus();
    return;
  }

  btnAnalizar.disabled = true;
  btnAnalizar.innerText = "Calculando counters...";

  try {
    const response = await fetch(`${API_URL}?hero=${encodeURIComponent(enemigo)}&lane=${encodeURIComponent(rol)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hero: normalizarNombre(enemigo),
        lane: rol,
        userPool: miPool
      })
    });

    if (!response.ok) throw new Error("Error en la respuesta del servidor");

    const data = await response.json();
    mostrarResultados(data);

  } catch (error) {
    console.error("Error consultando el matchup:", error);
    mostrarResultadosDemo(enemigo);
  } finally {
    btnAnalizar.disabled = false;
    btnAnalizar.innerHTML = "<span>⚡ ANALIZAR MATCHUP</span>";
  }
}

function mostrarResultados(data) {
  resultadosSection.classList.remove("hidden");

  if (data.poolCounter) {
    tituloPoolCounter.innerText = `${data.poolCounter.nombre} (Winrate: ${data.poolCounter.winrate || 'N/A'}%)`;
    descPoolCounter.innerText = data.poolCounter.razon || "Héroe ideal dentro de tu pool disponible.";
  } else {
    tituloPoolCounter.innerText = "Sin picks recomendados en tu Pool";
    descPoolCounter.innerText = "Ningún héroe de tu pool actual tiene ventaja clara contra este pick.";
  }

  if (data.metaCounter) {
    tituloMetaCounter.innerText = `${data.metaCounter.nombre} (Winrate Meta: ${data.metaCounter.winrate || 'N/A'}%)`;
    descMetaCounter.innerText = data.metaCounter.razon || "El mejor counter global según el meta actual.";
  } else {
    tituloMetaCounter.innerText = "Khufra / Diggie";
    descMetaCounter.innerText = "Counters generales recomendados.";
  }

  resultadosSection.scrollIntoView({ behavior: "smooth" });
}

function mostrarResultadosDemo(enemigo) {
  resultadosSection.classList.remove("hidden");
  const poolHeroe = miPool.length > 0 ? miPool[0] : "Ninguno";
  
  tituloPoolCounter.innerText = `${poolHeroe}`;
  descPoolCounter.innerText = `Opción seleccionada desde tu pool local contra ${normalizarNombre(enemigo)}.`;

  tituloMetaCounter.innerText = `Diggie / Chou`;
  descMetaCounter.innerText = `Mejores counters globales del meta actual contra ${normalizarNombre(enemigo)}.`;

  resultadosSection.scrollIntoView({ behavior: "smooth" });
}

function normalizarNombre(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
