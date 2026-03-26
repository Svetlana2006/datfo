import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Car, MapPin } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import DensityBar from '@/components/dashboard/DensityBar';
import TrafficLightIcon from '@/components/dashboard/TrafficLightIcon';
import { buildTrafficFlowData } from '@/lib/analytics';
import { api } from '@/lib/api';

function getTileCoords(lat: number, lng: number, zoom: number) {
  const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
  const y = Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      Math.pow(2, zoom),
  );
  return { x, y };
}

function getStaticMapGrid(lat: number, lng: number, zoom = 15) {
  const { x, y } = getTileCoords(lat, lng, zoom);
  const tiles = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      tiles.push(`https://tile.openstreetmap.org/${zoom}/${x + dx}/${y + dy}.png`);
    }
  }
  return tiles;
}

export default function LiveTraffic() {
  const queryClient = useQueryClient();

  const { data: intersections = [], isLoading: isIntersectionsLoading } = useQuery({
    queryKey: ['intersections'],
    queryFn: () => api.getIntersections(),
  });

  useEffect(() => {
    return api.subscribeToEvents((data) => {
      queryClient.setQueryData(['intersections'], data.intersections);
      queryClient.setQueryData(['traffic-summary'], data.summary);
      // Invalidate AI decision to keep it relatively fresh without constant polling
      queryClient.invalidateQueries({ queryKey: ['aiDecision'] });
    });
  }, [queryClient]);

  const { data: aiDecision } = useQuery({
    queryKey: ['aiDecision'],
    queryFn: () => api.getAIDecision(),
    refetchInterval: 10_000,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['traffic-history'],
    queryFn: () => api.getTrafficHistory(),
    refetchInterval: 10_000,
  });

  const trafficFlowData = useMemo(() => buildTrafficFlowData(history), [history]);

  if (isIntersectionsLoading && intersections.length === 0) {
    return <div className="flex h-96 items-center justify-center text-muted-foreground animate-pulse">Connecting to Traffic Monitoring System...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-mono-tech neon-text-cyan">Live Traffic Monitoring - Delhi NCR</h2>
        {aiDecision && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 px-4 py-2 glass-card border-primary/30"
          >
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono-tech">AI Traffic Optimization</p>
              <p className="text-xs text-foreground font-medium max-w-[340px] truncate">{aiDecision.reason}</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-primary">{aiDecision.confidence}%</span>
              <span className="text-[10px] text-muted-foreground uppercase font-mono-tech">Confidence</span>
            </div>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {intersections.map((intersection, index) => (
          <motion.div
            key={intersection.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-tech text-muted-foreground">{intersection.id}</span>
              <TrafficLightIcon signal={intersection.signal} size="sm" />
            </div>
            <h3 className="text-sm font-semibold text-foreground truncate">{intersection.name}</h3>

            <div className="h-32 rounded-md overflow-hidden border border-border relative group bg-muted">
              <div className="grid grid-cols-3 w-[300%] h-[300%] -ml-[100%] -mt-[100%] opacity-60 group-hover:opacity-100 transition-opacity duration-500 scale-110">
                {getStaticMapGrid(intersection.lat, intersection.lng, 15).map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
              <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-primary/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-md rounded-full animate-pulse" />
                  <MapPin className="h-5 w-5 text-primary relative drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                </div>
              </div>
              <div className="absolute bottom-1.5 left-2 flex items-center gap-1.5">
                <span className="text-[10px] font-mono-tech text-primary bg-background/60 px-1.5 py-0.5 rounded border border-primary/20 backdrop-blur-sm">
                  {intersection.lat.toFixed(4)}N, {intersection.lng.toFixed(4)}E
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Car className="h-3 w-3" />
                <span className="font-mono-tech">{intersection.vehicle_count}</span>
              </div>
              <span className="text-muted-foreground font-mono-tech">Wait: {intersection.waiting_time}s</span>
            </div>
            <DensityBar density={intersection.density_label} />
          </motion.div>
        ))}
      </div>

      <div className="glass-card p-4">
        <span className="text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">Real-Time Traffic Flow - Delhi</span>
        <div className="mt-4 h-64">
          {trafficFlowData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trafficFlowData}>
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(222 47% 9%)', border: '1px solid hsl(222 30% 18%)', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="vehicles" stroke="hsl(186 100% 50%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="avgWait" stroke="hsl(152 100% 45%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground italic">
              Aggregating historical traffic data points...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
