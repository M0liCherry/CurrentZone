import math
from typing import Dict, Any

class TransformerThermalModel:
    """
    Implements the IEEE C57.91 Thermal Model for Distribution Transformers.
    Estimates top-oil temperature, hottest-spot winding temperature, 
    loss-of-life acceleration factor (FAA), and thermal trip risk.
    """
    
    # Standard distribution transformer parameters
    DELTA_THETA_TO_R = 55.0  # Rated top-oil temp rise over ambient (°C)
    DELTA_THETA_H_R = 65.0   # Rated hot-spot temp rise over ambient (°C)
    R_RATIO = 4.0            # Ratio of load loss at rated current to no-load loss
    EXP_N = 0.8              # Oil thermal exponent
    EXP_M = 0.8              # Winding thermal exponent
    
    @classmethod
    def calculate_thermal_metrics(
        cls, 
        current_rms: float, 
        rated_current: float, 
        ambient_temp_c: float,
        overload_duration_minutes: float = 15.0
    ) -> Dict[str, Any]:
        """
        Calculates transformer internal thermal state given current reading from SCT-013.
        
        :param current_rms: Measured AC current from SCT-013 (Amperes)
        :param rated_current: Transformer rated full-load current (Amperes)
        :param ambient_temp_c: Ambient temperature in °C
        :param overload_duration_minutes: Duration current has remained elevated
        :return: Dict containing top_oil_temp, hot_spot_temp, thermal_stress_score, loss_of_life_factor
        """
        if rated_current <= 0:
            rated_current = 100.0  # Fallback default
            
        load_ratio_k = current_rms / rated_current
        load_pct = round(load_ratio_k * 100.0, 1)
        
        if current_rms <= 0.05:
            # Idle / zero load: transformer is at ambient temperature
            return {
                "load_pct": 0.0,
                "top_oil_temp_c": round(ambient_temp_c, 1),
                "hot_spot_temp_c": round(ambient_temp_c, 1),
                "thermal_stress_score": 0.0,
                "loss_of_life_factor": 1.0,
                "is_thermal_overload": False
            }
        
        # Steady-state top-oil temperature rise over ambient
        loss_ratio = (math.pow(load_ratio_k, 2) * cls.R_RATIO + 1.0) / (cls.R_RATIO + 1.0)
        delta_theta_to_steady = cls.DELTA_THETA_TO_R * math.pow(max(0.01, loss_ratio), cls.EXP_N)
        
        # Dynamic top-oil rise with thermal time constant tau_oil (~2.5 hours = 150 mins)
        tau_oil = 150.0
        alpha = 1.0 - math.exp(-max(1.0, overload_duration_minutes) / tau_oil)
        delta_theta_to = delta_theta_to_steady * alpha
        
        top_oil_temp = ambient_temp_c + delta_theta_to
        
        # Hot-spot temperature rise over top-oil
        delta_theta_h = (cls.DELTA_THETA_H_R - cls.DELTA_THETA_TO_R) * math.pow(load_ratio_k, 2.0 * cls.EXP_M)
        hot_spot_temp = top_oil_temp + delta_theta_h

        
        # Aging acceleration factor FAA (Arrhenius rate equation)
        # Reference temperature is 110 °C hot-spot
        ref_kelvin = 110.0 + 273.15
        hs_kelvin = hot_spot_temp + 273.15
        try:
            exponent = (15000.0 / ref_kelvin) - (15000.0 / hs_kelvin)
            faa = math.exp(min(20.0, max(-10.0, exponent)))
        except (OverflowError, ZeroDivisionError):
            faa = 1000.0
            
        # Thermal Stress Score (0 to 100)
        # 0 - 50: Normal operation (hot-spot < 95°C)
        # 50 - 75: Elevated stress (hot-spot 95°C - 115°C)
        # 75 - 90: Severe overload (hot-spot 115°C - 130°C)
        # 90 - 100: Critical / imminent insulation thermal breakdown (hot-spot > 130°C)
        if hot_spot_temp < 80.0:
            thermal_score = max(0.0, (hot_spot_temp / 80.0) * 35.0)
        elif hot_spot_temp < 105.0:
            thermal_score = 35.0 + ((hot_spot_temp - 80.0) / 25.0) * 30.0
        elif hot_spot_temp < 130.0:
            thermal_score = 65.0 + ((hot_spot_temp - 105.0) / 25.0) * 25.0
        else:
            thermal_score = min(100.0, 90.0 + ((hot_spot_temp - 130.0) / 20.0) * 10.0)
            
        return {
            "load_pct": load_pct,
            "top_oil_temp_c": round(top_oil_temp, 1),
            "hot_spot_temp_c": round(hot_spot_temp, 1),
            "thermal_stress_score": round(thermal_score, 1),
            "loss_of_life_factor": round(faa, 2),
            "is_thermal_overload": hot_spot_temp > 110.0
        }

thermal_model = TransformerThermalModel()
