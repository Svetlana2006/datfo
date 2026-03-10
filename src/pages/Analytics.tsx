import { trafficFlowData, weeklyData } from '@/data/mockData';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

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

// Generate heatmap-like data once outside the component to prevent jiggling on every render
const heatData = Array.from({ length: 7 }, (_, day) =>
  Array.from({ length: 24 }, (_, hour) => ({
    day,
    hour,
    value: Math.floor(Math.random() * 100 + (hour >= 7 && hour <= 9 ? 40 : hour >= 16 && hour <= 18 ? 35 : 0)),
  }))
).flat();

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Analytics() {

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

        <ChartCard title="Congestion Heatmap (Week × Hour)">
          <div className="h-full overflow-auto">
            <div className="grid gap-px" style={{ gridTemplateColumns: `40px repeat(24, 1fr)` }}>
              <div />
              {Array.from({ length: 24 }, (_, h) => (
                <span key={h} className="text-[8px] text-muted-foreground text-center font-mono-tech">{h}</span>
              ))}
              {dayLabels.map((day, di) => (
                <>
                  <span key={`l${di}`} className="text-[10px] text-muted-foreground font-mono-tech flex items-center">{day}</span>
                  {Array.from({ length: 24 }, (_, hi) => {
                    const val = heatData.find(d => d.day === di && d.hour === hi)?.value ?? 0;
                    const opacity = Math.min(val / 100, 1);
                    return (
                      <div
                        key={`${di}-${hi}`}
                        className="aspect-square rounded-sm"
                        style={{ background: `hsl(186 100% 50% / ${opacity * 0.8})` }}
                        title={`${day} ${hi}:00 — ${val}%`}
                      />
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
