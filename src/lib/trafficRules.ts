export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export type DensityLabel = 'low' | 'medium' | 'high';
export type SignalState = 'red' | 'yellow' | 'green';
export type EmergencyType = 'ambulance' | 'fire' | 'police';
export type TriggerMode = 'random-scan' | 'manual-trigger';

export function getDensityLabel(vehicleCount: number): DensityLabel {
  if (vehicleCount >= 45) return 'high';
  if (vehicleCount >= 20) return 'medium';
  return 'low';
}

export function getDensityValue(vehicleCount: number): number {
  return Number(Math.min(0.99, vehicleCount / 100).toFixed(2));
}

export function getOptimizedGreenTime(vehicleCount: number): number {
  const label = getDensityLabel(vehicleCount);

  if (label === 'high') {
    return Math.min(75, 50 + Math.round((vehicleCount - 45) / 2));
  }

  if (label === 'medium') {
    return Math.min(42, 30 + Math.round((vehicleCount - 20) / 4));
  }

  return Math.max(15, 18 + Math.round(vehicleCount / 5));
}

export function getOptimizationReason(name: string, vehicleCount: number): string {
  const label = getDensityLabel(vehicleCount);
  if (label === 'high') {
    return `High traffic pressure at ${name}, extending the green phase to clear queued vehicles.`;
  }
  if (label === 'medium') {
    return `Moderate flow at ${name}, keeping the signal close to baseline timing for balanced throughput.`;
  }
  return `Low traffic at ${name}, shortening the green phase to avoid idle signal time.`;
}

export function getCycledSignal(signal: SignalState, vehicleCount: number): { signal: SignalState; signal_timing: number } {
  if (signal === 'red') {
    return { signal: 'green', signal_timing: getOptimizedGreenTime(vehicleCount) };
  }
  if (signal === 'green') {
    return { signal: 'yellow', signal_timing: 5 };
  }
  return {
    signal: 'red',
    signal_timing: Math.max(20, Math.min(55, 24 + Math.round(vehicleCount / 3))),
  };
}
