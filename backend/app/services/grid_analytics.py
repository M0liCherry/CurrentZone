from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import calendar
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.grid import TelemetryReading
from app.models.user import Device, BillRecord

class GridAnalyticsService:
    """
    Computes consumption statistics, device breakdowns, billing estimations,
    and historical trends dynamically from real ESP32 & smart plug telemetry.
    """
    
    @classmethod
    def _calculate_readings_kwh(cls, readings: List[TelemetryReading]) -> float:
        """
        Calculates true cumulative consumed energy from readings.
        Handles ESP32 reboots and counter resets, plus integrates power over time.
        """
        if not readings:
            return 0.0

        readings_sorted = sorted(readings, key=lambda r: r.timestamp or datetime.min)
        
        counter_delta = 0.0
        prev_e = None
        has_counter = False

        for r in readings_sorted:
            curr_e = r.energy_kwh_total or 0.0
            if prev_e is not None:
                if curr_e >= prev_e:
                    counter_delta += (curr_e - prev_e)
                else:
                    # Sensor counter reset / reboot
                    counter_delta += curr_e
                has_counter = True
            prev_e = curr_e

        if has_counter and counter_delta > 0.001:
            return round(counter_delta, 2)

        # Fallback to power integration: E = sum(P_avg * dt)
        integrated_kwh = 0.0
        for i in range(1, len(readings_sorted)):
            dt_s = (readings_sorted[i].timestamp - readings_sorted[i-1].timestamp).total_seconds()
            if 0 < dt_s <= 300:
                avg_kw = (readings_sorted[i].power_kw + readings_sorted[i-1].power_kw) / 2.0
                integrated_kwh += avg_kw * (dt_s / 3600.0)
        
        if integrated_kwh > 0.001:
            return round(integrated_kwh, 2)
            
        avg_kw = sum(r.power_kw for r in readings) / len(readings)
        return round(avg_kw * max(0.01, len(readings) * (3.0 / 3600.0)), 2)

    @classmethod
    def get_daily_consumption(cls, db: Optional[Session] = None) -> Dict[str, Any]:
        """
        Computes today's consumption breakdown into 6 4-hour slots:
        12AM (00-04), 4AM (04-08), 8AM (08-12), 12PM (12-16), 4PM (16-20), 8PM (20-24).
        """
        slot_defs = [
            ("12AM", 0, 4),
            ("4AM", 4, 8),
            ("8AM", 8, 12),
            ("12PM", 12, 16),
            ("4PM", 16, 20),
            ("8PM", 20, 24),
        ]
        
        if not db:
            return {
                "title": "Daily Consumption",
                "subtitle": "Today",
                "slots": [{"time_label": label, "kwh": 0.0} for label, _, _ in slot_defs],
                "average_daily_kwh": 0.0,
                "average_change_pct": 0.0,
                "compared_to_yesterday_kwh": 0.0,
                "compared_to_yesterday_pct": 0.0
            }
            
        now = datetime.utcnow()
        today_start = datetime(now.year, now.month, now.day)
        yesterday_start = today_start - timedelta(days=1)
        
        # Query today's readings
        today_readings = db.query(TelemetryReading).filter(
            TelemetryReading.timestamp >= today_start
        ).all()
        
        # Calculate kWh per 4-hour slot
        slots = []
        for label, start_h, end_h in slot_defs:
            slot_readings = [
                r for r in today_readings 
                if start_h <= r.timestamp.hour < end_h
            ]
            slot_kwh = cls._calculate_readings_kwh(slot_readings) if slot_readings else 0.0
            slots.append({"time_label": label, "kwh": slot_kwh})
            
        total_today_kwh = round(sum(s["kwh"] for s in slots), 2)
        
        # Query yesterday's readings
        yesterday_readings = db.query(TelemetryReading).filter(
            TelemetryReading.timestamp >= yesterday_start,
            TelemetryReading.timestamp < today_start
        ).all()
        
        if yesterday_readings:
            avg_yesterday_kw = sum(r.power_kw for r in yesterday_readings) / len(yesterday_readings)
            total_yesterday_kwh = round(avg_yesterday_kw * 24.0, 2)
            diff_kwh = round(total_today_kwh - total_yesterday_kwh, 2)
            diff_pct = round((diff_kwh / total_yesterday_kwh) * 100.0, 1) if total_yesterday_kwh > 0 else 0.0
        else:
            diff_kwh = total_today_kwh
            diff_pct = 0.0
            
        return {
            "title": "Daily Consumption",
            "subtitle": "Today",
            "slots": slots,
            "average_daily_kwh": total_today_kwh,
            "average_change_pct": diff_pct,
            "compared_to_yesterday_kwh": diff_kwh,
            "compared_to_yesterday_pct": diff_pct
        }

    @classmethod
    def get_weekly_consumption(cls, db: Optional[Session] = None) -> Dict[str, Any]:
        """
        Computes weekly consumption for Monday through Sunday.
        """
        day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        if not db:
            return {
                "title": "Weekly Consumption",
                "subtitle": "This Week",
                "days": [{"day": d, "kwh": 0.0} for d in day_names],
                "total_week_kwh": 0.0
            }
            
        now = datetime.utcnow()
        week_start = datetime(now.year, now.month, now.day) - timedelta(days=now.weekday())
        
        days = []
        for i, day_name in enumerate(day_names):
            d_start = week_start + timedelta(days=i)
            d_end = d_start + timedelta(days=1)
            
            readings = db.query(TelemetryReading).filter(
                TelemetryReading.timestamp >= d_start,
                TelemetryReading.timestamp < d_end
            ).all()
            
            kwh = cls._calculate_readings_kwh(readings) if readings else 0.0
            days.append({"day": day_name, "kwh": kwh})
            
        total = round(sum(d["kwh"] for d in days), 2)
        return {
            "title": "Weekly Consumption",
            "subtitle": "This Week",
            "days": days,
            "total_week_kwh": total
        }

    @classmethod
    def get_monthly_consumption(cls, db: Optional[Session] = None) -> Dict[str, Any]:
        """
        Computes monthly consumption for the past 12 months.
        """
        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        if not db:
            return {
                "title": "Monthly Consumption",
                "subtitle": "Last 12 Months",
                "months": [{"month": m, "kwh": 0.0} for m in month_names],
                "total_year_kwh": 0.0
            }
            
        now = datetime.utcnow()
        months = []
        for m_idx, m_name in enumerate(month_names, start=1):
            if m_idx > now.month:
                months.append({"month": m_name, "kwh": 0.0})
                continue
                
            m_start = datetime(now.year, m_idx, 1)
            if m_idx == 12:
                m_end = datetime(now.year + 1, 1, 1)
            else:
                m_end = datetime(now.year, m_idx + 1, 1)
                
            readings = db.query(TelemetryReading).filter(
                TelemetryReading.timestamp >= m_start,
                TelemetryReading.timestamp < m_end
            ).all()
            
            if readings:
                max_e = max(r.energy_kwh_total for r in readings)
                min_e = min(r.energy_kwh_total for r in readings)
                kwh = round(max_e - min_e, 1) if max_e > min_e else round(sum(r.power_kw for r in readings) * 0.05, 1)
            else:
                kwh = 0.0
                
            months.append({"month": m_name, "kwh": kwh})
            
        total = round(sum(m["kwh"] for m in months), 1)
        return {
            "title": "Monthly Consumption",
            "subtitle": "Last 12 Months",
            "months": months,
            "total_year_kwh": total
        }

    @classmethod
    def get_bedroom_insights(cls, db: Optional[Session] = None) -> Dict[str, Any]:
        """
        Computes energy consumption by connected plug/device.
        """
        if not db:
            return {
                "title": "Appliance Energy Consumption Overview",
                "total_kwh": 0.0,
                "total_change_pct": 0.0,
                "peak_kwh": 0.0,
                "peak_change_pct": 0.0,
                "plug_breakdown": [],
                "rating": 5.0,
                "reviews_count": 0,
                "star_distribution": {"5": 0.0, "4": 0.0, "3": 0.0, "2": 0.0, "1": 0.0}
            }
            
        devices = db.query(Device).filter(Device.user_id == 1).all()
        if not devices:
            return {
                "title": "Appliance Energy Consumption Overview",
                "total_kwh": 0.0,
                "total_change_pct": 0.0,
                "peak_kwh": 0.0,
                "peak_change_pct": 0.0,
                "plug_breakdown": [],
                "rating": 5.0,
                "reviews_count": 0,
                "star_distribution": {"5": 0.0, "4": 0.0, "3": 0.0, "2": 0.0, "1": 0.0}
            }
            
        total_kwh = sum(d.daily_kwh for d in devices)
        peak_kwh = max((d.daily_kwh for d in devices), default=0.0)
        
        breakdown = []
        for d in devices:
            pct = round((d.daily_kwh / total_kwh) * 100.0, 1) if total_kwh > 0 else 0.0
            breakdown.append({
                "name": d.name,
                "kwh": round(d.daily_kwh, 1),
                "percentage": pct,
                "is_peak": (d.daily_kwh == peak_kwh and peak_kwh > 0)
            })
            
        return {
            "title": "Appliance Energy Consumption Overview",
            "total_kwh": round(total_kwh, 1),
            "total_change_pct": 0.0,
            "peak_kwh": round(peak_kwh, 1),
            "peak_change_pct": 0.0,
            "plug_breakdown": breakdown,
            "rating": 5.0,
            "reviews_count": len(devices),
            "star_distribution": {"5": 100.0, "4": 0.0, "3": 0.0, "2": 0.0, "1": 0.0} if devices else {"5": 0.0, "4": 0.0, "3": 0.0, "2": 0.0, "1": 0.0}
        }

    @classmethod
    def get_energy_recommendations(cls, db: Optional[Session] = None) -> Dict[str, Any]:
        """
        Generates dynamic energy-saving recommendations based on real telemetry,
        power factor, active current, tariff rates, and paired devices.
        No dummy/hardcoded appliances.
        """
        if not db:
            return {
                "total_potential_savings_usd": 0.0,
                "summary": "Connect ESP32 telemetry or smart devices to generate data-driven recommendations.",
                "tips": []
            }

        latest = db.query(TelemetryReading).order_by(TelemetryReading.timestamp.desc()).first()
        latest_bill = db.query(BillRecord).filter(BillRecord.user_id == 1).order_by(BillRecord.created_at.desc()).first()
        rate = latest_bill.rate_per_kwh if latest_bill and latest_bill.rate_per_kwh else 0.15
        devices = db.query(Device).filter(Device.user_id == 1).all()

        tips = []
        total_savings = 0.0

        if latest:
            current_a = latest.current_rms
            voltage = latest.voltage_v or 230.0
            power_kw = latest.power_kw or 0.0
            apparent_kva = (voltage * current_a) / 1000.0
            pf = min(1.0, max(0.1, power_kw / apparent_kva)) if apparent_kva > 0.05 else 1.0

            # Power Factor Optimization
            if pf and pf < 0.90 and current_a > 0.5:
                est_loss_kwh = round(power_kw * (1.0 - pf) * 24 * 30, 1)
                est_loss_cost = round(est_loss_kwh * rate, 2)
                total_savings += est_loss_cost
                tips.append({
                    "title": "Power factor correction",
                    "save": f"≈ ${est_loss_cost:.2f}/mo" if est_loss_cost > 0 else "Efficiency Gain",
                    "impact": 78,
                    "desc": f"Measured power factor is currently {pf:.2f}. Reactive inductive load draws unnecessary apparent power from your feeder.",
                    "category": "power_factor"
                })

            # Peak Hours Load Shifting
            hour = datetime.utcnow().hour
            if current_a > 1.5:
                shift_savings = round(power_kw * 0.3 * 30 * rate, 2)
                total_savings += shift_savings
                tips.append({
                    "title": "Shift heavy loads to off-peak hours",
                    "save": f"≈ ${shift_savings:.2f}/mo",
                    "impact": 70,
                    "desc": f"Current load is {current_a:.1f}A ({power_kw:.2f} kW). Running high-demand appliances after 9 PM reduces peak tariff charges and feeder strain.",
                    "category": "peak_shaving"
                })

            # Baseline / Phantom Load
            if current_a > 0.8:
                phantom_kwh_month = round(current_a * 0.230 * 8 * 30, 1)
                phantom_cost = round(phantom_kwh_month * rate, 2)
                total_savings += phantom_cost
                tips.append({
                    "title": "Eliminate continuous baseline load",
                    "save": f"≈ ${phantom_cost:.2f}/mo",
                    "impact": 60,
                    "desc": f"Continuous background load of {current_a:.1f}A detected. Switch off idle devices and smart strip peripherals overnight.",
                    "category": "phantom_load"
                })

        # Connected Smart Devices (excluding grid sensors/monitors)
        for d in devices:
            if d.device_type in ["transformer_monitor", "grid_sensor", "sensor"]:
                continue
            if d.daily_kwh and d.daily_kwh > 1.0:
                dev_cost = round(d.daily_kwh * 30 * rate, 2)
                potential_dev_save = round(dev_cost * 0.15, 2)
                total_savings += potential_dev_save
                tips.append({
                    "title": f"Optimize {d.name} operating schedule",
                    "save": f"≈ ${potential_dev_save:.2f}/mo",
                    "impact": 65,
                    "desc": f"Monitored {d.name} uses {d.daily_kwh:.1f} kWh/day (~${dev_cost:.2f}/mo). Operating in eco or low-power cycles cuts ~15% consumption.",
                    "category": "device"
                })

        if not tips:
            if latest and latest.current_rms <= 0.05:
                tips.append({
                    "title": "Branch load is nominal and idle",
                    "save": "Nominal",
                    "impact": 95,
                    "desc": "ESP32 SCT-013 is reading 0.00 A on TX-RES-01. No phantom leakage or overload detected on monitored circuit.",
                    "category": "status"
                })
            tips.append({
                "title": "Active telemetry monitoring",
                "save": "Optimal",
                "impact": 85,
                "desc": f"Tariff rate configured at ${rate:.3f}/kWh. Telemetry streams continuously from your physical hardware.",
                "category": "monitoring"
            })

        summary_text = f"Calculated from live ESP32 telemetry · Cut ~${total_savings:.2f}/mo" if total_savings > 0 else "Real-time tips derived from live ESP32 telemetry"

        return {
            "total_potential_savings_usd": round(total_savings, 2),
            "summary": summary_text,
            "tips": tips
        }

    @classmethod
    def get_billing_summary(cls, db: Optional[Session] = None) -> Dict[str, Any]:
        """
        Computes current bill estimate from actual recorded energy usage + latest uploaded
        bill tariff structure (rate per kWh, fixed charges, taxes) and run-rate projection.
        """
        now = datetime.utcnow()
        days_in_month = calendar.monthrange(now.year, now.month)[1]
        days_elapsed = max(1, now.day)
        days_remaining = max(0, days_in_month - days_elapsed)

        if not db:
            return {
                "current_bill": {
                    "estimated_bill_usd": 0.0,
                    "due_date": f"Due {datetime(now.year, now.month, 15).strftime('%b 15')}",
                    "projected_kwh": 0.0,
                    "kwh_so_far": 0.0,
                    "rate_per_kwh": 0.15,
                    "fixed_charges": 0.0,
                    "tax_amount": 0.0,
                    "tariff_source": "Standard Tariff ($0.15/kWh)",
                    "days_elapsed": days_elapsed,
                    "days_remaining": days_remaining
                },
                "past_bills": [],
                "estimated_savings_this_month_usd": 0.0,
                "promo_title": "Switch to Green Energy",
                "promo_description": "Save more with sustainable energy solutions."
            }
            
        # 1. Fetch latest verified BillRecord for tariff parameters
        latest_bill = db.query(BillRecord).filter(
            BillRecord.user_id == 1
        ).order_by(BillRecord.created_at.desc()).first()

        if latest_bill and latest_bill.rate_per_kwh and latest_bill.rate_per_kwh > 0:
            rate_per_kwh = latest_bill.rate_per_kwh
            fixed_charges = latest_bill.fixed_charges or 0.0
            tax_amount = latest_bill.tax_amount or 0.0
            tariff_source = f"Extracted from {latest_bill.month_label} Bill (${rate_per_kwh:.3f}/kWh)"
            baseline_past_amount = latest_bill.amount_usd or 0.0
            baseline_past_kwh = latest_bill.energy_kwh or 0.0
        else:
            rate_per_kwh = 0.15
            fixed_charges = 0.0
            tax_amount = 0.0
            tariff_source = "Standard Utility Tariff ($0.15/kWh)"
            baseline_past_amount = 0.0
            baseline_past_kwh = 0.0

        # 2. Query telemetry readings for current month
        month_start = datetime(now.year, now.month, 1)
        readings = db.query(TelemetryReading).filter(
            TelemetryReading.timestamp >= month_start
        ).all()
        
        kwh_so_far = cls._calculate_readings_kwh(readings)

        # 3. Forecast end-of-month projected consumption
        if kwh_so_far > 0.05:
            daily_run_rate = kwh_so_far / days_elapsed
            projected_remaining_kwh = daily_run_rate * days_remaining
            projected_total_kwh = round(kwh_so_far + projected_remaining_kwh, 1)
        elif baseline_past_kwh > 0:
            # Telemetry monitor newly initialized this month, blend with past baseline
            projected_total_kwh = round(baseline_past_kwh * 0.96, 1)
        else:
            projected_total_kwh = round(kwh_so_far, 1)

        # 4. Calculate projected bill cost
        projected_energy_cost = projected_total_kwh * rate_per_kwh
        est_tax = tax_amount if tax_amount > 0 else round(projected_energy_cost * 0.05, 2)
        estimated_bill = round(projected_energy_cost + fixed_charges + est_tax, 2)

        # 5. Compute estimated savings
        if baseline_past_amount > 0 and estimated_bill > 0:
            savings = round(max(0.0, baseline_past_amount - estimated_bill), 2)
        else:
            savings = 0.0

        # 6. Past bills list
        past_bills_records = db.query(BillRecord).filter(
            BillRecord.user_id == 1
        ).order_by(BillRecord.created_at.desc()).all()
        
        past_bills = [
            {
                "id": b.id,
                "month_year": b.month_label,
                "status": b.status,
                "amount_usd": b.amount_usd,
                "due_date": b.due_date,
                "energy_kwh": b.energy_kwh or 0.0,
                "rate_per_kwh": b.rate_per_kwh or 0.15,
                "fixed_charges": b.fixed_charges or 0.0,
                "image_path": b.image_path
            }
            for b in past_bills_records
        ]

        # Calculate due date: 15th of next month (or 15th of current if early)
        if now.day < 15:
            due_date_str = f"Due {datetime(now.year, now.month, 15).strftime('%b 15')}"
        else:
            next_m = 1 if now.month == 12 else now.month + 1
            next_y = now.year + 1 if now.month == 12 else now.year
            due_date_str = f"Due {datetime(next_y, next_m, 15).strftime('%b 15')}"
        
        return {
            "current_bill": {
                "estimated_bill_usd": estimated_bill,
                "due_date": due_date_str,
                "projected_kwh": projected_total_kwh,
                "kwh_so_far": round(kwh_so_far, 2),
                "rate_per_kwh": rate_per_kwh,
                "fixed_charges": fixed_charges,
                "tax_amount": est_tax,
                "tariff_source": tariff_source,
                "days_elapsed": days_elapsed,
                "days_remaining": days_remaining
            },
            "past_bills": past_bills,
            "estimated_savings_this_month_usd": savings,
            "promo_title": "Switch to Green Energy",
            "promo_description": "Save more with sustainable energy solutions."
        }

grid_analytics = GridAnalyticsService()
