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
`);

export default db;
