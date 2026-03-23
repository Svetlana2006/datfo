import { describe, expect, it } from 'vitest';
import { detectEmergencyVehicle, getOptimizedGreenTime, getTrafficLevel, optimizeSignal } from '@/lib/trafficEngine';

describe('trafficEngine', () => {
  it('extends green time for high traffic', () => {
    expect(getTrafficLevel(58)).toBe('high');
    expect(getOptimizedGreenTime(58)).toBeGreaterThan(45);
  });

  it('shortens green time for low traffic', () => {
    expect(getTrafficLevel(14)).toBe('low');
    expect(getOptimizedGreenTime(14)).toBeLessThan(25);
  });

  it('returns an endpoint-style optimization payload', () => {
    const result = optimizeSignal({
      id: 'INT-005',
      name: 'Nehru Place Flyover',
      lat: 28.5491,
      lng: 77.2533,
      vehicle_count: 18,
      density: 0.18,
      density_label: 'low',
      signal: 'green',
      signal_timing: 25,
      waiting_time: 8,
      corridor_active: 0,
      corridor_group: null,
      corridor_expires_at: null,
      last_updated: new Date().toISOString(),
    });

    expect(result.endpoint).toBe('/optimize-signal');
    expect(result.optimizedGreen).toBeLessThan(result.currentGreen);
    expect(result.trafficLevel).toBe('low');
  });

  it('can force an emergency detection for demo mode', () => {
    const result = detectEmergencyVehicle({
      triggerMode: 'manual-trigger',
      forceEmergency: true,
      randomValue: 0.2,
    });

    expect(result.endpoint).toBe('/emergency');
    expect(result.emergency).toBe(true);
    expect(result.type).not.toBeNull();
  });

  it('returns no emergency for a low random scan', () => {
    const result = detectEmergencyVehicle({
      triggerMode: 'random-scan',
      randomValue: 0.12,
    });

    expect(result.emergency).toBe(false);
    expect(result.type).toBeNull();
  });
});
