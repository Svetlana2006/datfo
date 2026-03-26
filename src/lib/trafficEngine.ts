import type { EmergencyType, Intersection, TriggerMode, DensityLabel, SignalState } from './api';
export type { DensityLabel, SignalState, EmergencyType, TriggerMode };
import {
  getDensityLabel as getTrafficLevel,
  getOptimizedGreenTime,
  getOptimizationReason
} from './trafficRules';

export type TrafficLevel = DensityLabel;

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

export function optimizeSignal(intersection: Intersection): SignalOptimizationPreview {
  const trafficLevel = getTrafficLevel(intersection.vehicle_count);
  const optimizedGreen = getOptimizedGreenTime(intersection.vehicle_count);
  const estimatedWaitAfterOptimization =
    trafficLevel === 'high'
      ? Math.max(12, intersection.waiting_time - 18)
      : trafficLevel === 'medium'
        ? Math.max(8, intersection.waiting_time - 8)
        : Math.max(4, intersection.waiting_time - 3);

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
    reason: getOptimizationReason(intersection.name, intersection.vehicle_count),
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
