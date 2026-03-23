import type { EmergencyType, Intersection, TriggerMode } from './api';

export type TrafficLevel = 'low' | 'medium' | 'high';

export interface SignalOptimizationPreview {
  endpoint: '/optimize-signal';
  intersectionId: string;
  intersectionName: string;
  trafficLevel: TrafficLevel;
  vehicleCount: number;
  currentGreen: number;
  optimizedGreen: number;
  waitingTime: number;
  estimatedWaitAfterOptimization: number;
  reason: string;
}

export interface EmergencyDetectionPreview {
  endpoint: '/emergency';
  emergency: boolean;
  type: EmergencyType | null;
  triggerMode: TriggerMode;
  confidence: number;
  action: string;
}

export function getTrafficLevel(vehicleCount: number): TrafficLevel {
  if (vehicleCount >= 45) return 'high';
  if (vehicleCount >= 20) return 'medium';
  return 'low';
}

export function getOptimizedGreenTime(vehicleCount: number): number {
  const trafficLevel = getTrafficLevel(vehicleCount);

  if (trafficLevel === 'high') {
    return Math.min(75, 50 + Math.round((vehicleCount - 45) / 2));
  }

  if (trafficLevel === 'medium') {
    return Math.min(42, 30 + Math.round((vehicleCount - 20) / 4));
  }

  return Math.max(15, 18 + Math.round(vehicleCount / 5));
}

export function optimizeSignal(intersection: Intersection): SignalOptimizationPreview {
  const trafficLevel = getTrafficLevel(intersection.vehicle_count);
  const optimizedGreen = getOptimizedGreenTime(intersection.vehicle_count);
  const estimatedWaitAfterOptimization =
    trafficLevel === 'high'
      ? Math.max(12, intersection.waiting_time - 18)
      : trafficLevel === 'medium'
        ? Math.max(8, intersection.waiting_time - 8)
        : Math.max(4, intersection.waiting_time - 3);

  const reason =
    trafficLevel === 'high'
      ? `High traffic pressure at ${intersection.name}, extending the green phase to clear queued vehicles.`
      : trafficLevel === 'medium'
        ? `Moderate flow at ${intersection.name}, keeping the signal close to baseline timing for balanced throughput.`
        : `Low traffic at ${intersection.name}, shortening the green phase to avoid idle signal time.`;

  return {
    endpoint: '/optimize-signal',
    intersectionId: intersection.id,
    intersectionName: intersection.name,
    trafficLevel,
    vehicleCount: intersection.vehicle_count,
    currentGreen: intersection.signal_timing,
    optimizedGreen,
    waitingTime: intersection.waiting_time,
    estimatedWaitAfterOptimization,
    reason,
  };
}

const emergencyTypes: EmergencyType[] = ['ambulance', 'fire', 'police'];

export function detectEmergencyVehicle(options: {
  triggerMode: TriggerMode;
  forceEmergency?: boolean;
  randomValue?: number;
}): EmergencyDetectionPreview {
  const { triggerMode, forceEmergency = false, randomValue = Math.random() } = options;

  const emergency = forceEmergency || randomValue >= 0.72;
  const type = emergency ? emergencyTypes[Math.floor(randomValue * emergencyTypes.length) % emergencyTypes.length] : null;
  const confidence = emergency ? 92 + Math.round(randomValue * 7) : 20 + Math.round(randomValue * 35);

  return {
    endpoint: '/emergency',
    emergency,
    type,
    triggerMode,
    confidence,
    action: emergency
      ? `Emergency priority enabled for ${type}. Prepare a green corridor for the requested route.`
      : 'No emergency vehicle detected. Continue adaptive signal timings.',
  };
}
