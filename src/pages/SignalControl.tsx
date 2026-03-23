import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { RotateCcw, Sparkles } from 'lucide-react';
import DensityBar from '@/components/dashboard/DensityBar';
import TrafficLightIcon from '@/components/dashboard/TrafficLightIcon';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { api, type SignalState } from '@/lib/api';
import { optimizeSignal as buildOptimizationPreview } from '@/lib/trafficEngine';

export default function SignalControl() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState('INT-001');

  const { data: intersections = [], isLoading } = useQuery({
    queryKey: ['intersections'],
    queryFn: api.getIntersections,
    refetchInterval: 4_000,
  });

  const refreshTrafficState = () => {
    queryClient.invalidateQueries({ queryKey: ['intersections'] });
    queryClient.invalidateQueries({ queryKey: ['traffic'] });
    queryClient.invalidateQueries({ queryKey: ['traffic-history'] });
    queryClient.invalidateQueries({ queryKey: ['signals'] });
    queryClient.invalidateQueries({ queryKey: ['aiDecision'] });
  };

  const signalMutation = useMutation({
    mutationFn: ({ id, signal }: { id: string; signal: SignalState }) => api.updateSignal(id, signal),
    onSuccess: refreshTrafficState,
  });

  const timingMutation = useMutation({
    mutationFn: ({ id, timing }: { id: string; timing: number }) => api.updateTiming(id, timing),
    onSuccess: refreshTrafficState,
  });

  const optimizationMutation = useMutation({
    mutationFn: (intersectionId: string) => api.optimizeSignal(intersectionId),
    onSuccess: refreshTrafficState,
  });

  const overrideSignal = (id: string, currentSignal: SignalState) => {
    const next = currentSignal === 'red' ? 'green' : currentSignal === 'green' ? 'yellow' : 'red';
    signalMutation.mutate({ id, signal: next });
  };

  const updateTiming = (id: string, timing: number) => {
    timingMutation.mutate({ id, timing });
  };

  const applyOptimization = (id: string) => {
    optimizationMutation.mutate(id);
  };

  const selectedIntersection = intersections.find((entry) => entry.id === selectedId);
  const optimizationPreview = selectedIntersection ? buildOptimizationPreview(selectedIntersection) : null;

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
              <p className="text-xs font-mono-tech uppercase tracking-[0.2em] text-primary">Live endpoint</p>
              <h3 className="text-lg font-semibold text-foreground">{optimizationPreview.endpoint}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Optimization is now applied by the backend and persisted to the shared traffic state.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {intersections.map((intersection) => (
                <Button
                  key={intersection.id}
                  variant={selectedId === intersection.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedId(intersection.id)}
                  className="text-xs font-mono-tech"
                >
                  {intersection.id}
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
              {intersections.map((intersection, index) => {
                const preview = buildOptimizationPreview(intersection);

                return (
                  <motion.tr
                    key={intersection.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-border/50 hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{intersection.name}</p>
                        <p className="text-xs text-muted-foreground font-mono-tech">{intersection.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3"><TrafficLightIcon signal={intersection.signal} size="sm" /></td>
                    <td className="px-4 py-3 w-40"><DensityBar density={intersection.density_label} /></td>
                    <td className="px-4 py-3 w-48">
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[intersection.signal_timing]}
                          onValueChange={([value]) => updateTiming(intersection.id, value)}
                          min={10}
                          max={75}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs font-mono-tech text-primary w-8 text-right">{intersection.signal_timing}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyOptimization(intersection.id)}
                        className="text-xs font-mono-tech border-neon-green/30 text-neon-green hover:bg-neon-green/10"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {preview.optimizedGreen}s
                      </Button>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => overrideSignal(intersection.id, intersection.signal)}
                        className="text-xs font-mono-tech border-primary/30 text-primary hover:bg-primary/10"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" /> Override
                      </Button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
