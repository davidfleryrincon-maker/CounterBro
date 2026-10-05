const fs = require('fs');
const path = require('path');

const {
  fetchFreshHeroesFromRoneArena
} = require(
  '../api/src/services/roneArenaClient'
);

const OUTPUT_PATH =
  path.join(
    __dirname,
    '..',
    'api',
    'data',
    'heroes.json'
  );

async function main() {
  console.log(
    'CounterBro: iniciando actualización de la base de héroes desde Rone Arena...'
  );

  const data =
    await fetchFreshHeroesFromRoneArena();

  if (
    !data ||
    !Array.isArray(data.heroes) ||
    data.heroes.length < 50
  ) {
    throw new Error(
      'La actualización no produjo una base válida.'
    );
  }

  const lanes = [
    'exp',
    'mid',
    'gold',
    'jungle',
    'roam'
  ];

  for (const lane of lanes) {
    if (
      !Array.isArray(data.lanes?.[lane]) ||
      data.lanes[lane].length < 5
    ) {
      throw new Error(
        'La actualización no tiene una línea válida: ' +
        lane
      );
    }
  }

  const payload = {
    ...data,
    preparedAt:
      new Date().toISOString()
  };

  const temporaryPath =
    OUTPUT_PATH + '.tmp';

  fs.writeFileSync(
    temporaryPath,
    JSON.stringify(
      payload,
      null,
      2
    ) + '\n',
    'utf8'
  );

  fs.renameSync(
    temporaryPath,
    OUTPUT_PATH
  );

  console.log(
    'CounterBro: base actualizada correctamente desde Rone Arena.',
    {
      heroes: data.heroes.length,
      lanes:
        Object.fromEntries(
          lanes.map(
            lane => [
              lane,
              data.lanes[lane].length
            ]
          )
        ),
      syncedAt: data.syncedAt
    }
  );
}

main().catch(error => {
  console.error(
    'CounterBro: falló la actualización de héroes.',
    error
  );

  process.exit(1);
});
