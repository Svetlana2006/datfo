import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Monitor,
  Settings2,
  Route,
  Truck,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Activity,
  Bell,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { title: 'Dashboard', path: '/', icon: LayoutDashboard },
  { title: 'Live Traffic', path: '/live-traffic', icon: Monitor },
  { title: 'Signal Control', path: '/signal-control', icon: Settings2 },
  { title: 'Emergency Corridor', path: '/emergency-corridor', icon: Route },
  { title: 'Green Corridor', path: '/green-corridor', icon: Activity },
  { title: 'Vehicle Tracking', path: '/emergency-tracking', icon: Truck },
  { title: 'Analytics', path: '/analytics', icon: BarChart3 },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col border-r border-border bg-card/50 backdrop-blur-md z-20"
      >
        <div className="flex items-center h-14 px-3 border-b border-border gap-2">
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-mono-tech text-xs font-bold text-primary tracking-wider">DATFO</span>
            </motion.div>
          )}
          {collapsed && <Zap className="h-5 w-5 text-primary mx-auto" />}
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 group ${
                  active
                    ? 'bg-primary/10 text-primary neon-glow-cyan'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <item.icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-primary' : ''}`} />
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="truncate">
                    {item.title}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-10 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-card/30 backdrop-blur-md flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-primary animate-pulse-glow" />
            <h1 className="font-mono-tech text-sm font-semibold tracking-wide text-foreground">
              Dynamic AI Traffic Flow Optimizer & Emergency Grid
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono-tech">
              <span className="inline-block h-2 w-2 rounded-full bg-neon-green animate-pulse" />
              SYSTEM ONLINE
            </div>
            <button className="relative p-2 rounded-md hover:bg-accent transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-neon-red" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6 grid-bg">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
