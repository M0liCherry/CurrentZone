import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Transformer(Base):
    __tablename__ = "transformers"
    
    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    zone = Column(String(64), nullable=False, index=True)  # e.g., "North Grid", "Downtown", "Suburban Sector 4"
    rated_kva = Column(Float, nullable=False, default=100.0)  # e.g. 100 kVA
    nominal_voltage = Column(Float, nullable=False, default=230.0)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    installation_year = Column(Integer, default=2018)
    health_score = Column(Float, default=95.0)  # 0 - 100
    current_top_oil_temp = Column(Float, default=45.0)  # °C
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    telemetry = relationship("TelemetryReading", back_populates="transformer")
    outage_history = relationship("HistoricalOutage", back_populates="transformer")

class TelemetryReading(Base):
    __tablename__ = "telemetry_readings"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    transformer_id = Column(String(64), ForeignKey("transformers.id"), nullable=True)
    device_id = Column(String(64), index=True, nullable=False)
    current_rms = Column(Float, nullable=False)  # Amperes RMS from SCT-013
    power_kw = Column(Float, nullable=False)  # Active power in kW
    voltage_v = Column(Float, default=230.0)
    frequency_hz = Column(Float, default=50.0)
    energy_kwh_total = Column(Float, default=0.0)
    peak_surge_a = Column(Float, default=0.0)
    sample_count = Column(Integer, default=500)
    load_pct = Column(Float, default=0.0)  # Calculated % of rated kVA
    
    transformer = relationship("Transformer", back_populates="telemetry")

class HistoricalOutage(Base):
    __tablename__ = "historical_outages"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    duration_minutes = Column(Integer, nullable=False)
    zone = Column(String(64), nullable=False, index=True)
    transformer_id = Column(String(64), ForeignKey("transformers.id"), nullable=True)
    root_cause = Column(String(128), nullable=False)  # "Thermal Overload", "Wind Gust / Feeder Snap", "Lightning Strike", "Insulation Breakdown"
    peak_temperature_c = Column(Float, nullable=False)
    wind_gust_kmh = Column(Float, nullable=False)
    load_pct_at_failure = Column(Float, nullable=False)
    customers_affected = Column(Integer, default=150)
    
    transformer = relationship("Transformer", back_populates="outage_history")

class WeatherRecord(Base):
    __tablename__ = "weather_records"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    zone = Column(String(64), nullable=False, index=True)
    temperature_c = Column(Float, nullable=False)
    humidity_pct = Column(Float, nullable=False)
    wind_speed_kmh = Column(Float, nullable=False)
    wind_gust_kmh = Column(Float, nullable=False)
    precipitation_mm = Column(Float, default=0.0)
    lightning_index = Column(Float, default=0.0)  # 0 to 10
    weather_condition = Column(String(64), default="Clear")

class OutagePredictionRecord(Base):
    __tablename__ = "outage_predictions"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    zone = Column(String(64), nullable=False, index=True)
    transformer_id = Column(String(64), nullable=True)
    failure_probability = Column(Float, nullable=False)  # 0.0 to 1.0 (0% to 100%)
    risk_level = Column(String(32), nullable=False)  # LOW, MODERATE, HIGH, CRITICAL
    estimated_ttf_minutes = Column(Integer, nullable=True)  # Estimated Time-to-Failure
    thermal_stress_score = Column(Float, default=0.0)
    weather_stress_score = Column(Float, default=0.0)
    demand_surge_score = Column(Float, default=0.0)
    primary_factors = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
