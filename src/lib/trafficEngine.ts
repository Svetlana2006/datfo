import type { EmergencyVehicle, Intersection } from '@/data/mockData';

export type TrafficLevel = 'low' | 'medium' | 'high';
export type TriggerMode = 'random-scan' | 'manual-trigger';

export interface SignalOptimizationResult {
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

export interface EmergencyDetectionResult {
  endpoint: '/traffic';
  emergency: boolean;
  type: EmergencyVehicle['type'] | null;
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
    return Math.min(75, 45 + Math.round((vehicleCount - 45) / 2));
  }

  if (trafficLevel === 'medium') {
    return Math.min(40, 28 + Math.round((vehicleCount - 20) / 3));
  }

  return Math.max(15, 18 + Math.round(vehicleCount / 4));
}

export function optimizeSignal(intersection: Intersection): SignalOptimizationResult {
  const trafficLevel = getTrafficLevel(intersection.vehicleCount);
  const optimizedGreen = getOptimizedGreenTime(intersection.vehicleCount);
  const estimatedWaitAfterOptimization =
    trafficLevel === 'high'
      ? Math.max(12, intersection.waitingTime - 18)
      : trafficLevel === 'medium'
        ? Math.max(8, intersection.waitingTime - 8)
        : Math.max(4, intersection.waitingTime - 3);

  const reason =
    trafficLevel === 'high'
      ? 'High traffic volume detected, so green time is extended to clear queued vehicles.'
      : trafficLevel === 'medium'
        ? 'Moderate traffic keeps the signal near baseline timing for balanced throughput.'
        : 'Low traffic detected, so green time is shortened to reduce idle signal time.';

  return {
    endpoint: '/optimize-signal',
    intersectionId: intersection.id,
    intersectionName: intersection.name,
    trafficLevel,
    vehicleCount: intersection.vehicleCount,
    currentGreen: intersection.signalTiming,
    optimizedGreen,
    waitingTime: intersection.waitingTime,
    estimatedWaitAfterOptimization,
    reason,
  };
}

const emergencyTypes: EmergencyVehicle['type'][] = ['Ambulance', 'Fire', 'Police'];

export function detectEmergencyVehicle(options: {
  triggerMode: TriggerMode;
  forceEmergency?: boolean;
  randomValue?: number;
}): EmergencyDetectionResult {
  const { triggerMode, forceEmergency = false, randomValue = Math.random() } = options;

  const emergency = forceEmergency || randomValue >= 0.7;
  const type = emergency ? emergencyTypes[Math.floor(randomValue * emergencyTypes.length) % emergencyTypes.length] : null;
  const confidence = emergency ? 92 + Math.round(randomValue * 7) : 18 + Math.round(randomValue * 32);

  return {
    endpoint: '/traffic',
    emergency,
    type,
    triggerMode,
    confidence,
    action: emergency
      ? `Emergency priority enabled for ${type}. Nearby signals should switch to corridor mode.`
      : 'No emergency vehicle detected. Standard adaptive signal timings remain active.',
  };
}
