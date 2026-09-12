import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartWatt Electricity Outage Predictor"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smartwatt.db")
    
    # Grid Defaults
    NOMINAL_VOLTAGE: float = 230.0  # Volts AC (RMS)
    GRID_FREQUENCY_HZ: float = 50.0  # Hz
    POWER_FACTOR_DEFAULT: float = 0.92
    
    # Robocraze SCT-013 100A Configuration
    SCT013_TURNS_RATIO: int = 2000  # 100A : 50mA (2000:1)
    SCT013_DEFAULT_BURDEN_OHMS: float = 22.0  # Standard burden resistor
    
    # Thermal & Outage Prediction Thresholds
    TRANSFORMER_MAX_TOP_OIL_TEMP_C: float = 105.0  # IEEE C57.91 limit
    NORMAL_LOAD_THRESHOLD_PCT: float = 80.0
    WARNING_LOAD_THRESHOLD_PCT: float = 100.0
    CRITICAL_LOAD_THRESHOLD_PCT: float = 120.0
    
    # Weather Integration
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")
    DEFAULT_CITY: str = "Metropolis"
    
    # Security / Auth
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "smartwatt-secret-super-key-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    model_config = {"case_sensitive": True}

settings = Settings()
