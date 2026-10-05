const fs = require("fs");
const path = require("path");

const RONE_API_URL =
  "https://arena.rone.dev/api/heroes/positions?size=200&index=1&order=asc&lang=en";

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

  const response = await fetch(
    RONE_API_URL,
    {
      headers: {
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(
      "Rone Arena respondió HTTP " +
      response.status
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

  if (heroes.length < 50) {
    throw new Error(
      "La actualización devolvió solo " +
      heroes.length +
      " héroes."
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
      throw new Error(
        "La línea " +
        lane +
        " tiene solo " +
        lanes[lane].length +
        " héroes."
      );
    }
  });

  const payloadLocal = {
    schemaVersion: 2,
    source: "Rone Arena",
    syncedAt: new Date().toISOString(),
    heroes,
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
