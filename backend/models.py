from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, Boolean
from sqlalchemy.orm import relationship

from .database import Base


class TimestampMixin:
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


class Investor(Base, TimestampMixin):
    __tablename__ = "investors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    identifier = Column(String(64), nullable=True, unique=True)
    initial_investment = Column(Float, nullable=False, default=0.0)
    shares = Column(Float, nullable=False, default=0.0)
    current_value = Column(Float, nullable=False, default=0.0)
    password_hash = Column(String(128), nullable=False)
    is_admin = Column(Boolean, nullable=False, default=False)

    histories = relationship("FundHistory", back_populates="created_by", viewonly=True)
    tokens = relationship("InvestorToken", back_populates="investor")


class Holding(Base, TimestampMixin):
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    symbol = Column(String(32), nullable=True, index=True)
    quantity = Column(Float, nullable=True)
    cost_price = Column(Float, nullable=True)
    market_value = Column(Float, nullable=False, default=0.0)
    weight = Column(Float, nullable=True)
    date = Column(Date, nullable=False, index=True, default=date.today)


class FundHistory(Base, TimestampMixin):
    __tablename__ = "fund_history"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, default=date.today, index=True)
    nav = Column(Float, nullable=False)
    total_value = Column(Float, nullable=False)
    change_pct = Column(Float, nullable=True)
    change_value = Column(Float, nullable=True)
    created_by_id = Column(Integer, ForeignKey("investors.id"), nullable=True)

    created_by = relationship("Investor", back_populates="histories")


class FundCash(Base, TimestampMixin):
    __tablename__ = "fund_cash"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False, default=0.0)


class InvestorToken(Base, TimestampMixin):
    __tablename__ = "investor_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(255), nullable=False, unique=True, index=True)
    investor_id = Column(Integer, ForeignKey("investors.id"), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    user_agent = Column(String(255), nullable=True)
    ip_address = Column(String(45), nullable=True)
    
    investor = relationship("Investor", back_populates="tokens")