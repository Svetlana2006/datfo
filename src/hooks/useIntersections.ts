import { useState, useEffect } from 'react';
import { Intersection } from '@/data/mockData';

export function useIntersections() {
  const [data, setData] = useState<Intersection[]>([]);

  useEffect(() => {
    const fetchTraffic = async () => {
      try {
        const res = await fetch('http://localhost:8000/traffic');
        const json = await res.json();
        if (json.intersections) setData(json.intersections);
      } catch (e) {
        console.error('Error fetching traffic data from backend:', e);
      }
    };

    fetchTraffic();
    const interval = setInterval(fetchTraffic, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, []);

  return data;
}
