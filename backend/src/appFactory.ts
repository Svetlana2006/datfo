import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { EventEmitter } from 'events';
import type Database from 'better-sqlite3';
import {
  buildAIDecision,
  buildEmergencyDecision,
  buildTrafficSummary,
  tickIntersection,
} from './trafficSystem.ts';
import type {
  EmergencyType,
  ManagedIntersection,
  TriggerMode,
} from './trafficSystem.ts';
import {
  getDensityLabel,
  getDensityValue,
  getOptimizedGreenTime,
  getOptimizationReason,
  clamp,
} from '../../src/lib/trafficRules.ts';

export interface AppFactoryOptions {
  db: Database.Database;
  simulationIntervalMs?: number;
  enableSimulation?: boolean;
  staticDir?: string;
  basePath?: string;
}

function normalizeIntersection(row: any): ManagedIntersection {
  return {
    ...row,
    corridor_active: Number(row.corridor_active ?? 0),
    corridor_group: row.corridor_group ?? null,
    corridor_expires_at: row.corridor_expires_at ?? null,
    density_label: row.density_label ?? getDensityLabel(row.vehicle_count),
    density: typeof row.density === 'number' ? row.density : getDensityValue(row.vehicle_count),
  };
}

function parseRoute(routeValue: string | null) {
  if (!routeValue) return [];

  try {
    const parsed = JSON.parse(routeValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function createCorridorGroup() {
  return `GC-${Date.now()}`;
}

export function createTrafficApp(options: AppFactoryOptions) {
  const db = options.db;
  const app = express();
  const basePath = options.basePath ?? '/datfo';
  const simulationIntervalMs = options.simulationIntervalMs ?? 2_000;
  const staticDir = options.staticDir ?? resolve(process.cwd(), 'dist');
  const events = new EventEmitter();

  app.use(cors());
  app.use(express.json());

  const selectIntersections = db.prepare('SELECT * FROM intersections_state ORDER BY id');
  const selectIntersection = db.prepare('SELECT * FROM intersections_state WHERE id = ?');
  const updateIntersection = db.prepare(`
    UPDATE intersections_state
    SET
      vehicle_count = @vehicle_count,
      waiting_time = @waiting_time,
      density = @density,
      density_label = @density_label,
      signal = @signal,
      signal_timing = @signal_timing,
      corridor_active = @corridor_active,
      corridor_group = @corridor_group,
      corridor_expires_at = @corridor_expires_at,
      last_updated = @last_updated
    WHERE id = @id
  `);
  const updateSignalStmt = db.prepare('UPDATE intersections_state SET signal = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?');
  const updateTimingStmt = db.prepare('UPDATE intersections_state SET signal_timing = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?');
  const insertTrafficHistory = db.prepare(`
    INSERT INTO traffic_history (
      intersection_id,
      intersection_name,
      vehicle_count,
      waiting_time,
      density,
      density_label,
      signal
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertEmergencyEvent = db.prepare(`
    INSERT INTO emergency_events (
      type,
      location,
      severity,
      trigger_mode,
      source,
      destination,
      route_json,
      active
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const selectTrafficHistory = db.prepare('SELECT * FROM traffic_history ORDER BY timestamp DESC LIMIT ?');
  const selectEmergencyEvents = db.prepare('SELECT * FROM emergency_events ORDER BY timestamp DESC LIMIT ?');
  const deactivateExpiredCorridors = db.prepare(`
    UPDATE intersections_state
    SET corridor_active = 0, corridor_group = NULL, corridor_expires_at = NULL
    WHERE corridor_active = 1 AND corridor_expires_at IS NOT NULL AND corridor_expires_at <= ?
  `);

  const writeIntersection = db.transaction((intersection: ManagedIntersection) => {
    updateIntersection.run(intersection);
  });

  const writeTrafficHistoryBatch = db.transaction((intersections: ManagedIntersection[]) => {
    for (const intersection of intersections) {
      insertTrafficHistory.run(
        intersection.id,
        intersection.name,
        intersection.vehicle_count,
        intersection.waiting_time,
        intersection.density,
        intersection.density_label,
        intersection.signal,
      );
    }
  });

  function getIntersections(): ManagedIntersection[] {
    return (selectIntersections.all() as any[]).map(normalizeIntersection);
  }

  function getIntersection(id: string) {
    const row = selectIntersection.get(id);
    return row ? normalizeIntersection(row) : null;
  }

  function getEmergencyEvents(limit = 50) {
    return (selectEmergencyEvents.all(limit) as any[]).map((entry) => ({
      ...entry,
      active: Boolean(entry.active),
      resolved: Boolean(entry.resolved),
      route: parseRoute(entry.route_json ?? null),
    }));
  }

  function getTrafficHistory(limit = 200) {
    return (selectTrafficHistory.all(limit) as any[]).map((entry) => ({
      ...entry,
      density_label: entry.density_label ?? getDensityLabel(entry.vehicle_count),
    }));
  }

  let tickCount = 0;
  function runSimulationTick(now = new Date()) {
    deactivateExpiredCorridors.run(now.toISOString());
    const intersections = getIntersections();
    const nextIntersections = intersections.map((intersection) => tickIntersection(intersection, { now }));

    const persistAll = db.transaction((rows: ManagedIntersection[]) => {
      for (const row of rows) {
        updateIntersection.run(row);
      }
    });
    persistAll(nextIntersections);

    tickCount += 1;
    if (tickCount % 3 === 0) {
      const snapshot = [...nextIntersections]
        .sort((a, b) => b.vehicle_count - a.vehicle_count)
        .slice(0, 4);
      writeTrafficHistoryBatch(snapshot);
    }

    events.emit('tick', {
      intersections: nextIntersections,
      summary: buildTrafficSummary(nextIntersections),
      timestamp: now.toISOString(),
    });

    return nextIntersections;
  }

  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const onTick = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    events.on('tick', onTick);
    req.on('close', () => {
      events.off('tick', onTick);
    });
  });

  app.get('/api/traffic', (_: Request, res: Response) => {
    const intersections = getIntersections();
    res.json({
      intersections,
      summary: buildTrafficSummary(intersections),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/signals', (_: Request, res: Response) => {
    const signals = getIntersections().map((intersection) => ({
      id: intersection.id,
      name: intersection.name,
      signal: intersection.signal,
      signal_timing: intersection.signal_timing,
      corridor_active: Boolean(intersection.corridor_active),
      density_label: intersection.density_label,
    }));

    res.json({ signals, timestamp: new Date().toISOString() });
  });

  app.get('/api/intersections', (_req, res) => {
    res.json(getIntersections());
  });

  app.post('/api/intersections/:id/signal', (req, res) => {
    const { id } = req.params;
    const { signal } = req.body as { signal?: 'red' | 'yellow' | 'green' };

    if (!signal || !['red', 'yellow', 'green'].includes(signal)) {
      res.status(400).json({ error: 'A valid signal value is required.' });
      return;
    }

    const result = updateSignalStmt.run(signal, id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Intersection not found.' });
      return;
    }

    res.json({ success: true, intersection: getIntersection(id) });
    events.emit('manual_update');
  });

  app.post('/api/intersections/:id/timing', (req, res) => {
    const { id } = req.params;
    const { timing } = req.body as { timing?: number };

    if (typeof timing !== 'number' || Number.isNaN(timing) || timing < 5) {
      res.status(400).json({ error: 'A valid timing value is required.' });
      return;
    }

    const result = updateTimingStmt.run(Math.round(timing), id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Intersection not found.' });
      return;
    }

    res.json({ success: true, intersection: getIntersection(id) });
    events.emit('manual_update');
  });

  app.post('/api/optimize-signal', (req, res) => {
    const intersectionId = req.body?.intersection_id ?? req.body?.intersectionId;
    if (typeof intersectionId !== 'string' || !intersectionId) {
      res.status(400).json({ error: 'intersection_id is required.' });
      return;
    }

    const intersection = getIntersection(intersectionId);
    if (!intersection) {
      res.status(404).json({ error: 'Intersection not found.' });
      return;
    }

    const optimizedTiming = getOptimizedGreenTime(intersection.vehicle_count);
    const updatedIntersection = {
      ...intersection,
      signal_timing: optimizedTiming,
      density_label: getDensityLabel(intersection.vehicle_count),
      density: getDensityValue(intersection.vehicle_count),
      last_updated: new Date().toISOString(),
    };

    writeIntersection(updatedIntersection);
    insertTrafficHistory.run(
      updatedIntersection.id,
      updatedIntersection.name,
      updatedIntersection.vehicle_count,
      updatedIntersection.waiting_time,
      updatedIntersection.density,
      updatedIntersection.density_label,
      updatedIntersection.signal,
    );

    res.json({
      message: 'Signal timing optimized.',
      intersection: updatedIntersection,
      optimized_timing: optimizedTiming,
      reason: getOptimizationReason(updatedIntersection.name, updatedIntersection.vehicle_count),
    });
    events.emit('manual_update');
  });

  app.post('/api/emergency/scan', (req, res) => {
    const location = typeof req.body.location === 'string' ? req.body.location : null;
    const randomValue = typeof req.body.randomValue === 'number' ? req.body.randomValue : undefined;
    const decision = buildEmergencyDecision({
      trigger_mode: 'random-scan',
      location,
      randomValue,
    });

    if (decision.emergency && decision.type) {
      insertEmergencyEvent.run(
        decision.type,
        location ?? 'network-scan',
        'high',
        decision.trigger_mode,
        location,
        null,
        JSON.stringify([]),
        1,
      );
    }

    res.json(decision);
    events.emit('manual_update');
  });

  app.post('/api/emergency', (req, res) => {
    const triggerMode = (req.body?.trigger_mode ?? req.body?.triggerMode ?? 'manual-trigger') as TriggerMode;
    const requestedType = req.body?.type as EmergencyType | undefined;
    const location = (req.body?.location ?? req.body?.source ?? 'manual-console') as string;
    const routeIds = Array.isArray(req.body?.route) ? req.body.route.filter((entry: unknown): entry is string => typeof entry === 'string') : [];
    const source = typeof req.body?.source === 'string' ? req.body.source : null;
    const destination = typeof req.body?.destination === 'string' ? req.body.destination : null;

    const decision = buildEmergencyDecision({
      trigger_mode: triggerMode,
      force_emergency: req.body?.force_emergency ?? req.body?.forceEmergency ?? triggerMode === 'manual-trigger',
      type: requestedType ?? null,
      location,
    });

    if (decision.emergency && decision.type) {
      insertEmergencyEvent.run(
        decision.type,
        location,
        'critical',
        decision.trigger_mode,
        source,
        destination,
        JSON.stringify(routeIds),
        1,
      );
    }

    res.json({
      ...decision,
      route: routeIds,
      source,
      destination,
    });
    events.emit('manual_update');
  });

  app.post('/api/green-corridor', (req, res) => {
    const routeIds = Array.isArray(req.body?.route)
      ? req.body.route.filter((entry: unknown): entry is string => typeof entry === 'string' && entry.length > 0)
      : [];

    if (routeIds.length === 0) {
      res.status(400).json({ error: 'route must be a non-empty array of intersection ids.' });
      return;
    }

    const routeIntersections = routeIds
      .map((id: string) => getIntersection(id))
      .filter((entry: ManagedIntersection | null): entry is ManagedIntersection => entry !== null);

    if (routeIntersections.length !== routeIds.length) {
      res.status(404).json({ error: 'One or more intersections were not found.' });
      return;
    }

    const now = new Date();
    const corridorGroup = createCorridorGroup();
    const corridorExpiresAt = new Date(now.getTime() + 60_000).toISOString();

    const updateMany = db.transaction((rows: ManagedIntersection[]) => {
      for (const row of rows) {
        updateIntersection.run(row);
      }
    });

    const updatedRoute = routeIntersections.map((intersection: ManagedIntersection) => ({
      ...intersection,
      signal: 'green' as const,
      signal_timing: 60,
      corridor_active: 1,
      corridor_group: corridorGroup,
      corridor_expires_at: corridorExpiresAt,
      last_updated: now.toISOString(),
    }));

    updateMany(updatedRoute);
    insertEmergencyEvent.run(
      (req.body?.type as EmergencyType | undefined) ?? 'ambulance',
      routeIntersections[0]?.name ?? routeIds[0],
      'critical',
      'manual-trigger',
      typeof req.body?.source === 'string' ? req.body.source : routeIntersections[0]?.name ?? null,
      typeof req.body?.destination === 'string' ? req.body.destination : routeIntersections.at(-1)?.name ?? null,
      JSON.stringify(routeIds),
      1,
    );

    res.json({
      message: 'Green corridor activated.',
      corridor_group: corridorGroup,
      route: updatedRoute,
      expires_at: corridorExpiresAt,
    });
    events.emit('manual_update');
  });

  app.get('/api/traffic-history', (req, res) => {
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 200;
    res.json(getTrafficHistory(Number.isFinite(limit) ? clamp(limit, 1, 1000) : 200));
  });

  app.get('/api/emergency-events', (req, res) => {
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 100;
    res.json(getEmergencyEvents(Number.isFinite(limit) ? clamp(limit, 1, 1000) : 100));
  });

  app.get('/api/ai-decision', (req, res) => {
    const intersectionId = typeof req.query.intersection_id === 'string' ? req.query.intersection_id : null;
    res.json(buildAIDecision(getIntersections(), intersectionId));
  });

  let simulationHandle: NodeJS.Timeout | null = null;
  if (options.enableSimulation !== false) {
    simulationHandle = setInterval(() => {
      runSimulationTick();
    }, simulationIntervalMs);
  }

  if (existsSync(staticDir)) {
    app.use(basePath, express.static(staticDir));
    app.get(new RegExp(`^${basePath}`), (_req, res) => {
      res.sendFile(resolve(staticDir, 'index.html'));
    });
  }

  return {
    app: app as Express,
    getIntersections,
    getTrafficHistory,
    getEmergencyEvents,
    runSimulationTick,
    close: () => {
      if (simulationHandle) {
        clearInterval(simulationHandle);
        simulationHandle = null;
      }
    },
  };
}
