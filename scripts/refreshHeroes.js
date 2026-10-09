const fs = require("fs");
const path = require("path");

const RONE_API_URLS = [
  "https://arena-hv.fastapicloud.dev/api/heroes/positions?size=200&index=1&order=asc&lang=en",
  "https://arena.rone.dev/api/heroes/positions?size=200&index=1&order=asc&lang=en"
];

const OUTPUT_PATH =
  path.join(
    __dirname,
    "..",
    "data",
    "heroes.json"
  );

function laneKey(value) {
  const text = String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    text.includes("jungle") ||
    text.includes("jungler")
  ) return "jungle";

  if (
    text.includes("roam") ||
    text.includes("roamer")
  ) return "roam";

  if (
    text.includes("gold") ||
    text.includes("goldlane")
  ) return "gold";

  if (
    text === "mid" ||
    text.includes("midlane") ||
    text.includes("middle")
  ) return "mid";

  if (
    text.includes("exp") ||
    text.includes("explane")
  ) return "exp";

  return null;
}

function extractLanes(record) {
  const roadsort =
    record?.data?.hero?.data?.roadsort;

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
      const lane = laneKey(value);
      if (lane) {
        lanes.add(lane);
      }
    });
  });

  return Array.from(lanes);
}

async function main() {
  console.log(
    "CounterBro: sincronizando catálogo Rone Arena..."
  );

  let response = null;
  let lastRequestError = null;

  for (const url of RONE_API_URLS) {
    try {
      const candidate = await fetch(url, {
        headers: {
          Accept: "application/json"
        }
      });

      if (candidate.ok) {
        response = candidate;
        console.log(
          "CounterBro: catálogo recibido desde " +
          new URL(url).host
        );
        break;
      }

      lastRequestError = new Error(
        new URL(url).host +
        " respondió HTTP " +
        candidate.status
      );
      console.warn(
        "CounterBro: " +
        lastRequestError.message +
        "; probando el siguiente host."
      );
    } catch (error) {
      lastRequestError = error;
      console.warn(
        "CounterBro: fallo de conexión con " +
        new URL(url).host +
        "; probando el siguiente host."
      );
    }
  }

  if (!response) {
    throw new Error(
      "No se pudo obtener el catálogo de Rone Arena desde ninguno de los hosts. " +
      (lastRequestError?.message || "Error desconocido")
    );
  }

  const payload =
    await response.json();

  if (
    payload?.code !== undefined &&
    Number(payload.code) !== 0
  ) {
    throw new Error(
      "Rone Arena code " +
      payload.code +
      ": " +
      (payload.message || "error desconocido")
    );
  }

  const records =
    Array.isArray(payload?.data?.records)
      ? payload.data.records
      : [];

  const heroesById = new Map();

  records.forEach(record => {
    const id =
      Number(record?.data?.hero_id);

    const name =
      String(
        record?.data?.hero?.data?.name || ""
      ).trim();

    if (
      !Number.isFinite(id) ||
      !name
    ) {
      return;
    }

    heroesById.set(
      id,
      {
        id,
        name,
        lanes: extractLanes(record)
      }
    );
  });

  const heroes =
    Array.from(
      heroesById.values()
    ).sort(
      (a, b) =>
        a.name.localeCompare(b.name)
    );

  const expectedTotal =
    Number(payload?.data?.total);

  if (heroes.length < 100) {
    throw new Error(
      "La actualización devolvió solo " +
      heroes.length +
      " héroes."
    );
  }

  if (
    Number.isFinite(expectedTotal) &&
    expectedTotal > 0 &&
    heroes.length !== expectedTotal
  ) {
    throw new Error(
      "La actualización quedó incompleta: Rone reportó " +
      expectedTotal +
      " héroes y se pudieron construir " +
      heroes.length +
      "."
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
    lanes[lane] =
      Array.from(
        new Set(lanes[lane])
      ).sort(
        (a, b) =>
          a.localeCompare(b)
      );

    if (lanes[lane].length < 5) {
      const laneSamples = records.slice(0, 8).map(record => ({
        hero: record?.data?.hero?.data?.name,
        roadsort: record?.data?.hero?.data?.roadsort
      }));
      throw new Error(
        "La línea " +
        lane +
        " tiene solo " +
        lanes[lane].length +
        " héroes. Muestra de roadsort: " +
        JSON.stringify(laneSamples)
      );
    }
  });

  const payloadLocal = {
    heroes: heroes.map(hero => hero.name),
    lanes
  };

  fs.mkdirSync(
    path.dirname(OUTPUT_PATH),
    { recursive: true }
  );

  const temporaryPath =
    OUTPUT_PATH + ".tmp";

  fs.writeFileSync(
    temporaryPath,
    JSON.stringify(
      payloadLocal,
      null,
      2
    ) + "\n",
    "utf8"
  );

  fs.renameSync(
    temporaryPath,
    OUTPUT_PATH
  );

  console.log(
    "CounterBro: catálogo local actualizado.",
    {
      heroes: heroes.length,
      lanes: Object.fromEntries(
        Object.entries(lanes)
          .map(
            ([lane, values]) =>
              [lane, values.length]
          )
      )
    }
  );
}

main().catch(error => {
  console.error(
    "CounterBro: falló la sincronización.",
    error
  );

  process.exit(1);
});
