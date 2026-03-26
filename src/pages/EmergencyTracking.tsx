import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Ambulance, CheckCircle2, Flame, Navigation, ScanSearch, ShieldAlert, Siren } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api, type EmergencyDetectionResult, type EmergencyType } from '@/lib/api';

const typeIcon = { ambulance: Ambulance, fire: Flame, police: ShieldAlert };
const typeColor = { ambulance: 'text-neon-red', fire: 'text-neon-orange', police: 'text-neon-blue' };

function titleCase(value: string | null | undefined) {
  if (!value) return 'None';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function EmergencyTracking() {
  const queryClient = useQueryClient();
  const [detectionResult, setDetectionResult] = useState<EmergencyDetectionResult | null>(null);

  const { data: emergencyEvents = [] } = useQuery({
    queryKey: ['emergency-events'],
    queryFn: api.getEmergencyEvents,
    refetchInterval: 8_000,
  });

  const detectionMutation = useMutation({
    mutationFn: (payload?: {
      trigger_mode?: 'random-scan' | 'manual-trigger';
      force_emergency?: boolean;
      type?: EmergencyType;
      location?: string;
      route?: string[];
      source?: string;
      destination?: string;
    }) => api.detectEmergency(payload),
    onSuccess: (result) => {
      setDetectionResult(result);
      queryClient.invalidateQueries({ queryKey: ['emergency-events'] });
    },
  });

  const runRandomScan = () => {
    detectionMutation.mutate(undefined);
  };

  const triggerEmergencyDemo = () => {
    detectionMutation.mutate({
      trigger_mode: 'manual-trigger',
      force_emergency: true,
      type: 'ambulance',
      location: 'Control Room',
      route: ['INT-001', 'INT-007', 'INT-011'],
      source: 'ITO Intersection',
      destination: 'AIIMS Flyover',
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-mono-tech neon-text-cyan">Emergency Vehicle Tracking</h2>

      <div className="glass-card p-5 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-mono-tech uppercase tracking-[0.2em] text-primary">Detection workflow</p>
            <h3 className="text-lg font-semibold text-foreground">Live `/emergency` detection and event logging</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Random scans and manual triggers now go through the backend and create persistent emergency events.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={runRandomScan} variant="outline" className="font-mono-tech text-xs" disabled={detectionMutation.isPending}>
              <ScanSearch className="h-4 w-4 mr-2" />
              Random scan
            </Button>
            <Button onClick={triggerEmergencyDemo} className="font-mono-tech text-xs" disabled={detectionMutation.isPending}>
              <Siren className="h-4 w-4 mr-2" />
              Trigger emergency
            </Button>
          </div>
        </div>

        {detectionResult && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-md border border-border bg-background/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">/emergency</span>
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
                  <p className="font-mono-tech text-foreground">{detectionResult.trigger_mode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vehicle type</p>
                  <p className="font-mono-tech text-foreground">{titleCase(detectionResult.type)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Confidence</p>
                  <p className="font-mono-tech text-foreground">{detectionResult.confidence}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-mono-tech text-foreground">{detectionResult.location ?? 'Network scan'}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{detectionResult.action}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {emergencyEvents.map((event, index) => {
          const Icon = typeIcon[event.type];
          const isActive = event.active && !event.resolved;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`glass-card p-5 space-y-4 ${isActive ? '' : 'opacity-60'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md bg-card border border-border ${typeColor[event.type]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold font-mono-tech text-foreground">EVT-{event.id}</p>
                    <p className="text-xs text-muted-foreground">{titleCase(event.type)}</p>
                  </div>
                </div>
                <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-neon-green/10 text-neon-green border-neon-green/30' : ''}>
                  {isActive ? <Navigation className="h-3 w-3 mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {isActive ? 'Active' : 'Logged'}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Location</span>
                  <span className="text-foreground font-medium text-right">{event.location}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Severity</span>
                  <span className="text-foreground font-medium text-right">{event.severity}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Trigger</span>
                  <span className="font-mono-tech text-foreground text-right">{event.trigger_mode}</span>
                </div>
                {event.source && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Source</span>
                    <span className="text-foreground font-medium text-right">{event.source}</span>
                  </div>
                )}
                {event.destination && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Destination</span>
                    <span className="text-foreground font-medium text-right">{event.destination}</span>
                  </div>
                )}
              </div>

              {event.route.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {event.route.map((id) => (
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
