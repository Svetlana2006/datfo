export interface Intersection {
  id: string;
  name: string;
  lat: number;
  lng: number;
  vehicleCount: number;
  density: 'low' | 'medium' | 'high';
  signal: 'red' | 'yellow' | 'green';
  signalTiming: number;
  waitingTime: number;
}

export interface EmergencyVehicle {
  id: string;
  type: 'Ambulance' | 'Fire' | 'Police';
  currentLocation: string;
  destination: string;
  status: 'En route' | 'Completed';
  eta: number;
  distance: number;
  routeIntersections: string[];
}

export const intersections: Intersection[] = [
  { id: 'INT-001', name: 'Main St & 1st Ave', lat: 40.7128, lng: -74.006, vehicleCount: 45, density: 'high', signal: 'red', signalTiming: 30, waitingTime: 42 },
  { id: 'INT-002', name: 'Broadway & 5th St', lat: 40.7138, lng: -74.008, vehicleCount: 22, density: 'medium', signal: 'green', signalTiming: 25, waitingTime: 18 },
  { id: 'INT-003', name: 'Park Ave & 3rd St', lat: 40.7148, lng: -74.004, vehicleCount: 8, density: 'low', signal: 'green', signalTiming: 20, waitingTime: 5 },
  { id: 'INT-004', name: 'Elm St & Oak Ave', lat: 40.7118, lng: -74.010, vehicleCount: 38, density: 'high', signal: 'yellow', signalTiming: 35, waitingTime: 35 },
  { id: 'INT-005', name: 'Cedar Blvd & Pine Rd', lat: 40.7158, lng: -74.002, vehicleCount: 15, density: 'low', signal: 'green', signalTiming: 22, waitingTime: 8 },
  { id: 'INT-006', name: 'Maple Dr & River St', lat: 40.7108, lng: -74.012, vehicleCount: 52, density: 'high', signal: 'red', signalTiming: 40, waitingTime: 55 },
  { id: 'INT-007', name: 'Lake Ave & Hill St', lat: 40.7168, lng: -74.000, vehicleCount: 28, density: 'medium', signal: 'yellow', signalTiming: 28, waitingTime: 22 },
  { id: 'INT-008', name: 'Valley Rd & Summit Dr', lat: 40.7098, lng: -74.014, vehicleCount: 12, density: 'low', signal: 'green', signalTiming: 18, waitingTime: 6 },
  { id: 'INT-009', name: 'Harbor Blvd & Dock St', lat: 40.7178, lng: -73.998, vehicleCount: 41, density: 'high', signal: 'red', signalTiming: 32, waitingTime: 48 },
  { id: 'INT-010', name: 'Airport Rd & Terminal Ave', lat: 40.7088, lng: -74.016, vehicleCount: 19, density: 'medium', signal: 'green', signalTiming: 24, waitingTime: 14 },
  { id: 'INT-011', name: 'University Ave & College St', lat: 40.7188, lng: -73.996, vehicleCount: 33, density: 'medium', signal: 'yellow', signalTiming: 26, waitingTime: 25 },
  { id: 'INT-012', name: 'Market St & Commerce Dr', lat: 40.7078, lng: -74.018, vehicleCount: 48, density: 'high', signal: 'red', signalTiming: 38, waitingTime: 50 },
];

export const emergencyVehicles: EmergencyVehicle[] = [
  { id: 'EMV-101', type: 'Ambulance', currentLocation: 'Main St & 1st Ave', destination: 'City Hospital', status: 'En route', eta: 4, distance: 3.2, routeIntersections: ['INT-001', 'INT-002', 'INT-003'] },
  { id: 'EMV-102', type: 'Fire', currentLocation: 'Elm St & Oak Ave', destination: 'Oak Ave Fire Zone', status: 'En route', eta: 7, distance: 5.1, routeIntersections: ['INT-004', 'INT-006', 'INT-009'] },
  { id: 'EMV-103', type: 'Police', currentLocation: 'Cedar Blvd & Pine Rd', destination: 'Downtown Station', status: 'En route', eta: 3, distance: 2.0, routeIntersections: ['INT-005', 'INT-007'] },
  { id: 'EMV-104', type: 'Ambulance', currentLocation: 'Harbor Blvd & Dock St', destination: 'Harbor Medical', status: 'Completed', eta: 0, distance: 0, routeIntersections: [] },
  { id: 'EMV-105', type: 'Fire', currentLocation: 'Market St & Commerce Dr', destination: 'Warehouse District', status: 'En route', eta: 9, distance: 6.8, routeIntersections: ['INT-012', 'INT-010', 'INT-008'] },
];

export const trafficFlowData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, '0')}:00`,
  vehicles: Math.floor(Math.random() * 300 + (i >= 7 && i <= 9 ? 400 : i >= 16 && i <= 18 ? 350 : 100)),
  avgWait: Math.floor(Math.random() * 30 + (i >= 7 && i <= 9 ? 40 : i >= 16 && i <= 18 ? 35 : 5)),
  density: Math.floor(Math.random() * 60 + (i >= 7 && i <= 9 ? 30 : i >= 16 && i <= 18 ? 25 : 0)),
}));

export const weeklyData = [
  { day: 'Mon', congestion: 72, incidents: 3 },
  { day: 'Tue', congestion: 65, incidents: 2 },
  { day: 'Wed', congestion: 78, incidents: 5 },
  { day: 'Thu', congestion: 69, incidents: 1 },
  { day: 'Fri', congestion: 85, incidents: 4 },
  { day: 'Sat', congestion: 45, incidents: 1 },
  { day: 'Sun', congestion: 32, incidents: 0 },
];
