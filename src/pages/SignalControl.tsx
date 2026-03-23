import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import TrafficLightIcon from '@/components/dashboard/TrafficLightIcon';
import DensityBar from '@/components/dashboard/DensityBar';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { RotateCcw, Sparkles } from 'lucide-react';
import { optimizeSignal } from '@/lib/trafficEngine';

export default function SignalControl() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState('INT-001');

  const { data: intersections = [], isLoading } = useQuery({
    queryKey: ['intersections'],
    queryFn: api.getIntersections,
    refetchInterval: 5000,
  });

  const signalMutation = useMutation({
    mutationFn: ({ id, signal }: { id: string; signal: string }) => api.updateSignal(id, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intersections'] });
    },
  });

  const timingMutation = useMutation({
    mutationFn: ({ id, timing }: { id: string; timing: number }) => api.updateTiming(id, timing),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intersections'] });
    },
  });

  const overrideSignal = (id: string, currentSignal: string) => {
    const next = currentSignal === 'red' ? 'green' : currentSignal === 'green' ? 'yellow' : 'red';
    signalMutation.mutate({ id, signal: next });
  };

  const updateTiming = (id: string, timing: number) => {
    timingMutation.mutate({ id, timing });
  };

  const getDensityLabel = (d: number): 'low' | 'medium' | 'high' => {
    if (d > 0.7) return 'high';
    if (d > 0.3) return 'medium';
    return 'low';
  };

  // Helper to map backend intersection to what trafficEngine expects
  const mapToInt = (int: any) => ({
    ...int,
    vehicleCount: int.vehicle_count,
    waitingTime: int.waiting_time,
    signalTiming: int.signal_timing,
    density: getDensityLabel(int.density)
  });

  const applyOptimization = (id: string) => {
    const int = intersections.find(i => i.id === id);
    if (int) {
      const optimization = optimizeSignal(mapToInt(int));
      updateTiming(id, optimization.optimizedGreen);
    }
  };

  const selectedIntersection = intersections.find(i => i.id === selectedId);
  const optimizationPreview = selectedIntersection ? optimizeSignal(mapToInt(selectedIntersection)) : null;

  if (isLoading && intersections.length === 0) {
    return <div className="flex h-96 items-center justify-center text-muted-foreground animate-pulse">Connecting to Signal Control System...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-mono-tech neon-text-cyan">Signal Control Panel</h2>

      {optimizationPreview && (
        <div className="glass-card p-5 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-mono-tech uppercase tracking-[0.2em] text-primary">Simulated endpoint</p>
              <h3 className="text-lg font-semibold text-foreground">{optimizationPreview.endpoint}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                High traffic gets a longer green phase, while low traffic gets a shorter one.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {intersections.map((int) => (
                <Button
                  key={int.id}
                  variant={selectedId === int.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedId(int.id)}
                  className="text-xs font-mono-tech"
                >
                  {int.id}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-md border border-border bg-background/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{optimizationPreview.intersectionName}</span>
                <span className="text-xs font-mono-tech uppercase text-primary">{optimizationPreview.trafficLevel}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Vehicle count</p>
                  <p className="font-mono-tech text-foreground">{optimizationPreview.vehicleCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current green</p>
                  <p className="font-mono-tech text-foreground">{optimizationPreview.currentGreen}s</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Optimized green</p>
                  <p className="font-mono-tech text-primary">{optimizationPreview.optimizedGreen}s</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estimated wait after</p>
                  <p className="font-mono-tech text-foreground">{optimizationPreview.estimatedWaitAfterOptimization}s</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{optimizationPreview.reason}</p>
            </div>

            <pre className="rounded-md border border-border bg-black/30 p-4 text-xs text-primary overflow-x-auto">
{JSON.stringify(optimizationPreview, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">Intersection</th>
                <th className="px-4 py-3 text-left text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">Signal</th>
                <th className="px-4 py-3 text-left text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">Density</th>
                <th className="px-4 py-3 text-left text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">Timing (s)</th>
                <th className="px-4 py-3 text-left text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">Optimized</th>
                <th className="px-4 py-3 text-left text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">Override</th>
              </tr>
            </thead>
            <tbody>
              {intersections.map((int, i) => (
                <motion.tr
                  key={int.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-accent/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{int.name}</p>
                      <p className="text-xs text-muted-foreground font-mono-tech">{int.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3"><TrafficLightIcon signal={int.signal} size="sm" /></td>
                  <td className="px-4 py-3 w-40"><DensityBar density={getDensityLabel(int.density)} /></td>
                  <td className="px-4 py-3 w-48">
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[int.signal_timing]}
                        onValueChange={([v]) => updateTiming(int.id, v)}
                        min={10}
                        max={60}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs font-mono-tech text-primary w-8 text-right">{int.signal_timing}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyOptimization(int.id)}
                      className="text-xs font-mono-tech border-neon-green/30 text-neon-green hover:bg-neon-green/10"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {optimizeSignal(mapToInt(int)).optimizedGreen}s
                    </Button>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => overrideSignal(int.id, int.signal)}
                      className="text-xs font-mono-tech border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" /> Override
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
