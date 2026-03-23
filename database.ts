import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = resolve(__dirname, 'traffic.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS traffic_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    intersection_id TEXT,
    intersection_name TEXT,
    vehicle_count INTEGER,
    waiting_time INTEGER,
    density REAL,
    signal TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS emergency_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    location TEXT,
    severity TEXT,
    resolved BOOLEAN DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS intersections_state (
    id TEXT PRIMARY KEY,
    name TEXT,
    lat REAL,
    lng REAL,
    vehicle_count INTEGER,
    waiting_time INTEGER,
    density REAL,
    signal TEXT,
    signal_timing INTEGER DEFAULT 30,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Initialize intersections_state with default values if empty
const count = db.prepare('SELECT COUNT(*) as count FROM intersections_state').get() as { count: number };
if (count.count === 0) {
  const initialIntersections = [
    { id: 'INT-001', name: 'ITO Intersection', lat: 28.6304, lng: 77.2406, vehicle_count: 58, waiting_time: 65, density: 0.58, signal: 'red', signal_timing: 45 },
    { id: 'INT-002', name: 'Connaught Place Circle', lat: 28.6315, lng: 77.2167, vehicle_count: 42, waiting_time: 48, density: 0.42, signal: 'yellow', signal_timing: 40 },
    { id: 'INT-003', name: 'Chandni Chowk', lat: 28.6506, lng: 77.2334, vehicle_count: 35, waiting_time: 22, density: 0.35, signal: 'green', signal_timing: 30 },
    { id: 'INT-004', name: 'Karol Bagh Crossing', lat: 28.6519, lng: 77.1907, vehicle_count: 50, waiting_time: 55, density: 0.50, signal: 'red', signal_timing: 50 },
    { id: 'INT-005', name: 'Nehru Place Flyover', lat: 28.5491, lng: 77.2533, vehicle_count: 18, waiting_time: 8, density: 0.18, signal: 'green', signal_timing: 25 },
    { id: 'INT-006', name: 'Rajiv Chowk', lat: 28.6328, lng: 77.2197, vehicle_count: 62, waiting_time: 72, density: 0.62, signal: 'red', signal_timing: 55 },
    { id: 'INT-007', name: 'Moolchand Flyover', lat: 28.5685, lng: 77.2395, vehicle_count: 28, waiting_time: 25, density: 0.28, signal: 'yellow', signal_timing: 32 },
    { id: 'INT-008', name: 'Sarai Kale Khan', lat: 28.5893, lng: 77.2568, vehicle_count: 14, waiting_time: 6, density: 0.14, signal: 'green', signal_timing: 20 },
    { id: 'INT-009', name: 'Dhaula Kuan', lat: 28.5921, lng: 77.1663, vehicle_count: 46, waiting_time: 52, density: 0.46, signal: 'red', signal_timing: 42 },
    { id: 'INT-010', name: 'Ashram Chowk', lat: 28.5700, lng: 77.2500, vehicle_count: 22, waiting_time: 15, density: 0.22, signal: 'green', signal_timing: 28 },
    { id: 'INT-011', name: 'AIIMS Flyover', lat: 28.5672, lng: 77.2100, vehicle_count: 33, waiting_time: 28, density: 0.33, signal: 'yellow', signal_timing: 30 },
    { id: 'INT-012', name: 'Kashmere Gate ISBT', lat: 28.6676, lng: 77.2285, vehicle_count: 55, waiting_time: 60, density: 0.55, signal: 'red', signal_timing: 48 }
  ];

  const insert = db.prepare(`
    INSERT INTO intersections_state (id, name, lat, lng, vehicle_count, waiting_time, density, signal, signal_timing)
    VALUES (@id, @name, @lat, @lng, @vehicle_count, @waiting_time, @density, @signal, @signal_timing)
  `);

  const insertMany = db.transaction((intersections) => {
    for (const int of intersections) insert.run(int);
  });

  insertMany(initialIntersections);
}

export default db;
