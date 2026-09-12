from typing import Optional, List
from pydantic import BaseModel, Field

class OutageRiskOverview(BaseModel):
    zone: str
    transformer_id: Optional[str] = None
    transformer_name: Optional[str] = None
    failure_probability_pct: float
    risk_level: str  # "LOW", "MODERATE", "HIGH", "CRITICAL"
    estimated_ttf_minutes: Optional[int] = None
    current_load_pct: float
    top_oil_temp_c: float
    ambient_temp_c: float
    wind_gust_kmh: float
    weather_condition: str
    thermal_stress_score: float
    weather_stress_score: float
    demand_surge_score: float
    primary_factors: List[str]
    recommended_action: str

class ScenarioSimulationRequest(BaseModel):
    zone: str = Field(default="Residential South")
    transformer_id: Optional[str] = Field(default="TX-RES-01")
    current_rms: Optional[float] = Field(default=95.0, description="Injected SCT-013 current in Amperes")
    ambient_temp_c: float = Field(default=41.0, description="Simulated ambient heatwave temperature")
    wind_gust_kmh: float = Field(default=68.0, description="Simulated severe storm gust speed")
    rain_mm: float = Field(default=15.0, description="Simulated precipitation")
    lightning_index: float = Field(default=7.5, description="Simulated lightning activity index (0-10)")

class SimulationResult(BaseModel):
    zone: str
    transformer_id: Optional[str]
    failure_probability_pct: float
    risk_level: str
    estimated_ttf_minutes: Optional[int]
    simulated_load_pct: float
    simulated_oil_temp_c: float
    primary_factors: List[str]
    mitigation_actions: List[str]
