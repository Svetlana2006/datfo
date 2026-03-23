import { format, parseISO, startOfHour, subHours, subDays } from 'date-fns';
import type { EmergencyEvent, Intersection, TrafficHistory } from './api';

export function densityLabelFromValue(value: number): 'low' | 'medium' | 'high' {
  if (value >= 0.7) return 'high';
  if (value >= 0.3) return 'medium';
  return 'low';
}

export function buildTrafficFlowData(history: TrafficHistory[]) {
  const now = new Date();
  const buckets = Array.from({ length: 24 }, (_, index) => {
    const point = subHours(startOfHour(now), 23 - index);
    return {
      hourKey: point.toISOString(),
      hour: format(point, 'HH:00'),
      vehicles: 0,
      avgWait: 0,
      density: 0,
      samples: 0,
    };
  });

  const bucketMap = new Map(buckets.map((bucket) => [bucket.hourKey.slice(0, 13), bucket]));

  for (const item of history) {
    const date = parseISO(item.timestamp);
    const key = date.toISOString().slice(0, 13);
    const bucket = bucketMap.get(key);
    if (!bucket) continue;

    bucket.vehicles += item.vehicle_count;
    bucket.avgWait += item.waiting_time;
    bucket.density += item.density * 100;
    bucket.samples += 1;
  }

  return buckets.map((bucket) => ({
    hour: bucket.hour,
    vehicles: bucket.samples > 0 ? Math.round(bucket.vehicles / bucket.samples) : 0,
    avgWait: bucket.samples > 0 ? Math.round(bucket.avgWait / bucket.samples) : 0,
    density: bucket.samples > 0 ? Math.round(bucket.density / bucket.samples) : 0,
  }));
}

export function buildWeeklyCongestion(history: TrafficHistory[]) {
  const today = new Date();
  const rows = Array.from({ length: 7 }, (_, index) => {
    const day = subDays(today, 6 - index);
    return {
      key: format(day, 'yyyy-MM-dd'),
      day: format(day, 'EEE'),
      congestion: 0,
      incidents: 0,
      samples: 0,
    };
  });

  const rowMap = new Map(rows.map((row) => [row.key, row]));

  for (const item of history) {
    const row = rowMap.get(format(parseISO(item.timestamp), 'yyyy-MM-dd'));
    if (!row) continue;

    row.congestion += item.density * 100;
    row.samples += 1;
  }

  return rows.map((row) => ({
    day: row.day,
    congestion: row.samples > 0 ? Math.round(row.congestion / row.samples) : 0,
    incidents: row.incidents,
  }));
}

export function applyEmergencyCounts(weeklyCongestion: Array<{ day: string; congestion: number; incidents: number }>, events: EmergencyEvent[]) {
  const counts = new Map<string, number>();

  for (const event of events) {
    const key = format(parseISO(event.timestamp), 'EEE');
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return weeklyCongestion.map((row) => ({
    ...row,
    incidents: counts.get(row.day) ?? 0,
  }));
}

export function buildHeatmapData(history: TrafficHistory[]) {
  const heatMap = new Map<string, { day: number; hour: number; value: number; samples: number }>();

  for (const item of history) {
    const timestamp = parseISO(item.timestamp);
    const day = (timestamp.getDay() + 6) % 7;
    const hour = timestamp.getHours();
    const key = `${day}-${hour}`;
    const current = heatMap.get(key) ?? { day, hour, value: 0, samples: 0 };
    current.value += item.density * 100;
    current.samples += 1;
    heatMap.set(key, current);
  }

  return Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) => {
      const item = heatMap.get(`${day}-${hour}`);
      return {
        day,
        hour,
        value: item ? Math.round(item.value / item.samples) : 0,
      };
    }),
  ).flat();
}

export function summarizeLiveTraffic(intersections: Intersection[]) {
  const totalVehicles = intersections.reduce((sum, item) => sum + item.vehicle_count, 0);
  const congested = intersections.filter((item) => item.density_label === 'high').length;
  const avgWait = intersections.length > 0
    ? Math.round(intersections.reduce((sum, item) => sum + item.waiting_time, 0) / intersections.length)
    : 0;

  return { totalVehicles, congested, avgWait };
}
