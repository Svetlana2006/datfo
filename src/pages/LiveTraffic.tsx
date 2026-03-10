import { intersections, trafficFlowData } from '@/data/mockData';
import TrafficLightIcon from '@/components/dashboard/TrafficLightIcon';
import DensityBar from '@/components/dashboard/DensityBar';
import { motion } from 'framer-motion';
import { Camera, Car } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function LiveTraffic() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-mono-tech neon-text-cyan">Live Traffic Monitoring</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {intersections.map((int, i) => (
          <motion.div
            key={int.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-tech text-muted-foreground">{int.id}</span>
              <TrafficLightIcon signal={int.signal} size="sm" />
            </div>
            <h3 className="text-sm font-semibold text-foreground truncate">{int.name}</h3>

            {/* Camera placeholder */}
            <div className="h-20 bg-muted/30 rounded-md flex items-center justify-center border border-border">
              <Camera className="h-6 w-6 text-muted-foreground/40" />
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Car className="h-3 w-3" />
                <span className="font-mono-tech">{int.vehicleCount}</span>
              </div>
              <span className="text-muted-foreground font-mono-tech">Wait: {int.waitingTime}s</span>
            </div>
            <DensityBar density={int.density} />
          </motion.div>
        ))}
      </div>

      <div className="glass-card p-4">
        <span className="text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">Real-Time Traffic Flow</span>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trafficFlowData}>
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(222 47% 9%)', border: '1px solid hsl(222 30% 18%)', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="vehicles" stroke="hsl(186 100% 50%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="avgWait" stroke="hsl(152 100% 45%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
