import { useState } from 'react';
import { emergencyVehicles } from '@/data/mockData';
import { motion } from 'framer-motion';
import { Ambulance, Flame, ShieldAlert, CheckCircle2, Navigation, Siren, ScanSearch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { detectEmergencyVehicle } from '@/lib/trafficEngine';

const typeIcon = { Ambulance, Fire: Flame, Police: ShieldAlert };
const typeColor = { Ambulance: 'text-neon-red', Fire: 'text-neon-orange', Police: 'text-neon-blue' };

export default function EmergencyTracking() {
  const [detectionResult, setDetectionResult] = useState(() =>
    detectEmergencyVehicle({ triggerMode: 'random-scan', randomValue: 0.25 })
  );

  const runRandomScan = () => {
    setDetectionResult(detectEmergencyVehicle({ triggerMode: 'random-scan' }));
  };

  const triggerEmergencyDemo = () => {
    setDetectionResult(detectEmergencyVehicle({ triggerMode: 'manual-trigger', forceEmergency: true }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-mono-tech neon-text-cyan">Emergency Vehicle Tracking</h2>

      <div className="glass-card p-5 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-mono-tech uppercase tracking-[0.2em] text-primary">Detection demo</p>
            <h3 className="text-lg font-semibold text-foreground">Merged `/traffic` emergency response</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Use a random scan or force an emergency event for the demo presentation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={runRandomScan} variant="outline" className="font-mono-tech text-xs">
              <ScanSearch className="h-4 w-4 mr-2" />
              Random scan
            </Button>
            <Button onClick={triggerEmergencyDemo} className="font-mono-tech text-xs">
              <Siren className="h-4 w-4 mr-2" />
              Trigger emergency
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-border bg-background/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{detectionResult.endpoint}</span>
              <Badge
                variant={detectionResult.emergency ? 'default' : 'secondary'}
                className={detectionResult.emergency ? 'bg-neon-red/10 text-neon-red border-neon-red/30' : ''}
              >
                emergency = {String(detectionResult.emergency)}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Trigger mode</p>
                <p className="font-mono-tech text-foreground">{detectionResult.triggerMode}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Vehicle type</p>
                <p className="font-mono-tech text-foreground">{detectionResult.type ?? 'None'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Confidence</p>
                <p className="font-mono-tech text-foreground">{detectionResult.confidence}%</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{detectionResult.action}</p>
          </div>

          <pre className="rounded-md border border-border bg-black/30 p-4 text-xs text-primary overflow-x-auto">
{JSON.stringify(detectionResult, null, 2)}
          </pre>
        </div>
      </div>

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
