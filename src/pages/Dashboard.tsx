import StatCard from '@/components/dashboard/StatCard';
import CityMap from '@/components/dashboard/CityMap';
import { Car, AlertTriangle, Route, Clock } from 'lucide-react';
import { intersections, trafficFlowData } from '@/data/mockData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const totalVehicles = intersections.reduce((s, i) => s + i.vehicleCount, 0);
  const congested = intersections.filter((i) => i.density === 'high').length;
  const avgWait = Math.round(intersections.reduce((s, i) => s + i.waitingTime, 0) / intersections.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-mono-tech neon-text-cyan">Command Center</h2>
          <p className="text-xs text-muted-foreground mt-1">Real-time traffic overview — All systems operational</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Vehicles" value={totalVehicles} icon={Car} variant="cyan" trend="+12% from last hour" />
        <StatCard title="Congested" value={congested} icon={AlertTriangle} variant="red" trend={`${congested} of ${intersections.length}`} />
        <StatCard title="Emergency Routes" value={3} icon={Route} variant="green" trend="Active corridors" />
        <StatCard title="Avg Wait Time" value={`${avgWait}s`} icon={Clock} variant="yellow" trend="-5s from avg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CityMap />
        </div>
        <div className="glass-card p-4">
          <span className="text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">Traffic Flow — 24h</span>
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
