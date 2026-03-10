import { useState } from 'react';
import { emergencyVehicles } from '@/data/mockData';
import CityMap from '@/components/dashboard/CityMap';
import { motion } from 'framer-motion';
import { Ambulance, Flame, ShieldAlert, Navigation, Clock, MapPin } from 'lucide-react';

const typeIcon = {
  Ambulance: Ambulance,
  Fire: Flame,
  Police: ShieldAlert,
};

const typeColor = {
  Ambulance: 'text-neon-red',
  Fire: 'text-neon-orange',
  Police: 'text-neon-blue',
};

export default function EmergencyCorridor() {
  const [selectedId, setSelectedId] = useState<string | null>(emergencyVehicles[0].id);
  const selected = emergencyVehicles.find((v) => v.id === selectedId);
  const activeVehicles = emergencyVehicles.filter((v) => v.status === 'En route');

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
        {/* Vehicle list */}
        <div className="space-y-3">
          <span className="text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">Active Emergency Vehicles</span>
          {activeVehicles.map((v) => {
            const Icon = typeIcon[v.type];
            const isSelected = selectedId === v.id;
            return (
              <motion.button
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                whileHover={{ scale: 1.02 }}
                className={`w-full glass-card p-4 text-left transition-all ${isSelected ? 'border-primary neon-glow-cyan' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md bg-card border border-border ${typeColor[v.type]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{v.id}</p>
                    <p className="text-xs text-muted-foreground">{v.type}</p>
                  </div>
                  <span className="text-xs font-mono-tech text-primary">{v.eta} min</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Map */}
        <div className="lg:col-span-2 space-y-4">
          <CityMap highlightRoute={selected?.routeIntersections} />

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
                  <p className="text-sm font-medium text-foreground">{selected.currentLocation}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-neon-green" />
                <div>
                  <p className="text-xs text-muted-foreground">To</p>
                  <p className="text-sm font-medium text-foreground">{selected.destination}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-neon-yellow" />
                <div>
                  <p className="text-xs text-muted-foreground">ETA</p>
                  <p className="text-sm font-bold font-mono-tech neon-text-cyan">{selected.eta} min</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-neon-blue" />
                <div>
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="text-sm font-bold font-mono-tech text-foreground">{selected.distance} km</p>
                </div>
              </div>
            </motion.div>
          )}

          {selected && (
            <div className="glass-card p-4">
              <span className="text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">Corridor Signals — Turning Green</span>
              <div className="flex gap-3 mt-3 flex-wrap">
                {selected.routeIntersections.map((id, idx) => (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.2 }}
                    className="px-3 py-1.5 rounded-md bg-traffic-green/10 border border-traffic-green/30 text-xs font-mono-tech text-traffic-green"
                  >
                    {id} ● GREEN
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
