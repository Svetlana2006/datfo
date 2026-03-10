import { motion } from 'framer-motion';

interface TrafficLightIconProps {
  signal: 'red' | 'yellow' | 'green';
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 'h-3 w-3', md: 'h-4 w-4', lg: 'h-6 w-6' };

export default function TrafficLightIcon({ signal, size = 'md' }: TrafficLightIconProps) {
  const colors = {
    red: 'bg-traffic-red shadow-[0_0_8px_hsl(var(--traffic-red)/0.6)]',
    yellow: 'bg-traffic-yellow shadow-[0_0_8px_hsl(var(--traffic-yellow)/0.6)]',
    green: 'bg-traffic-green shadow-[0_0_8px_hsl(var(--traffic-green)/0.6)]',
  };

  return (
    <div className="flex items-center gap-1 bg-card/80 rounded-full px-2 py-1 border border-border">
      {(['red', 'yellow', 'green'] as const).map((c) => (
        <motion.div
          key={c}
          animate={signal === c ? { scale: [1, 1.2, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`${sizeMap[size]} rounded-full transition-all duration-300 ${
            signal === c ? colors[c] : 'bg-muted/50'
          }`}
        />
      ))}
    </div>
  );
}
