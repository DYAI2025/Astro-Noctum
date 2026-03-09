from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from astro_precision import compute_horoscope, ComputeOptions
import os

app = FastAPI(title="Cosmic Architecture Cloud Engine")

class BirthLocation(BaseModel):
    lat: float
    lon: float

class ComputeInput(BaseModel):
    birth_date: str # YYYY-MM-DD
    birth_time: str # HH:MM:SS
    birth_location: BirthLocation
    iana_time_zone: str
    house_system: Optional[str] = "P"
    strict_mode: Optional[bool] = True

@app.get("/health")
def health_check():
    return {"status": "ok", "engine": "Cosmic v3.5"}

@app.post("/compute")
async def compute(input_data: ComputeInput):
    try:
        # Map pydantic to dict for the engine
        data = input_data.dict()
        
        # Configure options
        options = ComputeOptions(
            strict_mode=data.get("strict_mode", True),
            house_system=data.get("house_system", "P")
        )
        
        # Run precision calculation
        result = compute_horoscope(data, options=options)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
