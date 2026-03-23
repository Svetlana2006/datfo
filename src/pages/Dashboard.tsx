import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Car, AlertTriangle, Route, Clock } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import StatCard from '@/components/dashboard/StatCard';
import CityMap from '@/components/dashboard/CityMap';
import { api } from '@/lib/api';
import { buildTrafficFlowData, summarizeLiveTraffic } from '@/lib/analytics';

export default function Dashboard() {
  const { data: traffic, isLoading } = useQuery({
    queryKey: ['traffic'],
    queryFn: api.getTraffic,
    refetchInterval: 4_000,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['traffic-history'],
    queryFn: api.getTrafficHistory,
    refetchInterval: 10_000,
  });

  const intersections = traffic?.intersections ?? [];
  const { totalVehicles, congested, avgWait } = summarizeLiveTraffic(intersections);
  const trafficFlowData = useMemo(() => buildTrafficFlowData(history), [history]);

  if (isLoading && intersections.length === 0) {
    return <div className="flex h-96 items-center justify-center text-muted-foreground animate-pulse">Connecting to Traffic Control System...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-mono-tech neon-text-cyan">Command Center</h2>
          <p className="text-xs text-muted-foreground mt-1">Live backend telemetry across traffic, signals, and emergency corridors</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Vehicles" value={totalVehicles} icon={Car} variant="cyan" trend={`${intersections.length} intersections online`} />
        <StatCard title="Congested" value={congested} icon={AlertTriangle} variant="red" trend={`${congested} high-density junctions`} />
        <StatCard title="Emergency Routes" value={traffic?.summary.active_corridors ?? 0} icon={Route} variant="green" trend="Active green corridors" />
        <StatCard title="Avg Wait Time" value={`${avgWait}s`} icon={Clock} variant="yellow" trend="Adaptive cycle estimate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CityMap liveIntersections={intersections} />
        </div>
        <div className="glass-card p-4">
          <span className="text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">Traffic Flow - 24h</span>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficFlowData}>
                <defs>
                  <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(186 100% 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(186 100% 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(222 47% 9%)', border: '1px solid hsl(222 30% 18%)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'hsl(186 100% 50%)' }}
                />
                <Area type="monotone" dataKey="vehicles" stroke="hsl(186 100% 50%)" fill="url(#flowGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
