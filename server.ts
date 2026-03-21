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
const intersections = [
  { id: 'INT-001', name: 'Rajiv Chowk' },
  { id: 'INT-002', name: 'ITO Crossing' },
  { id: 'INT-003', name: 'Dhaula Kuan' },
  { id: 'INT-004', name: 'AIIMS Flyover' }
];

setInterval(() => {
  const int = intersections[Math.floor(Math.random() * intersections.length)];
  const vehicleCount = Math.floor(Math.random() * 100);
  const waitingTime = Math.floor(Math.random() * 90);
  const density = parseFloat((vehicleCount / 100).toFixed(2));
  const signal = density > 0.7 ? 'red' : (density > 0.4 ? 'yellow' : 'green');

  const stmt = db.prepare(`
    INSERT INTO traffic_history (intersection_id, intersection_name, vehicle_count, waiting_time, density, signal)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(int.id, int.name, vehicleCount, waitingTime, density, signal);
  
  console.log(`[Simulator] Logged traffic for ${int.name}: ${vehicleCount} vehicles, ${density} density.`);
}, 10000);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
