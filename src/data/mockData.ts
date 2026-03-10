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
  { id: 'INT-001', name: 'ITO Intersection', lat: 28.6304, lng: 77.2406, vehicleCount: 58, density: 'high', signal: 'red', signalTiming: 45, waitingTime: 65 },
  { id: 'INT-002', name: 'Connaught Place Circle', lat: 28.6315, lng: 77.2167, vehicleCount: 42, density: 'high', signal: 'yellow', signalTiming: 40, waitingTime: 48 },
  { id: 'INT-003', name: 'Chandni Chowk', lat: 28.6506, lng: 77.2334, vehicleCount: 35, density: 'medium', signal: 'green', signalTiming: 30, waitingTime: 22 },
  { id: 'INT-004', name: 'Karol Bagh Crossing', lat: 28.6519, lng: 77.1907, vehicleCount: 50, density: 'high', signal: 'red', signalTiming: 50, waitingTime: 55 },
  { id: 'INT-005', name: 'Nehru Place Flyover', lat: 28.5491, lng: 77.2533, vehicleCount: 18, density: 'low', signal: 'green', signalTiming: 25, waitingTime: 8 },
  { id: 'INT-006', name: 'Rajiv Chowk', lat: 28.6328, lng: 77.2197, vehicleCount: 62, density: 'high', signal: 'red', signalTiming: 55, waitingTime: 72 },
  { id: 'INT-007', name: 'Moolchand Flyover', lat: 28.5685, lng: 77.2395, vehicleCount: 28, density: 'medium', signal: 'yellow', signalTiming: 32, waitingTime: 25 },
  { id: 'INT-008', name: 'Sarai Kale Khan', lat: 28.5893, lng: 77.2568, vehicleCount: 14, density: 'low', signal: 'green', signalTiming: 20, waitingTime: 6 },
  { id: 'INT-009', name: 'Dhaula Kuan', lat: 28.5921, lng: 77.1663, vehicleCount: 46, density: 'high', signal: 'red', signalTiming: 42, waitingTime: 52 },
  { id: 'INT-010', name: 'Ashram Chowk', lat: 28.5700, lng: 77.2500, vehicleCount: 22, density: 'medium', signal: 'green', signalTiming: 28, waitingTime: 15 },
  { id: 'INT-011', name: 'AIIMS Flyover', lat: 28.5672, lng: 77.2100, vehicleCount: 33, density: 'medium', signal: 'yellow', signalTiming: 30, waitingTime: 28 },
  { id: 'INT-012', name: 'Kashmere Gate ISBT', lat: 28.6676, lng: 77.2285, vehicleCount: 55, density: 'high', signal: 'red', signalTiming: 48, waitingTime: 60 },
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
