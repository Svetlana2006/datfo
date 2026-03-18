import { useIntersections } from '@/hooks/useIntersections';
import TrafficLightIcon from '@/components/dashboard/TrafficLightIcon';
import DensityBar from '@/components/dashboard/DensityBar';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

export default function SignalControl() {
  const data = useIntersections();

  const updateTiming = async (id: string, val: number) => {
    // Note: To persist this natively, a dedicated PUT endpoint should be attached in the backend
    console.log(`Updated timing for ${id} to ${val}`);
  };

  const overrideSignal = async (id: string) => {
    try {
      await fetch(`http://localhost:8000/green-corridor?intersection_id=${id}`, { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-mono-tech neon-text-cyan">Signal Control Panel</h2>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">Intersection</th>
                <th className="px-4 py-3 text-left text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">Signal</th>
                <th className="px-4 py-3 text-left text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">Density</th>
                <th className="px-4 py-3 text-left text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">Timing (s)</th>
                <th className="px-4 py-3 text-left text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">Override</th>
              </tr>
            </thead>
            <tbody>
              {data.map((int, i) => (
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
                  <td className="px-4 py-3 w-40"><DensityBar density={int.density} /></td>
                  <td className="px-4 py-3 w-48">
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[int.signalTiming]}
                        onValueChange={([v]) => updateTiming(int.id, v)}
                        min={10}
                        max={60}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs font-mono-tech text-primary w-8 text-right">{int.signalTiming}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => overrideSignal(int.id)}
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
