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

      <div style={{ marginTop: "20px" }}>
        <p><strong>Vehicles:</strong> {traffic.vehicleCount}</p>
        <p><strong>Density:</strong> {traffic.density}</p>
        <p><strong>Signal Time:</strong> {traffic.signalTiming}s</p>
      </div>
    </div>
  );
}