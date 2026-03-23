const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE_URL = configuredBase
  ? configuredBase.replace(/\/$/, '')
  : '/api';

export type SignalState = 'red' | 'yellow' | 'green';
export type DensityLabel = 'low' | 'medium' | 'high';
export type EmergencyType = 'ambulance' | 'fire' | 'police';
export type TriggerMode = 'random-scan' | 'manual-trigger';

export interface Intersection {
  id: string;
  name: string;
  lat: number;
  lng: number;
  vehicle_count: number;
  density: number;
  density_label: DensityLabel;
  signal: SignalState;
  waiting_time: number;
  signal_timing: number;
  corridor_active: number;
  corridor_group: string | null;
  corridor_expires_at: string | null;
  last_updated: string;
}

export interface TrafficSnapshot {
  intersections: Intersection[];
  summary: {
    total_vehicles: number;
    average_wait_time: number;
    high_traffic_intersections: number;
    active_corridors: number;
  };
  timestamp: string;
}

export interface TrafficHistory {
  id: number;
  intersection_id: string;
  intersection_name: string;
  vehicle_count: number;
  waiting_time: number;
  density: number;
  density_label: DensityLabel;
  signal: SignalState;
  timestamp: string;
}

export interface EmergencyEvent {
  id: number;
  type: EmergencyType;
  location: string;
  severity: string;
  trigger_mode: TriggerMode;
  source: string | null;
  destination: string | null;
  route: string[];
  active: boolean;
  resolved: boolean;
  timestamp: string;
}

export interface EmergencyDetectionResult {
  emergency: boolean;
  type: EmergencyType | null;
  trigger_mode: TriggerMode;
  confidence: number;
  location: string | null;
  action: string;
  route?: string[];
  source?: string | null;
  destination?: string | null;
}

export interface SignalOptimizationResult {
  message: string;
  optimized_timing: number;
  reason: string;
  intersection: Intersection;
}

export interface GreenCorridorResult {
  message: string;
  corridor_group: string;
  route: Intersection[];
  expires_at: string;
}

export interface SignalSnapshot {
  id: string;
  name: string;
  signal: SignalState;
  signal_timing: number;
  corridor_active: boolean;
  density_label: DensityLabel;
}

export interface AIDecision {
  reason: string;
  confidence: number;
  intersection_id: string | null;
  recommendation: string;
  timestamp: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed for ${path}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getTraffic: () => request<TrafficSnapshot>('/traffic'),

  getIntersections: () => request<Intersection[]>('/intersections'),

  getSignals: async (): Promise<SignalSnapshot[]> => {
    const response = await request<{ signals: SignalSnapshot[] }>('/signals');
    return response.signals;
  },

  updateSignal: (id: string, signal: SignalState) =>
    request<{ success: boolean; intersection: Intersection }>(`/intersections/${id}/signal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signal }),
    }),

  updateTiming: (id: string, timing: number) =>
    request<{ success: boolean; intersection: Intersection }>(`/intersections/${id}/timing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timing }),
    }),

  optimizeSignal: (intersectionId: string) =>
    request<SignalOptimizationResult>('/optimize-signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intersection_id: intersectionId }),
    }),

  detectEmergency: (payload?: {
    trigger_mode?: TriggerMode;
    force_emergency?: boolean;
    type?: EmergencyType;
    location?: string;
    route?: string[];
    source?: string;
    destination?: string;
  }) =>
    request<EmergencyDetectionResult>('/emergency', {
      method: payload ? 'POST' : 'GET',
      headers: payload ? { 'Content-Type': 'application/json' } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
    }),

  getEmergencyScan: () => request<EmergencyDetectionResult>('/emergency'),

  activateGreenCorridor: (payload: {
    route: string[];
    type?: EmergencyType;
    source?: string;
    destination?: string;
  }) =>
    request<GreenCorridorResult>('/green-corridor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getTrafficHistory: () => request<TrafficHistory[]>('/traffic-history'),

  getEmergencyEvents: () => request<EmergencyEvent[]>('/emergency-events'),

  getAIDecision: (intersectionId?: string) =>
    request<AIDecision>(intersectionId ? `/ai-decision?intersection_id=${encodeURIComponent(intersectionId)}` : '/ai-decision'),
};
