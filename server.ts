import express from 'express';
import cors from 'cors';
import db from './database';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send(`
    <h1>Traffic Control API</h1>
    <p>Available endpoints:</p>
    <ul>
      <li><a href="/api/traffic-history">/api/traffic-history</a> - Stored traffic data</li>
      <li><a href="/api/ai-decision">/api/ai-decision</a> - Real-time AI reasoning</li>
      <li><a href="/api/emergency-events">/api/emergency-events</a> - Logged emergency events</li>
    </ul>
  `);
});

// API Endpoints
app.get('/api/intersections', (req, res) => {
  const intersections = db.prepare('SELECT * FROM intersections_state').all();
  res.json(intersections);
});

app.post('/api/intersections/:id/signal', (req, res) => {
  const { id } = req.params;
  const { signal } = req.body;
  
  const stmt = db.prepare('UPDATE intersections_state SET signal = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?');
  const result = stmt.run(signal, id);
  
  if (result.changes > 0) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Intersection not found' });
  }
});

app.post('/api/intersections/:id/timing', (req, res) => {
  const { id } = req.params;
  const { timing } = req.body;
  
  const stmt = db.prepare('UPDATE intersections_state SET signal_timing = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?');
  const result = stmt.run(timing, id);
  
  if (result.changes > 0) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Intersection not found' });
  }
});

app.get('/api/traffic-history', (req, res) => {
  const history = db.prepare('SELECT * FROM traffic_history ORDER BY timestamp DESC LIMIT 100').all();
  res.json(history);
});

app.post('/api/traffic-history', (req, res) => {
  const { intersection_id, intersection_name, vehicle_count, waiting_time, density, signal } = req.body;
  const stmt = db.prepare(`
    INSERT INTO traffic_history (intersection_id, intersection_name, vehicle_count, waiting_time, density, signal)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(intersection_id, intersection_name, vehicle_count, waiting_time, density, signal);
  res.status(201).json({ success: true });
});

app.get('/api/emergency-events', (req, res) => {
  const events = db.prepare('SELECT * FROM emergency_events ORDER BY timestamp DESC').all();
  res.json(events);
});

app.post('/api/emergency-events', (req, res) => {
  const { type, location, severity } = req.body;
  const stmt = db.prepare('INSERT INTO emergency_events (type, location, severity) VALUES (?, ?, ?)');
  stmt.run(type, location, severity);
  res.status(201).json({ success: true });
});

app.get('/api/ai-decision', (req, res) => {
  // Simple heuristic-based AI reasoning for the hackathon
  const latestTraffic = db.prepare('SELECT * FROM traffic_history ORDER BY timestamp DESC LIMIT 1').get() as any;
  
  let reason = "Maintaining normal signal cycles based on average flow.";
  let confidence = 85;

  if (latestTraffic) {
    if (latestTraffic.density > 0.8) {
      reason = `Heavy congestion detected at ${latestTraffic.intersection_name}. Extending green light for the current lane.`;
      confidence = 94;
    } else if (latestTraffic.waiting_time > 60) {
      reason = `Excessive wait time at ${latestTraffic.intersection_name}. Switching signal to clear queue.`;
      confidence = 91;
    }
  }

  res.json({
    reason,
    confidence,
    timestamp: new Date().toISOString()
  });
});

// Simulator: Update traffic data every 10 seconds
setInterval(() => {
  const intersections = db.prepare('SELECT * FROM intersections_state').all() as any[];
  if (intersections.length === 0) return;

  const int = intersections[Math.floor(Math.random() * intersections.length)];
  
  // Simulate some changes
  const vehicleCount = Math.max(0, Math.min(100, int.vehicle_count + Math.floor(Math.random() * 21) - 10));
  const waitingTime = Math.max(0, Math.min(120, int.waiting_time + Math.floor(Math.random() * 11) - 5));
  const density = parseFloat((vehicleCount / 100).toFixed(2));
  
  // Update current state
  const updateStmt = db.prepare(`
    UPDATE intersections_state 
    SET vehicle_count = ?, waiting_time = ?, density = ?, last_updated = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  updateStmt.run(vehicleCount, waitingTime, density, int.id);

  // Log to history
  const historyStmt = db.prepare(`
    INSERT INTO traffic_history (intersection_id, intersection_name, vehicle_count, waiting_time, density, signal)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  historyStmt.run(int.id, int.name, vehicleCount, waitingTime, density, int.signal);
  
  console.log(`[Simulator] Updated and logged traffic for ${int.name}: ${vehicleCount} vehicles, ${density} density.`);
}, 10000);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
