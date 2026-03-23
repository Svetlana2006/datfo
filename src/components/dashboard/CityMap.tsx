import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { intersections } from '@/data/mockData';

const GRID_SIZE = 6;
const CELL = 80;

interface Vehicle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface Intersection {
  id: string;
  name: string;
  vehicle_count: number;
  density: number;
  signal: 'red' | 'yellow' | 'green';
  waiting_time: number;
}

export default function CityMap({ 
  highlightRoute, 
  liveIntersections 
}: { 
  highlightRoute?: string[];
  liveIntersections?: Intersection[];
}) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const displayIntersections = liveIntersections || intersections;

  useEffect(() => {
    const initial: Vehicle[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * (GRID_SIZE * CELL),
      y: Math.random() * (GRID_SIZE * CELL),
      dx: (Math.random() - 0.5) * 2,
      dy: (Math.random() - 0.5) * 2,
    }));
    setVehicles(initial);

    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          const nx = v.x + v.dx;
          const ny = v.y + v.dy;
          let ndx = v.dx;
          let ndy = v.dy;
          if (nx < 0 || nx > GRID_SIZE * CELL) ndx = -ndx;
          if (ny < 0 || ny > GRID_SIZE * CELL) ndy = -ndy;
          return { ...v, x: nx, y: ny, dx: ndx, dy: ndy };
        })
      );
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const gridIntersections = (displayIntersections || []).slice(0, GRID_SIZE * 2).map((int, i) => ({
    ...int,
    gx: (i % GRID_SIZE) * CELL + CELL / 2 + 20,
    gy: Math.floor(i / GRID_SIZE) * CELL * 2 + CELL + 20,
  }));

  const signalColor = (s: string) =>
    s === 'red' ? '#ef4444' : s === 'yellow' ? '#eab308' : '#22c55e';

  const isHighlighted = (id: string) => highlightRoute?.includes(id);

  return (
    <div className="glass-card p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">City Grid — Live</span>
        <span className="text-xs font-mono-tech text-primary animate-pulse-glow">● REAL-TIME</span>
      </div>
      <div className="relative bg-background/50 rounded-lg border border-border overflow-hidden" style={{ height: GRID_SIZE * CELL + 40 }}>
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full" style={{ height: GRID_SIZE * CELL + 40 }}>
          {/* Horizontal roads */}
          {[1, 2, 3].map((i) => (
            <rect key={`h${i}`} x={0} y={i * CELL - 4} width="100%" height={8} fill="hsl(222 30% 14%)" rx={2} />
          ))}
          {/* Vertical roads */}
          {Array.from({ length: GRID_SIZE }, (_, i) => (
            <rect key={`v${i}`} x={i * CELL + CELL / 2 + 16} y={0} width={8} height="100%" fill="hsl(222 30% 14%)" rx={2} />
          ))}
        </svg>

        {/* Intersections */}
        {gridIntersections.map((int) => (
          <motion.div
            key={int.id}
            className={`absolute flex items-center justify-center ${isHighlighted(int.id) ? 'z-10' : ''}`}
            style={{ left: int.gx - 8, top: int.gy - 8 }}
            animate={isHighlighted(int.id) ? { scale: [1, 1.3, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <div
              className="h-4 w-4 rounded-full border-2 border-background"
              style={{
                backgroundColor: signalColor(int.signal),
                boxShadow: `0 0 ${isHighlighted(int.id) ? '12px' : '6px'} ${signalColor(int.signal)}`,
              }}
            />
          </motion.div>
        ))}

        {/* Vehicles */}
        <AnimatePresence>
          {vehicles.map((v) => (
            <motion.div
              key={v.id}
              className="absolute h-2 w-3 bg-neon-blue/70 rounded-sm"
              style={{ left: v.x + 20, top: v.y + 20 }}
              animate={{ left: v.x + 20, top: v.y + 20 }}
              transition={{ duration: 0.05 }}
            />
          ))}
        </AnimatePresence>

        {/* Route highlight */}
        {highlightRoute && highlightRoute.length > 1 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {gridIntersections
              .filter((i) => highlightRoute.includes(i.id))
              .map((int, idx, arr) => {
                if (idx === arr.length - 1) return null;
                const next = arr[idx + 1];
                return (
                  <motion.line
                    key={`route-${idx}`}
                    x1={int.gx}
                    y1={int.gy}
                    x2={next.gx}
                    y2={next.gy}
                    stroke="hsl(186 100% 50%)"
                    strokeWidth={3}
                    strokeDasharray="8 4"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: idx * 0.3 }}
                  />
                );
              })}
          </svg>
        )}
      </div>
    </div>
  );
}
