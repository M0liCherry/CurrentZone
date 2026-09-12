import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    full_name = Column(String(128), default="Leslie Raymond")
    phone = Column(String(32), default="(405) 439 - 3985")
    birthday = Column(String(32), default="July 17, 1989")
    hashed_password = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    devices = relationship("Device", back_populates="user")
    budgets = relationship("BudgetAlert", back_populates="user")
    bills = relationship("BillRecord", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

class Device(Base):
    __tablename__ = "devices"
    
    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(128), nullable=False)  # "Smart Fridge", "Smart TV", "Smart Lamp", "AC", "Fan"
    device_type = Column(String(64), default="smart_plug")  # "smart_plug", "transformer_monitor"
    room = Column(String(64), default="Bedroom")  # "Bedroom", "Living Room", "Kitchen"
    zone = Column(String(64), default="Residential South")
    transformer_id = Column(String(64), nullable=True)
    is_online = Column(Boolean, default=True)
    current_power_w = Column(Float, default=0.0)
    current_amps = Column(Float, default=0.0)
    daily_kwh = Column(Float, default=0.0)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="devices")

class BudgetAlert(Base):
    __tablename__ = "budget_alerts"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    monthly_budget_usd = Column(Float, default=150.0)
    target_kwh = Column(Float, default=450.0)
    alert_threshold_pct = Column(Float, default=80.0)
    current_spent_usd = Column(Float, default=123.50)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="budgets")

class BillRecord(Base):
    __tablename__ = "bill_records"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    month_label = Column(String(32), nullable=False)  # "Oct 2023", "Sep 2023", "Aug 2023"
    amount_usd = Column(Float, nullable=False)
    due_date = Column(String(32), nullable=False)  # "Nov 15", "Due Oct 15"
    status = Column(String(32), default="Paid")  # "Paid", "Pending"
    energy_kwh = Column(Float, default=320.0)
    savings_usd = Column(Float, default=20.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="bills")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(128), nullable=False)
    description = Column(String(256), nullable=False)
    category = Column(String(64), default="outage_alert")  # "outage_alert", "budget", "plug", "energy_saving"
    time_label = Column(String(32), default="9:41 AM")
    is_read = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="notifications")
