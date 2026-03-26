import {
  getDensityLabel,
  getDensityValue,
  getOptimizedGreenTime,
  getOptimizationReason,
  getCycledSignal,
  clamp
} from '../../src/lib/trafficRules.ts';
import type {
  DensityLabel,
  EmergencyType,
  SignalState,
  TriggerMode
} from '../../src/lib/trafficRules.ts';

export type { DensityLabel, SignalState, EmergencyType, TriggerMode } from '../../src/lib/trafficRules.ts';

export interface ManagedIntersection {
  id: string;
  name: string;
  lat: number;
  lng: number;
  vehicle_count: number;
  waiting_time: number;
  density: number;
  density_label: DensityLabel;
  signal: SignalState;
  signal_timing: number;
  corridor_active: number;
  corridor_group: string | null;
  corridor_expires_at: string | null;
  last_updated: string;
  trend?: number; // Added for momentum-based simulation
}

export interface EmergencyDecision {
  emergency: boolean;
  type: EmergencyType | null;
  trigger_mode: TriggerMode;
  confidence: number;
  location: string | null;
  action: string;
}

export interface AIDecision {
  reason: string;
  confidence: number;
  intersection_id: string | null;
  recommendation: string;
  timestamp: string;
}

export interface TickOptions {
  now?: Date;
  random?: () => number;
}

function chooseEmergencyType(randomValue: number): EmergencyType {
  if (randomValue < 0.34) return 'ambulance';
  if (randomValue < 0.67) return 'fire';
  return 'police';
}

export function buildEmergencyDecision(options: {
  trigger_mode: TriggerMode;
  force_emergency?: boolean;
  type?: EmergencyType | null;
  location?: string | null;
  randomValue?: number;
}): EmergencyDecision {
  const randomValue = options.randomValue ?? Math.random();
  const emergency = Boolean(options.force_emergency) || randomValue >= 0.72;
  const type = emergency ? options.type ?? chooseEmergencyType(randomValue) : null;
  const confidence = emergency
    ? clamp(Math.round(90 + randomValue * 9), 90, 99)
    : clamp(Math.round(20 + randomValue * 45), 20, 65);

  return {
    emergency,
    type,
    trigger_mode: options.trigger_mode,
    confidence,
    location: options.location ?? null,
    action: emergency
      ? `Emergency priority enabled for ${type}. Prepare a green corridor for the requested route.`
      : 'No emergency vehicle detected. Continue adaptive signal timings.',
  };
}

export function tickIntersection(intersection: ManagedIntersection, options: TickOptions = {}): ManagedIntersection {
  const now = options.now ?? new Date();
  const random = options.random ?? Math.random;
  const next = { ...intersection };

  const corridorExpiresAt = next.corridor_expires_at ? new Date(next.corridor_expires_at) : null;
  const corridorActive = next.corridor_active === 1 && corridorExpiresAt && corridorExpiresAt.getTime() > now.getTime();

  // Momentum-based simulation
  const trend = next.trend ?? (random() > 0.5 ? 1 : -1);
  const drift = random() > 0.7 ? -trend : trend; // 30% chance to flip trend
  const delta = Math.floor(random() * 6) * drift;

  next.vehicle_count = clamp(next.vehicle_count + delta, 0, 100);
  next.trend = drift; // Persist trend for next tick
  next.density_label = getDensityLabel(next.vehicle_count);
  next.density = getDensityValue(next.vehicle_count);

  if (corridorActive) {
    next.signal = 'green';
    next.signal_timing = clamp(next.signal_timing - 1, 5, 60);
    next.waiting_time = clamp(next.waiting_time - 6, 0, 240);
  } else {
    next.corridor_active = 0;
    next.corridor_group = null;
    next.corridor_expires_at = null;

    if (next.signal === 'green') {
      next.waiting_time = clamp(next.waiting_time - (next.density_label === 'high' ? 6 : 4), 0, 240);
    } else {
      next.waiting_time = clamp(next.waiting_time + (next.density_label === 'high' ? 5 : 3), 0, 240);
    }

    next.signal_timing -= 1;
    if (next.signal_timing <= 0) {
      const cycled = getCycledSignal(next.signal, next.vehicle_count);
      next.signal = cycled.signal;
      next.signal_timing = cycled.signal_timing;
    }
  }

  next.last_updated = now.toISOString();
  return next;
}

export function buildTrafficSummary(intersections: ManagedIntersection[]) {
  const totalVehicles = intersections.reduce((sum, item) => sum + item.vehicle_count, 0);
  const avgWaitTime = intersections.length === 0
    ? 0
    : Math.round(intersections.reduce((sum, item) => sum + item.waiting_time, 0) / intersections.length);
  const highTrafficIntersections = intersections.filter((item) => item.density_label === 'high').length;
  const activeCorridors = intersections.filter((item) => item.corridor_active === 1).length;

  return {
    total_vehicles: totalVehicles,
    average_wait_time: avgWaitTime,
    high_traffic_intersections: highTrafficIntersections,
    active_corridors: activeCorridors,
  };
}

export function buildAIDecision(intersections: ManagedIntersection[], focusIntersectionId?: string | null): AIDecision {
  const focus = focusIntersectionId
    ? intersections.find((entry) => entry.id === focusIntersectionId) ?? null
    : [...intersections].sort((a, b) => b.vehicle_count - a.vehicle_count)[0] ?? null;

  if (!focus) {
    return {
      reason: 'No live traffic data is available yet.',
      confidence: 70,
      intersection_id: null,
      recommendation: 'Collect one traffic snapshot before applying signal overrides.',
      timestamp: new Date().toISOString(),
    };
  }

  const confidence = focus.density_label === 'high' ? 95 : focus.density_label === 'medium' ? 88 : 83;
  const recommendation = focus.density_label === 'high'
    ? `Keep ${focus.id} on an extended green window and monitor spillback to adjacent intersections.`
    : focus.density_label === 'medium'
      ? `Use balanced timings at ${focus.id} and avoid manual overrides unless waiting time rises.`
      : `Reduce green time at ${focus.id} and redistribute cycle time to busier corridors.`;

  return {
    reason: getOptimizationReason(focus.name, focus.vehicle_count),
    confidence,
    intersection_id: focus.id,
    recommendation,
    timestamp: new Date().toISOString(),
  };
}
