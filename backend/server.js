const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = 5000;

function generateTrafficData() {
  const vehicleCount = Math.floor(Math.random() * 100);

  let density;
  let signalTiming;

  if (vehicleCount < 30) {
    density = "LOW";
    signalTiming = 20;
  } else if (vehicleCount < 70) {
    density = "MEDIUM";
    signalTiming = 40;
  } else {
    density = "HIGH";
    signalTiming = 60;
  }

  return {
    vehicleCount,
    density,
    signalTiming,
  };
}

app.get("/traffic", (req, res) => {
  res.json(generateTrafficData());
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});