import { useEffect, useState } from 'react';
import type { Intersection } from '@/lib/api';

const trafficUrl = `${import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '/api'}/traffic`;

export function useIntersections() {
  const [data, setData] = useState<Intersection[]>([]);

  useEffect(() => {
    const fetchTraffic = async () => {
      try {
        const response = await fetch(trafficUrl);
        const json = await response.json();
        if (json.intersections) setData(json.intersections);
      } catch (error) {
        console.error('Error fetching traffic data from backend:', error);
      }
    };

    fetchTraffic();
    const interval = setInterval(fetchTraffic, 2_000);
    return () => clearInterval(interval);
  }, []);

  return data;
}
