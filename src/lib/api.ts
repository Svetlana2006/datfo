const API_BASE_URL = 'http://localhost:3001/api';

export interface Intersection {
  id: string;
  name: string;
  lat: number;
  lng: number;
  vehicle_count: number;
  density: number;
  signal: 'red' | 'yellow' | 'green';
  waiting_time: number;
  signal_timing: number;
  last_updated: string;
}

export interface TrafficHistory {
  id: number;
  intersection_id: string;
  intersection_name: string;
  vehicle_count: number;
  waiting_time: number;
  density: number;
  signal: string;
  timestamp: string;
}

export interface EmergencyEvent {
  id: number;
  type: string;
  location: string;
  severity: string;
  resolved: boolean;
  timestamp: string;
}

export const api = {
  getIntersections: async (): Promise<Intersection[]> => {
    const response = await fetch(`${API_BASE_URL}/intersections`);
    if (!response.ok) throw new Error('Failed to fetch intersections');
    return response.json();
  },

  updateSignal: async (id: string, signal: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/intersections/${id}/signal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signal }),
    });
    if (!response.ok) throw new Error('Failed to update signal');
    return response.json();
  },

  updateTiming: async (id: string, timing: number): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/intersections/${id}/timing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timing }),
    });
    if (!response.ok) throw new Error('Failed to update timing');
    return response.json();
  },

  getTrafficHistory: async (): Promise<TrafficHistory[]> => {
    const response = await fetch(`${API_BASE_URL}/traffic-history`);
    if (!response.ok) throw new Error('Failed to fetch traffic history');
    return response.json();
  },

  getEmergencyEvents: async (): Promise<EmergencyEvent[]> => {
    const response = await fetch(`${API_BASE_URL}/emergency-events`);
    if (!response.ok) throw new Error('Failed to fetch emergency events');
    return response.json();
  },

  getAIDecision: async (): Promise<{ reason: string; confidence: number; timestamp: string }> => {
    const response = await fetch(`${API_BASE_URL}/ai-decision`);
    if (!response.ok) throw new Error('Failed to fetch AI decision');
    return response.json();
  },
};
