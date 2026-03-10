import { motion } from 'framer-motion';

interface DensityBarProps {
  density: 'low' | 'medium' | 'high';
  showLabel?: boolean;
}

const densityConfig = {
  low: { width: '30%', color: 'bg-traffic-green', label: 'Low' },
  medium: { width: '60%', color: 'bg-traffic-yellow', label: 'Medium' },
  high: { width: '90%', color: 'bg-traffic-red', label: 'High' },
};

export default function DensityBar({ density, showLabel = true }: DensityBarProps) {
  const config = densityConfig[density];
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: config.width }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${config.color}`}
        />
      </div>
      {showLabel && <span className="text-xs text-muted-foreground font-mono-tech w-14">{config.label}</span>}
    </div>
  );
}
