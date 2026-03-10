import { emergencyVehicles } from '@/data/mockData';
import { motion } from 'framer-motion';
import { Ambulance, Flame, ShieldAlert, CheckCircle2, Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const typeIcon = { Ambulance, Fire: Flame, Police: ShieldAlert };
const typeColor = { Ambulance: 'text-neon-red', Fire: 'text-neon-orange', Police: 'text-neon-blue' };

export default function EmergencyTracking() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-mono-tech neon-text-cyan">Emergency Vehicle Tracking</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {emergencyVehicles.map((v, i) => {
          const Icon = typeIcon[v.type];
          const completed = v.status === 'Completed';
          return (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`glass-card p-5 space-y-4 ${completed ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md bg-card border border-border ${typeColor[v.type]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold font-mono-tech text-foreground">{v.id}</p>
                    <p className="text-xs text-muted-foreground">{v.type}</p>
                  </div>
                </div>
                <Badge variant={completed ? 'secondary' : 'default'} className={completed ? '' : 'bg-neon-green/10 text-neon-green border-neon-green/30'}>
                  {completed ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Navigation className="h-3 w-3 mr-1" />}
                  {v.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Location</span>
                  <span className="text-foreground font-medium">{v.currentLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destination</span>
                  <span className="text-foreground font-medium">{v.destination}</span>
                </div>
                {!completed && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ETA</span>
                      <span className="font-mono-tech neon-text-cyan font-bold">{v.eta} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Distance</span>
                      <span className="font-mono-tech text-foreground">{v.distance} km</span>
                    </div>
                  </>
                )}
              </div>

              {!completed && v.routeIntersections.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {v.routeIntersections.map((id) => (
                    <span key={id} className="px-2 py-0.5 text-[10px] font-mono-tech rounded bg-primary/10 text-primary border border-primary/20">{id}</span>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
