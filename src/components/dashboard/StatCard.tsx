import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: 'cyan' | 'green' | 'yellow' | 'red';
}

const variantStyles = {
  cyan: 'text-neon-cyan border-neon-cyan/20 neon-glow-cyan',
  green: 'text-neon-green border-neon-green/20 neon-glow-green',
  yellow: 'text-neon-yellow border-neon-yellow/20',
  red: 'text-neon-red border-neon-red/20',
};

export default function StatCard({ title, value, icon: Icon, trend, variant = 'cyan' }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono-tech">{title}</span>
        <div className={`p-2 rounded-md bg-card border ${variantStyles[variant]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className={`text-2xl font-bold font-mono-tech ${variant === 'cyan' ? 'neon-text-cyan' : variant === 'green' ? 'neon-text-green' : `text-neon-${variant}`}`}>
          {value}
        </span>
        {trend && <span className="text-xs text-muted-foreground">{trend}</span>}
      </div>
    </motion.div>
  );
}
