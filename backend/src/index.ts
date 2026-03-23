import { fileURLToPath } from 'url';
import db from './database.ts';
import { createTrafficApp } from './appFactory.ts';

const port = Number(process.env.PORT ?? 3001);
const entryFile = process.argv[1];
const isEntryPoint = Boolean(entryFile) && fileURLToPath(import.meta.url) === entryFile;
const trafficApp = createTrafficApp({
  db,
  enableSimulation: isEntryPoint,
});

export const app = trafficApp.app;
export const runSimulationTick = trafficApp.runSimulationTick;

if (isEntryPoint) {
  const server = app.listen(port, () => {
    console.log(`DATFO server running at http://localhost:${port}`);
  });

  const shutdown = () => {
    trafficApp.close();
    server.close(() => {
      db.close();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
