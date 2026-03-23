import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Ambulance, Clock, Flame, MapPin, Navigation, ShieldAlert } from 'lucide-react';
import CityMap from '@/components/dashboard/CityMap';
import { api } from '@/lib/api';

const typeIcon = {
  ambulance: Ambulance,
  fire: Flame,
  police: ShieldAlert,
};

const typeColor = {
  ambulance: 'text-neon-red',
  fire: 'text-neon-orange',
  police: 'text-neon-blue',
};

function isPresent<T>(value: T | null | undefined): value is T {
  return value != null;
}

function titleCase(value: string | null | undefined) {
  if (!value) return 'Unknown';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function EmergencyCorridor() {
  const { data: intersections = [] } = useQuery({
    queryKey: ['intersections'],
    queryFn: api.getIntersections,
    refetchInterval: 4_000,
  });

  const { data: emergencyEvents = [] } = useQuery({
    queryKey: ['emergency-events'],
    queryFn: api.getEmergencyEvents,
    refetchInterval: 6_000,
  });

  const activeVehicles = emergencyEvents.filter((event) => event.active && !event.resolved && event.route.length > 0);
  const [selectedId, setSelectedId] = useState<string | null>(activeVehicles[0]?.id ? String(activeVehicles[0].id) : null);

  useEffect(() => {
    if (!selectedId && activeVehicles[0]) {
      setSelectedId(String(activeVehicles[0].id));
    }
  }, [activeVehicles, selectedId]);

  const selected = activeVehicles.find((event) => String(event.id) === selectedId) ?? activeVehicles[0];
  const routeIntersections = selected
    ? selected.route
        .map((id) => intersections.find((intersection) => intersection.id === id))
        .filter(isPresent)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-mono-tech neon-text-cyan">Emergency Corridor System</h2>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card px-4 py-2 flex items-center gap-3 border-neon-red/30 animate-beacon"
          >
            <span className="h-2 w-2 rounded-full bg-neon-red animate-ping" />
            <span className="text-xs font-mono-tech text-neon-red uppercase">Green Corridor Active</span>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <span className="text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">Active Emergency Vehicles</span>
          {activeVehicles.map((event) => {
            const Icon = typeIcon[event.type];
            const isSelected = selectedId === String(event.id);
            return (
              <motion.button
                key={event.id}
                onClick={() => setSelectedId(String(event.id))}
                whileHover={{ scale: 1.02 }}
                className={`w-full glass-card p-4 text-left transition-all ${isSelected ? 'border-primary neon-glow-cyan' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md bg-card border border-border ${typeColor[event.type]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">EVT-{event.id}</p>
                    <p className="text-xs text-muted-foreground">{titleCase(event.type)}</p>
                  </div>
                  <span className="text-xs font-mono-tech text-primary">{event.route.length} nodes</span>
                </div>
              </motion.button>
            );
          })}
          {activeVehicles.length === 0 && (
            <div className="glass-card p-4 text-sm text-muted-foreground">
              No active corridor events yet. Use the emergency tracking or green corridor screens to create one.
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <CityMap highlightRoute={selected?.route} liveIntersections={intersections} />

          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">From</p>
                  <p className="text-sm font-medium text-foreground">{selected.source ?? selected.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-neon-green" />
                <div>
                  <p className="text-xs text-muted-foreground">To</p>
                  <p className="text-sm font-medium text-foreground">{selected.destination ?? 'In transit'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-neon-yellow" />
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-bold font-mono-tech neon-text-cyan">{selected.active ? 'ACTIVE' : 'LOGGED'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-neon-blue" />
                <div>
                  <p className="text-xs text-muted-foreground">Intersections</p>
                  <p className="text-sm font-bold font-mono-tech text-foreground">{selected.route.length}</p>
                </div>
              </div>
            </motion.div>
          )}

          {routeIntersections.length > 0 && (
            <div className="glass-card p-4">
              <span className="text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">Corridor Signals - Backend Override</span>
              <div className="flex gap-3 mt-3 flex-wrap">
                {routeIntersections.map((intersection, index) => (
                  <motion.div
                    key={intersection.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.2 }}
                    className="px-3 py-1.5 rounded-md bg-traffic-green/10 border border-traffic-green/30 text-xs font-mono-tech text-traffic-green"
                  >
                    {intersection.id} - {intersection.signal.toUpperCase()}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
