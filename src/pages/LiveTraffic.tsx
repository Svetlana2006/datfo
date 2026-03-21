<<<<<<< HEAD
import { useEffect, useState } from "react";

export default function LiveTraffic() {
  const [traffic, setTraffic] = useState<any>(null);

  useEffect(() => {
  const interval = setInterval(() => {
    fetch("http://localhost:5000/traffic")
      .then((res) => res.json())
      .then((data) => setTraffic(data));
  }, 2000); // every 2 seconds

  return () => clearInterval(interval);
}, []);

  if (!traffic) {
    return <div style={{ color: "white", padding: "20px" }}>Loading traffic data...</div>;
  }

  return (
    <div style={{ color: "white", padding: "20px" }}>
      <h2>Live Traffic Monitoring — Delhi NCR</h2>
=======
import { useState, useEffect } from 'react';
import { intersections, trafficFlowData } from '@/data/mockData';
import TrafficLightIcon from '@/components/dashboard/TrafficLightIcon';
import DensityBar from '@/components/dashboard/DensityBar';
import { motion } from 'framer-motion';
import { MapPin, Car } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function getStaticMapUrl(lat: number, lng: number, zoom = 15) {
  // Using OpenStreetMap static tile via a tile server
  const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
  const y = Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

export default function LiveTraffic() {
  const [aiDecision, setAiDecision] = useState<{ reason: string; confidence: number } | null>(null);

  useEffect(() => {
    const fetchAiDecision = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/ai-decision');
        const data = await res.json();
        setAiDecision(data);
      } catch (err) {
        console.error('Failed to fetch AI decision:', err);
      }
    };

    fetchAiDecision();
    const interval = setInterval(fetchAiDecision, 10000); // Fetch every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-mono-tech neon-text-cyan">Live Traffic Monitoring — Delhi NCR</h2>
        {aiDecision && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 px-4 py-2 glass-card border-primary/30"
          >
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono-tech">AI Traffic Optimization</p>
              <p className="text-xs text-foreground font-medium max-w-[300px] truncate">{aiDecision.reason}</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-primary">{aiDecision.confidence}%</span>
              <span className="text-[10px] text-muted-foreground uppercase font-mono-tech">Confidence</span>
            </div>
          </motion.div>
        )}
      </div>
>>>>>>> 5553113 (Add backend server with SQLite storage and AI decision endpoint)

      <div style={{ marginTop: "20px" }}>
        <p><strong>Vehicles:</strong> {traffic.vehicleCount}</p>
        <p><strong>Density:</strong> {traffic.density}</p>
        <p><strong>Signal Time:</strong> {traffic.signalTiming}s</p>
      </div>
    </div>
  );
}