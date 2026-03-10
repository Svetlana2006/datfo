import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import LiveTraffic from "./pages/LiveTraffic";
import SignalControl from "./pages/SignalControl";
import EmergencyCorridor from "./pages/EmergencyCorridor";
import EmergencyTracking from "./pages/EmergencyTracking";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/datfo">
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/live-traffic" element={<LiveTraffic />} />
            <Route path="/signal-control" element={<SignalControl />} />
            <Route path="/emergency-corridor" element={<EmergencyCorridor />} />
            <Route path="/emergency-tracking" element={<EmergencyTracking />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DashboardLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
