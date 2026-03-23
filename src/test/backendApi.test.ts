// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { Server } from 'http';
import type Database from 'better-sqlite3';
import { createDatabase } from '../../database';
import { createTrafficApp } from '../../backend-core/appFactory';

describe('traffic backend api', () => {
  let tempDir: string;
  let db: Database.Database;
  let server: Server;
  let baseUrl: string;
  let trafficApp: ReturnType<typeof createTrafficApp>;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'datfo-'));
    db = createDatabase(join(tempDir, 'traffic-test.db'));
    trafficApp = createTrafficApp({
      db,
      enableSimulation: false,
      basePath: '/datfo-test',
    });

    server = trafficApp.app.listen(0);
    await new Promise<void>((resolve) => server.once('listening', () => resolve()));
    const address = server.address();

    if (!address || typeof address === 'string') {
      throw new Error('Server failed to start on a test port.');
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    trafficApp.close();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns a traffic snapshot with summary metrics', async () => {
    const response = await fetch(`${baseUrl}/api/traffic`);
    const payload = await response.json();

    expect(response.ok).toBe(true);
    expect(payload.intersections).toHaveLength(12);
    expect(payload.summary.total_vehicles).toBeGreaterThan(0);
    expect(payload.intersections[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        vehicle_count: expect.any(Number),
        density_label: expect.stringMatching(/low|medium|high/),
        signal_timing: expect.any(Number),
      }),
    );
  });

  it('optimizes high traffic longer and low traffic shorter', async () => {
    const intersectionsResponse = await fetch(`${baseUrl}/api/intersections`);
    const intersections = await intersectionsResponse.json();
    const highTraffic = intersections.find((entry: any) => entry.id === 'INT-001');
    const lowTraffic = intersections.find((entry: any) => entry.id === 'INT-005');

    const highResponse = await fetch(`${baseUrl}/api/optimize-signal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intersection_id: highTraffic.id }),
    });
    const lowResponse = await fetch(`${baseUrl}/api/optimize-signal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intersection_id: lowTraffic.id }),
    });

    const highPayload = await highResponse.json();
    const lowPayload = await lowResponse.json();

    expect(highPayload.optimized_timing).toBeGreaterThan(highTraffic.signal_timing);
    expect(lowPayload.optimized_timing).toBeLessThan(lowTraffic.signal_timing);
    expect(highPayload.reason).toContain('High traffic pressure');
    expect(lowPayload.reason).toContain('Low traffic');
  });

  it('logs manual emergencies and activates a multi-intersection corridor', async () => {
    const emergencyResponse = await fetch(`${baseUrl}/api/emergency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trigger_mode: 'manual-trigger',
        force_emergency: true,
        type: 'ambulance',
        location: 'Control Room',
        route: ['INT-001', 'INT-007', 'INT-011'],
        source: 'ITO Intersection',
        destination: 'AIIMS Flyover',
      }),
    });
    const corridorResponse = await fetch(`${baseUrl}/api/green-corridor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        route: ['INT-001', 'INT-007', 'INT-011'],
        type: 'ambulance',
        source: 'ITO Intersection',
        destination: 'AIIMS Flyover',
      }),
    });

    const emergencyPayload = await emergencyResponse.json();
    const corridorPayload = await corridorResponse.json();

    expect(emergencyPayload.emergency).toBe(true);
    expect(corridorPayload.route).toHaveLength(3);
    expect(corridorPayload.route.every((entry: any) => entry.signal === 'green')).toBe(true);

    const eventsResponse = await fetch(`${baseUrl}/api/emergency-events`);
    const events = await eventsResponse.json();
    expect(events[0].route).toEqual(expect.arrayContaining(['INT-001', 'INT-007', 'INT-011']));
  });

  it('exposes signals, ai decisions, and writes traffic history from simulation ticks', async () => {
    trafficApp.runSimulationTick(new Date('2026-03-23T12:00:00Z'));
    trafficApp.runSimulationTick(new Date('2026-03-23T12:00:02Z'));
    trafficApp.runSimulationTick(new Date('2026-03-23T12:00:04Z'));

    const [signalsResponse, aiResponse, historyResponse] = await Promise.all([
      fetch(`${baseUrl}/api/signals`),
      fetch(`${baseUrl}/api/ai-decision`),
      fetch(`${baseUrl}/api/traffic-history`),
    ]);

    const signalsPayload = await signalsResponse.json();
    const aiPayload = await aiResponse.json();
    const historyPayload = await historyResponse.json();

    expect(signalsPayload.signals.length).toBe(12);
    expect(aiPayload).toEqual(
      expect.objectContaining({
        reason: expect.any(String),
        confidence: expect.any(Number),
        recommendation: expect.any(String),
      }),
    );
    expect(historyPayload.length).toBeGreaterThan(0);
  });
});
