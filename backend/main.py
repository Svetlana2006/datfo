import asyncio
from fastapi import FastAPI, BackgroundTasks # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from typing import List, Dict, Any, TypedDict
import random

app = FastAPI(title="Traffic Control API", description="Central API Server for Traffic Management")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class IntersectionStateDict(TypedDict):
    id: str
    name: str
    lat: float
    lng: float
    vehicleCount: int
    density: str
    signal: str
    signalTiming: int
    waitingTime: int

# Feature 8: Signal Controller Logic - State representation
intersection_state: List[IntersectionStateDict] = [
    { "id": "INT-001", "name": "ITO Intersection", "lat": 28.6304, "lng": 77.2406, "vehicleCount": 58, "density": "high", "signal": "red", "signalTiming": 45, "waitingTime": 65 },
    { "id": "INT-002", "name": "Connaught Place Circle", "lat": 28.6315, "lng": 77.2167, "vehicleCount": 42, "density": "high", "signal": "yellow", "signalTiming": 40, "waitingTime": 48 },
    { "id": "INT-003", "name": "Chandni Chowk", "lat": 28.6506, "lng": 77.2334, "vehicleCount": 35, "density": "medium", "signal": "green", "signalTiming": 30, "waitingTime": 22 },
    { "id": "INT-004", "name": "Karol Bagh Crossing", "lat": 28.6519, "lng": 77.1907, "vehicleCount": 50, "density": "high", "signal": "red", "signalTiming": 50, "waitingTime": 55 },
    { "id": "INT-005", "name": "Nehru Place Flyover", "lat": 28.5491, "lng": 77.2533, "vehicleCount": 18, "density": "low", "signal": "green", "signalTiming": 25, "waitingTime": 8 },
    { "id": "INT-006", "name": "Rajiv Chowk", "lat": 28.6328, "lng": 77.2197, "vehicleCount": 62, "density": "high", "signal": "red", "signalTiming": 55, "waitingTime": 72 },
    { "id": "INT-007", "name": "Moolchand Flyover", "lat": 28.5685, "lng": 77.2395, "vehicleCount": 28, "density": "medium", "signal": "yellow", "signalTiming": 32, "waitingTime": 25 },
    { "id": "INT-008", "name": "Sarai Kale Khan", "lat": 28.5893, "lng": 77.2568, "vehicleCount": 14, "density": "low", "signal": "green", "signalTiming": 20, "waitingTime": 6 },
    { "id": "INT-009", "name": "Dhaula Kuan", "lat": 28.5921, "lng": 77.1663, "vehicleCount": 46, "density": "high", "signal": "red", "signalTiming": 42, "waitingTime": 52 },
    { "id": "INT-010", "name": "Ashram Chowk", "lat": 28.5700, "lng": 77.2500, "vehicleCount": 22, "density": "medium", "signal": "green", "signalTiming": 28, "waitingTime": 15 },
    { "id": "INT-011", "name": "AIIMS Flyover", "lat": 28.5672, "lng": 77.2100, "vehicleCount": 33, "density": "medium", "signal": "yellow", "signalTiming": 30, "waitingTime": 28 },
    { "id": "INT-012", "name": "Kashmere Gate ISBT", "lat": 28.6676, "lng": 77.2285, "vehicleCount": 55, "density": "high", "signal": "red", "signalTiming": 48, "waitingTime": 60 },
]

def update_signals() -> None:
    """ Feature 8 background task simulating traffic state """
    for idx, int_data in enumerate(intersection_state):
        # Simulate traffic density changing
        new_count = int(int_data["vehicleCount"]) + random.randint(-5, 5)
        new_count = max(0, new_count)
        intersection_state[idx]["vehicleCount"] = new_count
        
        if new_count > 50:
            intersection_state[idx]["density"] = "high"
        elif new_count > 20:
            intersection_state[idx]["density"] = "medium"
        else:
            intersection_state[idx]["density"] = "low"

        # Signal logic: RED -> GREEN -> YELLOW -> RED
        new_timing = int(int_data["signalTiming"]) - 1
        intersection_state[idx]["signalTiming"] = new_timing
        
        if new_timing <= 0:
            if int_data["signal"] == "red":
                intersection_state[idx]["signal"] = "green"
                intersection_state[idx]["signalTiming"] = random.randint(30, 60)
            elif int_data["signal"] == "green":
                intersection_state[idx]["signal"] = "yellow"
                intersection_state[idx]["signalTiming"] = 5
            elif int_data["signal"] == "yellow":
                intersection_state[idx]["signal"] = "red"
                intersection_state[idx]["signalTiming"] = random.randint(30, 60)

async def signal_controller_loop() -> None:
    while True:
        update_signals()
        await asyncio.sleep(1)

@app.on_event("startup")
async def startup_event() -> None:
    asyncio.create_task(signal_controller_loop())

@app.get("/")
def read_root() -> Dict[str, str]:
    return {"status": "ok", "message": "Traffic API Server is running."}

@app.get("/traffic")
def get_traffic_data() -> Dict[str, List[IntersectionStateDict]]:
    """ Feature 1: Traffic Data API """
    return {"intersections": intersection_state}

@app.post("/optimize-signal")
def optimize_signal(intersection_id: str) -> Dict[str, Any]:
    """ Feature 3: high traffic -> longer green """
    if intersection_id:
        for i in intersection_state:
            if i["id"] == intersection_id:
                i["signalTiming"] = int(i["signalTiming"]) + 15
                return {"message": "Signal timing extended", "intersection": i}
    return {"message": "No intersection provided"}

@app.get("/emergency")
def check_emergency() -> Dict[str, Any]:
    """ Feature 4: Emergency Vehicle Detection """
    is_emergency = random.choice([True, False, False, False])
    return {
        "emergency": is_emergency,
        "type": "ambulance" if is_emergency else None
    }

@app.post("/green-corridor")
def trigger_green_corridor(intersection_id: str) -> Dict[str, Any]:
    """ Feature 5: Override signals to GREEN """
    for i in intersection_state:
        if i["id"] == intersection_id:
            i["signal"] = "green"
            i["signalTiming"] = 60
            return {"message": "Green corridor activated.", "intersection": i}
    return {"message": "Intersection not found"}

@app.get("/ai-decision")
def get_ai_decision() -> Dict[str, Any]:
    """ Feature 10 """
    return {
        "reason": "High traffic density detected.",
        "confidence": random.randint(85, 99)
    }

if __name__ == "__main__":
    import uvicorn # type: ignore
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
