import Database from 'better-sqlite3';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

export interface SeedIntersection {
  id: string;
  name: string;
  lat: number;
  lng: number;
  vehicle_count: number;
  waiting_time: number;
  signal: 'red' | 'yellow' | 'green';
  signal_timing: number;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const defaultDbPath = resolve(__dirname, 'traffic.db');

export const seededIntersections: SeedIntersection[] = [
  { id: 'INT-001', name: 'ITO Intersection', lat: 28.6304, lng: 77.2406, vehicle_count: 58, waiting_time: 65, signal: 'red', signal_timing: 45 },
  { id: 'INT-002', name: 'Connaught Place Circle', lat: 28.6315, lng: 77.2167, vehicle_count: 42, waiting_time: 48, signal: 'yellow', signal_timing: 40 },
  { id: 'INT-003', name: 'Chandni Chowk', lat: 28.6506, lng: 77.2334, vehicle_count: 35, waiting_time: 22, signal: 'green', signal_timing: 30 },
  { id: 'INT-004', name: 'Karol Bagh Crossing', lat: 28.6519, lng: 77.1907, vehicle_count: 50, waiting_time: 55, signal: 'red', signal_timing: 50 },
  { id: 'INT-005', name: 'Nehru Place Flyover', lat: 28.5491, lng: 77.2533, vehicle_count: 18, waiting_time: 8, signal: 'green', signal_timing: 25 },
  { id: 'INT-006', name: 'Rajiv Chowk', lat: 28.6328, lng: 77.2197, vehicle_count: 62, waiting_time: 72, signal: 'red', signal_timing: 55 },
  { id: 'INT-007', name: 'Moolchand Flyover', lat: 28.5685, lng: 77.2395, vehicle_count: 28, waiting_time: 25, signal: 'yellow', signal_timing: 32 },
  { id: 'INT-008', name: 'Sarai Kale Khan', lat: 28.5893, lng: 77.2568, vehicle_count: 14, waiting_time: 6, signal: 'green', signal_timing: 20 },
  { id: 'INT-009', name: 'Dhaula Kuan', lat: 28.5921, lng: 77.1663, vehicle_count: 46, waiting_time: 52, signal: 'red', signal_timing: 42 },
  { id: 'INT-010', name: 'Ashram Chowk', lat: 28.57, lng: 77.25, vehicle_count: 22, waiting_time: 15, signal: 'green', signal_timing: 28 },
  { id: 'INT-011', name: 'AIIMS Flyover', lat: 28.5672, lng: 77.21, vehicle_count: 33, waiting_time: 28, signal: 'yellow', signal_timing: 30 },
  { id: 'INT-012', name: 'Kashmere Gate ISBT', lat: 28.6676, lng: 77.2285, vehicle_count: 55, waiting_time: 60, signal: 'red', signal_timing: 48 },
];

function getDensityLabel(vehicleCount: number): 'low' | 'medium' | 'high' {
  if (vehicleCount >= 45) return 'high';
  if (vehicleCount >= 20) return 'medium';
  return 'low';
}

function getDensityValue(vehicleCount: number): number {
  return Number(Math.min(0.99, vehicleCount / 100).toFixed(2));
}

function ensureColumn(db: Database.Database, table: string, column: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some((entry) => entry.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function initializeSchema(db: Database.Database) {
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS traffic_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      intersection_id TEXT NOT NULL,
      intersection_name TEXT NOT NULL,
      vehicle_count INTEGER NOT NULL,
      waiting_time INTEGER NOT NULL,
      density REAL NOT NULL,
      density_label TEXT DEFAULT 'medium',
      signal TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS emergency_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      location TEXT NOT NULL,
      severity TEXT NOT NULL,
      trigger_mode TEXT DEFAULT 'random-scan',
      source TEXT,
      destination TEXT,
      route_json TEXT,
      active BOOLEAN DEFAULT 1,
      resolved BOOLEAN DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS intersections_state (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      vehicle_count INTEGER NOT NULL,
      waiting_time INTEGER NOT NULL,
      density REAL NOT NULL,
      density_label TEXT DEFAULT 'medium',
      signal TEXT NOT NULL,
      signal_timing INTEGER DEFAULT 30,
      corridor_active BOOLEAN DEFAULT 0,
      corridor_group TEXT,
      corridor_expires_at TEXT,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  ensureColumn(db, 'traffic_history', 'density_label', "TEXT DEFAULT 'medium'");
  ensureColumn(db, 'emergency_events', 'trigger_mode', "TEXT DEFAULT 'random-scan'");
  ensureColumn(db, 'emergency_events', 'source', 'TEXT');
  ensureColumn(db, 'emergency_events', 'destination', 'TEXT');
  ensureColumn(db, 'emergency_events', 'route_json', 'TEXT');
  ensureColumn(db, 'emergency_events', 'active', 'BOOLEAN DEFAULT 1');
  ensureColumn(db, 'intersections_state', 'density_label', "TEXT DEFAULT 'medium'");
  ensureColumn(db, 'intersections_state', 'corridor_active', 'BOOLEAN DEFAULT 0');
  ensureColumn(db, 'intersections_state', 'corridor_group', 'TEXT');
  ensureColumn(db, 'intersections_state', 'corridor_expires_at', 'TEXT');
}

function seedIntersections(db: Database.Database) {
  const existing = db.prepare('SELECT COUNT(*) AS count FROM intersections_state').get() as { count: number };
  if (existing.count > 0) {
    return;
  }

  const insert = db.prepare(`
    INSERT INTO intersections_state (
      id,
      name,
      lat,
      lng,
      vehicle_count,
      waiting_time,
      density,
      density_label,
      signal,
      signal_timing
    )
    VALUES (
      @id,
      @name,
      @lat,
      @lng,
      @vehicle_count,
      @waiting_time,
      @density,
      @density_label,
      @signal,
      @signal_timing
    )
  `);

  const seedMany = db.transaction((rows: SeedIntersection[]) => {
    for (const row of rows) {
      insert.run({
        ...row,
        density: getDensityValue(row.vehicle_count),
        density_label: getDensityLabel(row.vehicle_count),
      });
    }
  });

  seedMany(seededIntersections);
}

export function createDatabase(dbPath = defaultDbPath) {
  const db = new Database(dbPath);
  initializeSchema(db);
  seedIntersections(db);
  return db;
}

const db = createDatabase();

export default db;
