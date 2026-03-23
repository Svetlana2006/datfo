import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Intersection } from '@/lib/api';

const GRID_SIZE = 6;
const CELL = 80;

interface Vehicle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export default function CityMap({
  highlightRoute,
  liveIntersections = [],
}: {
  highlightRoute?: string[];
  liveIntersections?: Intersection[];
}) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const displayIntersections = liveIntersections;

  useEffect(() => {
    const initialVehicles: Vehicle[] = Array.from({ length: 20 }, (_, index) => ({
      id: index,
      x: Math.random() * (GRID_SIZE * CELL),
      y: Math.random() * (GRID_SIZE * CELL),
      dx: (Math.random() - 0.5) * 2,
      dy: (Math.random() - 0.5) * 2,
    }));
    setVehicles(initialVehicles);

    const interval = setInterval(() => {
      setVehicles((current) =>
        current.map((vehicle) => {
          const nextX = vehicle.x + vehicle.dx;
          const nextY = vehicle.y + vehicle.dy;
          let nextDx = vehicle.dx;
          let nextDy = vehicle.dy;

          if (nextX < 0 || nextX > GRID_SIZE * CELL) nextDx = -nextDx;
          if (nextY < 0 || nextY > GRID_SIZE * CELL) nextDy = -nextDy;

          return { ...vehicle, x: nextX, y: nextY, dx: nextDx, dy: nextDy };
        }),
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const gridIntersections = displayIntersections.slice(0, GRID_SIZE * 2).map((intersection, index) => ({
    ...intersection,
    gx: (index % GRID_SIZE) * CELL + CELL / 2 + 20,
    gy: Math.floor(index / GRID_SIZE) * CELL * 2 + CELL + 20,
  }));

  const signalColor = (signal: string) =>
    signal === 'red' ? '#ef4444' : signal === 'yellow' ? '#eab308' : '#22c55e';

  const isHighlighted = (id: string) => highlightRoute?.includes(id);

  return (
    <div className="glass-card p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">City Grid - Live</span>
        <span className="text-xs font-mono-tech text-primary animate-pulse-glow">REAL-TIME</span>
      </div>
      <div className="relative bg-background/50 rounded-lg border border-border overflow-hidden" style={{ height: GRID_SIZE * CELL + 40 }}>
        <svg className="absolute inset-0 w-full h-full" style={{ height: GRID_SIZE * CELL + 40 }}>
          {[1, 2, 3].map((index) => (
            <rect key={`h${index}`} x={0} y={index * CELL - 4} width="100%" height={8} fill="hsl(222 30% 14%)" rx={2} />
          ))}
          {Array.from({ length: GRID_SIZE }, (_, index) => (
            <rect key={`v${index}`} x={index * CELL + CELL / 2 + 16} y={0} width={8} height="100%" fill="hsl(222 30% 14%)" rx={2} />
          ))}
        </svg>

        {gridIntersections.map((intersection) => (
          <motion.div
            key={intersection.id}
            className={`absolute flex items-center justify-center ${isHighlighted(intersection.id) ? 'z-10' : ''}`}
            style={{ left: intersection.gx - 8, top: intersection.gy - 8 }}
            animate={isHighlighted(intersection.id) ? { scale: [1, 1.3, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <div
              className="h-4 w-4 rounded-full border-2 border-background"
              style={{
                backgroundColor: signalColor(intersection.signal),
                boxShadow: `0 0 ${isHighlighted(intersection.id) ? '12px' : '6px'} ${signalColor(intersection.signal)}`,
              }}
            />
          </motion.div>
        ))}

        <AnimatePresence>
          {vehicles.map((vehicle) => (
            <motion.div
              key={vehicle.id}
              className="absolute h-2 w-3 bg-neon-blue/70 rounded-sm"
              style={{ left: vehicle.x + 20, top: vehicle.y + 20 }}
              animate={{ left: vehicle.x + 20, top: vehicle.y + 20 }}
              transition={{ duration: 0.05 }}
            />
          ))}
        </AnimatePresence>

        {highlightRoute && highlightRoute.length > 1 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {gridIntersections
              .filter((intersection) => highlightRoute.includes(intersection.id))
              .map((intersection, index, route) => {
                if (index === route.length - 1) return null;
                const next = route[index + 1];
                return (
                  <motion.line
                    key={`route-${index}`}
                    x1={intersection.gx}
                    y1={intersection.gy}
                    x2={next.gx}
                    y2={next.gy}
                    stroke="hsl(186 100% 50%)"
                    strokeWidth={3}
                    strokeDasharray="8 4"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: index * 0.3 }}
                  />
                );
              })}
          </svg>
        )}
      </div>
    </div>
  );
}
