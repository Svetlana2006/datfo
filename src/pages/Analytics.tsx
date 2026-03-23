import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '@/lib/api';
import { applyEmergencyCounts, buildHeatmapData, buildTrafficFlowData, buildWeeklyCongestion } from '@/lib/analytics';

const tooltipStyle = {
  contentStyle: { background: 'hsl(222 47% 9%)', border: '1px solid hsl(222 30% 18%)', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: 'hsl(186 100% 50%)' },
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
      <span className="text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">{title}</span>
      <div className="mt-4 h-64">{children}</div>
    </motion.div>
  );
}

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Analytics() {
  const { data: history = [] } = useQuery({
    queryKey: ['traffic-history'],
    queryFn: api.getTrafficHistory,
    refetchInterval: 10_000,
  });

  const { data: emergencyEvents = [] } = useQuery({
    queryKey: ['emergency-events'],
    queryFn: api.getEmergencyEvents,
    refetchInterval: 10_000,
  });

  const trafficFlowData = useMemo(() => buildTrafficFlowData(history), [history]);
  const weeklyData = useMemo(
    () => applyEmergencyCounts(buildWeeklyCongestion(history), emergencyEvents),
    [history, emergencyEvents],
  );
  const heatData = useMemo(() => buildHeatmapData(history), [history]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-mono-tech neon-text-cyan">Analytics & Reports</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Traffic Density Over Time (24h)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trafficFlowData}>
              <defs>
                <linearGradient id="densGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(186 100% 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(186 100% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="density" stroke="hsl(186 100% 50%)" fill="url(#densGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Average Waiting Time (24h)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trafficFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="avgWait" stroke="hsl(152 100% 45%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Weekly Congestion Index">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="congestion" fill="hsl(186 100% 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Congestion Heatmap (Week x Hour)">
          <div className="h-full overflow-auto">
            <div className="grid gap-px" style={{ gridTemplateColumns: '40px repeat(24, 1fr)' }}>
              <div />
              {Array.from({ length: 24 }, (_, hour) => (
                <span key={hour} className="text-[8px] text-muted-foreground text-center font-mono-tech">{hour}</span>
              ))}
              {dayLabels.map((day, dayIndex) => (
                <div key={day} className="contents">
                  <span className="text-[10px] text-muted-foreground font-mono-tech flex items-center">{day}</span>
                  {Array.from({ length: 24 }, (_, hour) => {
                    const value = heatData.find((entry) => entry.day === dayIndex && entry.hour === hour)?.value ?? 0;
                    const opacity = Math.min(value / 100, 1);
                    return (
                      <div
                        key={`${dayIndex}-${hour}`}
                        className="aspect-square rounded-sm"
                        style={{ background: `hsl(186 100% 50% / ${opacity * 0.8})` }}
                        title={`${day} ${hour}:00 - ${value}%`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
