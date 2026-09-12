from typing import Dict, Any, List
from collections import deque
import numpy as np

class ConsumptionAnomalyDetector:
    """
    Analyzes live consumption patterns against historical diurnal baselines,
    detecting sudden surge spikes, uncharacteristic load anomalies, and peak congestion.
    """
    
    # 24-hour typical consumption profile factor (normalized 0.0 to 1.0)
    # Reflects morning wake-up surge (7-9 AM) and evening peak (6-10 PM)
    HOURLY_BASE_PROFILE = [
        0.35, 0.30, 0.28, 0.28, 0.32, 0.45,  # 00:00 - 05:00
        0.65, 0.80, 0.85, 0.75, 0.70, 0.72,  # 06:00 - 11:00
        0.75, 0.73, 0.70, 0.74, 0.82, 0.95,  # 12:00 - 17:00
        1.00, 0.98, 0.90, 0.78, 0.60, 0.45   # 18:00 - 23:00
    ]
    
    def __init__(self, history_len: int = 60):
        # Recent readings buffer per transformer/device: deque of (current_rms, timestamp)
        self._recent_readings: Dict[str, deque] = {}
        
    def analyze_consumption(
        self, 
        entity_id: str, 
        current_rms: float, 
        hour_of_day: int,
        rated_capacity_amps: float = 100.0
    ) -> Dict[str, Any]:
        """
        Evaluates consumption anomaly and surge rate.
        """
        if entity_id not in self._recent_readings:
            self._recent_readings[entity_id] = deque(maxlen=30)
            
        history = self._recent_readings[entity_id]
        history.append(current_rms)
        
        # 1. Surge Velocity Calculation (rate of change over recent samples)
        surge_velocity = 0.0
        if len(history) >= 2:
            prev = history[-2]
            surge_velocity = max(0.0, current_rms - prev)  # delta Amps
            
        # 2. Expected diurnal baseline current
        hour = min(23, max(0, hour_of_day))
        expected_ratio = self.HOURLY_BASE_PROFILE[hour]
        expected_current = expected_ratio * (rated_capacity_amps * 0.65)
        
        # 3. Deviation from baseline
        deviation_amps = current_rms - expected_current
        deviation_ratio = deviation_amps / max(10.0, expected_current)
        
        # 4. Demand Surge Score (0 to 100)
        # Higher score indicates dangerous sudden localized demand surges
        surge_score = 0.0
        if deviation_ratio > 0:
            surge_score += min(50.0, deviation_ratio * 40.0)
            
        if surge_velocity > 5.0:  # Sudden jump > 5 Amps in short period
            surge_score += min(50.0, (surge_velocity / 15.0) * 50.0)
            
        surge_score = round(min(100.0, max(0.0, surge_score)), 1)
        
        is_peak_hour = 18 <= hour <= 22
        
        return {
            "expected_current_amps": round(expected_current, 1),
            "measured_current_amps": round(current_rms, 1),
            "surge_velocity_amps": round(surge_velocity, 2),
            "demand_surge_score": surge_score,
            "is_peak_hour": is_peak_hour,
            "is_surge_anomaly": surge_score > 60.0
        }

anomaly_detector = ConsumptionAnomalyDetector()
