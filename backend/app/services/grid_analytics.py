from typing import Dict, Any, List
from datetime import datetime

class GridAnalyticsService:
    """
    Computes consumption statistics, device breakdowns, billing estimations, 
    and historical trends specifically aligning with the SmartWatt Figma UI.
    """
    
    @classmethod
    def get_daily_consumption(cls) -> Dict[str, Any]:
        """
        Matches 'Usage Monitoring.png' Daily Consumption screen:
        Slots: 12AM, 4AM, 8AM, 12PM, 4PM, 8PM
        Average Daily Use: 28 kWh, +20%
        Compared to Yesterday: +5 kWh
        """
        slots = [
            {"time_label": "12AM", "kwh": 3.2},
            {"time_label": "4AM", "kwh": 2.1},
            {"time_label": "8AM", "kwh": 4.8},
            {"time_label": "12PM", "kwh": 6.5},
            {"time_label": "4PM", "kwh": 5.9},
            {"time_label": "8PM", "kwh": 7.4},
        ]
        return {
            "title": "Daily Consumption",
            "subtitle": "Today",
            "slots": slots,
            "average_daily_kwh": 28.0,
            "average_change_pct": 20.0,
            "compared_to_yesterday_kwh": 5.0,
            "compared_to_yesterday_pct": 18.5
        }

    @classmethod
    def get_weekly_consumption(cls) -> Dict[str, Any]:
        """
        Matches 'Usage Monitoring.png' Weekly Consumption: Mon to Sun
        """
        days = [
            {"day": "Mon", "kwh": 26.5},
            {"day": "Tue", "kwh": 28.0},
            {"day": "Wed", "kwh": 25.4},
            {"day": "Thu", "kwh": 27.2},
            {"day": "Fri", "kwh": 31.0},
            {"day": "Sat", "kwh": 34.5},
            {"day": "Sun", "kwh": 32.8},
        ]
        total = sum(d["kwh"] for d in days)
        return {
            "title": "Weekly Consumption",
            "subtitle": "This Week",
            "days": days,
            "total_week_kwh": round(total, 1)
        }

    @classmethod
    def get_monthly_consumption(cls) -> Dict[str, Any]:
        """
        Matches 'Usage Monitoring.png' Monthly Consumption: Last 12 Months
        """
        months = [
            {"month": "Jan", "kwh": 310.0},
            {"month": "Feb", "kwh": 345.0},
            {"month": "Mar", "kwh": 290.0},
            {"month": "Apr", "kwh": 260.0},
            {"month": "May", "kwh": 380.0},
            {"month": "Jun", "kwh": 420.0},
            {"month": "Jul", "kwh": 450.0},
            {"month": "Aug", "kwh": 435.0},
            {"month": "Sep", "kwh": 395.0},
            {"month": "Oct", "kwh": 330.0},
            {"month": "Nov", "kwh": 305.0},
            {"month": "Dec", "kwh": 360.0},
        ]
        total = sum(m["kwh"] for m in months)
        return {
            "title": "Monthly Consumption",
            "subtitle": "Last 12 Months",
            "months": months,
            "total_year_kwh": round(total, 1)
        }

    @classmethod
    def get_bedroom_insights(cls) -> Dict[str, Any]:
        """
        Matches 'Insight.png' screen:
        Bedroom Energy Consumption Overview
        Total: 120 kWh, Last 7 Days +15%
        Peak: 50 kWh, Last 7 Days -10%
        Plugs: Light A, Fan, AC
        Ratings: 4.5, 120 reviews
        Detailed Insights: AC 45 kWh (37.5%), Fan 30 kWh (25%), Light 25 kWh (20.8%)
        """
        return {
            "title": "Bedroom Energy Consumption Overview",
            "total_kwh": 120.0,
            "total_change_pct": 15.0,
            "peak_kwh": 50.0,
            "peak_change_pct": -10.0,
            "plug_breakdown": [
                {"name": "A.C.", "kwh": 45.0, "percentage": 37.5, "is_peak": True},
                {"name": "Fan", "kwh": 30.0, "percentage": 25.0, "is_peak": False},
                {"name": "Light", "kwh": 25.0, "percentage": 20.8, "is_peak": False},
            ],
            "rating": 4.5,
            "reviews_count": 120,
            "star_distribution": {
                "5": 35.0,
                "4": 30.0,
                "3": 20.0,
                "2": 10.0,
                "1": 5.0
            }
        }

    @classmethod
    def get_billing_summary(cls) -> Dict[str, Any]:
        """
        Matches 'Cost Estimation.png' Bills screen:
        Estimated Bill $123.50 Due Oct 15
        Past Bills: Oct 2023 $150.20, Sep 2023 $135.75, Aug 2023 $160.40
        Estimated Savings This Month: $20.00
        Switch to Green Energy Promo
        """
        return {
            "current_bill": {
                "estimated_bill_usd": 123.50,
                "due_date": "Due Oct 15"
            },
            "past_bills": [
                {"month_year": "Oct 2023", "status": "Paid", "amount_usd": 150.20, "due_date": "Nov 15"},
                {"month_year": "Sep 2023", "status": "Paid", "amount_usd": 135.75, "due_date": "Oct 15"},
                {"month_year": "Aug 2023", "status": "Paid", "amount_usd": 160.40, "due_date": "Sep 15"}
            ],
            "estimated_savings_this_month_usd": 20.00,
            "promo_title": "Switch to Green Energy",
            "promo_description": "Save more with sustainable energy solutions."
        }

grid_analytics = GridAnalyticsService()
