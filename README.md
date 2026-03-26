# 🚦 DATFO: Dynamic Adaptive Traffic Flow Optimization

> **Transforming chaotic urban intersections into a choreographed digital symphony.**

DATFO is a next-generation traffic management "Command Center" designed for the modern smart city. It's not just a dashboard; it's a living ecosystem where real-time telemetry, momentum-based simulation, and unified domain logic converge to provide a "flawless" traffic optimization experience.

---

## 🏗️ The Core Pillars

### ⚡ Real-Time SSE Infrastructure
Forget wasteful polling. DATFO is built on a high-performance **Server-Sent Events (SSE)** backbone. Telemetry streams directly from the backend to the frontend with zero latency, ensuring your command center is always in sync with the pulse of the city.

### 🧠 Unified Domain Logic
One rulebook to rule them all. By centralizing traffic physics, signal cycling, and optimization rules in a shared `trafficRules.ts` layer, we've eliminated the "Logic Drift" common in most prototypes. What the backend calculates, the frontend renders—perfectly.

### 🚔 Emergency Priority Dispatch
DATFO treats emergencies with the gravity they deserve. Our **Green Corridor** system allows operators to override an entire route's signals with a single command, carving a path for emergency vehicles through even the densest congestion.

### 📈 Momentum-Based Simulation
Traffic isn't random; it has flow and inertia. Our simulation engine uses a **Trend-Based Momentum Model** that mimics real-world traffic growth and decay, providing a laboratory for signal optimization that feels truly realistic.

---

## 🚀 Key Features

### 📺 Live Monitoring Dashboard
A high-fidelity view of every junction. Each intersection card features:
- **3x3 Dynamic Tile Mapping**: Seamlessly view the geographical context of every junction.
- **Density Telemetry**: Visual HSL-tailored density bars for immediate situation appraisal.
- **Adaptive Signal Icons**: Real-time signal state tracking with pulse-animations.

### 🚥 Precision Signal Control
Take direct command or let the system optimize for you:
- **Manual Overrides**: Toggle signals or adjust timings with immediate backend persistency.
- **AI Optimization**: Request context-aware tuning that recalculates timings based on current vehicle pressure and waiting time.

### 🚑 Emergency Tracking
- **Automated Scanning**: Random-momentum scans detect potential emergency vehicles.
- **Event Logging**: Every emergency is tracked, logged, and persisted in a robust SQLite database for later analysis.

### 📊 Advanced Analytics
- **Historical Flow Graphing**: Watch trends emerge over a 24-hour window.
- **Global Stats**: Instantly see total vehicle volume, average wait times, and active emergency corridors across the entire network.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Framer Motion (Animations), TailwindCSS, Recharts.
- **Backend**: Node.js (Express), `better-sqlite3` (Performance-tuned SQLite).
- **Communication**: EventSource (SSE), RESTful API.
- **Validation**: TypeScript (Strict Mode), Playwright (E2E), Vitest (Integration).

---

## 🏎️ Getting Started

### 1. Installation
```bash
npm install
```

### 2. Launching the Command Center
You'll need two terminals for development:
```bash
# Terminal A: Start the Traffic Engine (API & Simulation)
npm run server

# Terminal B: Start the Frontend UI
npm run dev
```

### 3. Accessing the UI
- **Dev URL**: `http://localhost:8080/datfo/`
- **Dashboard**: `http://localhost:8080/datfo/dashboard`

---

## 📡 API Reference

### Real-Time Flux
- `GET /api/events` - The heartbeat of the system (SSE Stream).

### Intersections & Signals
- `GET /api/traffic` - Full network snapshot.
- `GET /api/signals` - Minimal signal state list.
- `POST /api/intersections/:id/signal` - Manual state override.
- `POST /api/intersections/:id/timing` - Precision green-phase adjustment.

### Intelligence & Logic
- `POST /api/optimize-signal` - Execute AI-driven cycle optimization.
- `GET /api/ai-decision` - Retrieve reasoning for the latest system recommendation.

### Emergency Services
- `POST /api/emergency/scan` - Trigger a network-wide detection scan.
- `POST /api/emergency` - Force a manual emergency event.
- `POST /api/green-corridor` - Activate a multi-junction priority path.

---

## 🛡️ Production Readiness

DATFO is designed to be served as a single consolidated package:
```bash
npm run build
npm start
```
The Express server will serve the production-built frontend from `dist/` while maintaining the SQLite database at `backend/traffic.db`.

---

> **DATFO: Moving people, not just vehicles.**
