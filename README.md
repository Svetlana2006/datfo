# DATFO

DATFO is a smart traffic management dashboard backed by a single Express + SQLite API. The app now ships with one deployable backend that handles live traffic simulation, signal optimization, emergency detection, green corridor activation, signal state control, AI decision output, and persisted event/history storage.

## Backend Features

- `GET /traffic` and `GET /api/traffic`: live traffic snapshot with vehicle counts, density labels, signal timing, and summary metrics
- `POST /optimize-signal` and `POST /api/optimize-signal`: adaptive signal timing based on traffic level
- `GET /signals` and `GET /api/signals`: current signal controller state
- `GET /emergency` and `POST /emergency`: random scan and manual emergency detection flows
- `POST /green-corridor` and `POST /api/green-corridor`: route-based signal overrides for emergency corridors
- `GET /ai-decision` and `GET /api/ai-decision`: backend-generated traffic reasoning and confidence
- `GET /api/traffic-history` and `GET /api/emergency-events`: persisted history in SQLite

## Local Development

```bash
npm install
npm run server
npm run dev
```

- Frontend dev server: `http://localhost:8080`
- Backend API server: `http://localhost:3001`
- Vite proxies `/api` requests to the backend in development.

## Production Build

```bash
npm run build
npm start
```

- `npm start` runs the backend directly with Node 22 type stripping.
- The Express server also serves the built frontend from `dist/` under the configured base path.

## Environment

- `PORT`: backend server port, defaults to `3001`
- `VITE_API_BASE_URL`: optional frontend API base override, defaults to `/api`
- `VITE_PUBLIC_BASE`: optional frontend router/build base, defaults to `/datfo/` in production and `/` in development

## Verification

```bash
npm test
npm run build
```

The test suite includes backend API integration coverage against a temporary SQLite database plus frontend utility tests.
