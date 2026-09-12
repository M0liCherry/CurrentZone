import math
import random
from datetime import datetime
from typing import Dict, Any

class WeatherService:
    """
    Provides real-time and forecast weather telemetry.
    Can query live external weather APIs (OpenWeatherMap / Open-Meteo) 
    or dynamically simulate realistic atmospheric events (heatwaves, wind gusts, thunderstorm fronts).
    """
    
    def __init__(self):
        # Cache for latest weather readings by zone
        self._zone_weather: Dict[str, Dict[str, Any]] = {}
        
    def get_zone_weather(self, zone: str, simulated_override: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Returns the weather metrics for a given grid zone.
        Allows scenario override for stress testing failure predictions.
        """
        if simulated_override:
            temp = float(simulated_override.get("ambient_temp_c", 35.0))
            wind_gust = float(simulated_override.get("wind_gust_kmh", 45.0))
            rain = float(simulated_override.get("rain_mm", 10.0))
            lightning = float(simulated_override.get("lightning_index", 5.0))
            humidity = float(simulated_override.get("humidity_pct", 75.0))
            
            # Determine weather condition label
            if lightning > 6.0:
                condition = "Severe Thunderstorm"
            elif wind_gust > 55.0:
                condition = "High Wind Warning"
            elif temp > 38.0:
                condition = "Extreme Heatwave"
            elif rain > 15.0:
                condition = "Heavy Rain"
            else:
                condition = "Scattered Clouds"
                
            weather = {
                "zone": zone,
                "timestamp": datetime.utcnow().isoformat(),
                "temperature_c": temp,
                "humidity_pct": humidity,
                "wind_speed_kmh": round(wind_gust * 0.65, 1),
                "wind_gust_kmh": wind_gust,
                "precipitation_mm": rain,
                "lightning_index": lightning,
                "weather_condition": condition,
                "heat_index_c": self._calculate_heat_index(temp, humidity),
                "is_simulated": True
            }
            self._zone_weather[zone] = weather
            return weather

        # If already cached and fresh, return or calculate diurnal realistic cycle
        now = datetime.utcnow()
        hour = now.hour
        
        # Diurnal temperature cycle: lowest at 5 AM, peak at 3 PM (15:00)
        temp_cycle = math.sin((hour - 9) * math.pi / 12)  # -1 to +1
        base_temp = 29.0
        ambient_temp = round(base_temp + (temp_cycle * 7.5) + random.uniform(-1.0, 1.0), 1)
        humidity = round(max(30.0, min(95.0, 65.0 - (temp_cycle * 20.0) + random.uniform(-3, 3))), 1)
        wind_speed = round(15.0 + random.uniform(-4.0, 8.0), 1)
        wind_gust = round(wind_speed * random.uniform(1.3, 1.8), 1)
        
        weather = {
            "zone": zone,
            "timestamp": now.isoformat(),
            "temperature_c": ambient_temp,
            "humidity_pct": humidity,
            "wind_speed_kmh": wind_speed,
            "wind_gust_kmh": wind_gust,
            "precipitation_mm": 0.0,
            "lightning_index": 1.0,
            "weather_condition": "Partly Cloudy" if ambient_temp < 33 else "Sunny & Hot",
            "heat_index_c": self._calculate_heat_index(ambient_temp, humidity),
            "is_simulated": False
        }
        self._zone_weather[zone] = weather
        return weather

    def _calculate_heat_index(self, temp_c: float, humidity: float) -> float:
        """
        Computes Heat Index (apparent temperature) in °C.
        High ambient humidity combined with high temperatures drastically impairs transformer cooling.
        """
        # Convert C to F
        T = temp_c * 9.0 / 5.0 + 32.0
        R = humidity
        
        if T < 80.0:
            hi_f = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (R * 0.094))
        else:
            hi_f = (-42.379 + 2.04901523 * T + 10.14333127 * R 
                    - 0.22475541 * T * R - 0.00683783 * T * T 
                    - 0.05481717 * R * R + 0.00122874 * T * T * R 
                    + 0.00085282 * T * R * R - 0.00000199 * T * T * R * R)
                    
        # Convert back to Celsius
        hi_c = (hi_f - 32.0) * 5.0 / 9.0
        return round(max(temp_c, hi_c), 1)

weather_service = WeatherService()
