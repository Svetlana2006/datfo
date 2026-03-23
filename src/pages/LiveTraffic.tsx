import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import TrafficLightIcon from '@/components/dashboard/TrafficLightIcon';
import DensityBar from '@/components/dashboard/DensityBar';
import { motion } from 'framer-motion';
import { MapPin, Car } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { trafficFlowData } from '@/data/mockData';

function getStaticMapUrl(lat: number, lng: number, zoom = 15) {
  // Using OpenStreetMap static tile via a tile server
  const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
  const y = Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

export default function LiveTraffic() {
  const { data: intersections = [], isLoading: isIntersectionsLoading } = useQuery({
    queryKey: ['intersections'],
    queryFn: api.getIntersections,
    refetchInterval: 5000,
  });

  const { data: aiDecision } = useQuery({
    queryKey: ['aiDecision'],
    queryFn: api.getAIDecision,
    refetchInterval: 10000,
  });

  const getDensityLabel = (d: number): 'low' | 'medium' | 'high' => {
    if (d > 0.7) return 'high';
    if (d > 0.3) return 'medium';
    return 'low';
  };

  if (isIntersectionsLoading && intersections.length === 0) {
    return <div className="flex h-96 items-center justify-center text-muted-foreground animate-pulse">Connecting to Traffic Monitoring System...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-mono-tech neon-text-cyan">Live Traffic Monitoring — Delhi NCR</h2>
        {aiDecision && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 px-4 py-2 glass-card border-primary/30"
          >
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono-tech">AI Traffic Optimization</p>
              <p className="text-xs text-foreground font-medium max-w-[300px] truncate">{aiDecision.reason}</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-primary">{aiDecision.confidence}%</span>
              <span className="text-[10px] text-muted-foreground uppercase font-mono-tech">Confidence</span>
            </div>
          </motion.div>
        )}
      </div>

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

            {/* Map tile showing the intersection location */}
            <div className="h-24 rounded-md overflow-hidden border border-border relative group">
              <img
                src={getStaticMapUrl(int.lat, int.lng, 15)}
                alt={`Map of ${int.name}`}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-1 left-1 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-mono-tech text-primary">
                  {int.lat.toFixed(4)}°N, {int.lng.toFixed(4)}°E
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Car className="h-3 w-3" />
                <span className="font-mono-tech">{int.vehicle_count}</span>
              </div>
              <span className="text-muted-foreground font-mono-tech">Wait: {int.waiting_time}s</span>
            </div>
            <DensityBar density={getDensityLabel(int.density)} />
          </motion.div>
        ))}
      </div>

      <div className="glass-card p-4">
        <span className="text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">Real-Time Traffic Flow — Delhi</span>
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