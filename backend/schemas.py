from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class TimestampModel(BaseModel):
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class HoldingBase(BaseModel):
    name: str
    symbol: Optional[str] = None
    quantity: Optional[float] = None
    cost_price: Optional[float] = None
    market_value: float = Field(..., ge=0)
    weight: Optional[float] = None
    date: Optional[date] = None


class HoldingCreate(HoldingBase):
    pass


class HoldingRead(HoldingBase, TimestampModel):
    id: int


class InvestorBase(BaseModel):
    name: str
    identifier: Optional[str] = None
    initial_investment: float = Field(..., ge=0)
    shares: float = Field(..., ge=0)
    is_admin: bool = False


class InvestorCreate(InvestorBase):
    password: str = Field(..., min_length=6)


class InvestorUpdate(BaseModel):
    name: Optional[str] = None
    identifier: Optional[str] = None
    initial_investment: Optional[float] = Field(None, ge=0)
    shares: Optional[float] = Field(None, ge=0)
    is_admin: Optional[bool] = None


class InvestorRead(InvestorBase, TimestampModel):
    id: int
    current_value: float


class FundHistoryBase(BaseModel):
    date: date
    nav: float
    total_value: float
    change_pct: Optional[float] = None
    change_value: Optional[float] = None


class FundHistoryRead(FundHistoryBase, TimestampModel):
    id: int


class FundSummary(BaseModel):
    date: date
    nav: float
    total_value: float
    cash: float
    change_pct: Optional[float] = None
    change_value: Optional[float] = None


class HoldingsResponse(BaseModel):
    date: date
    total_value: float
    holdings: List[HoldingRead]


class UploadResponse(BaseModel):
    date: date
    nav: float
    total_value: float
    holdings_processed: int


class UploadPreviewResponse(BaseModel):
    date: date
    holdings_value: float
    cash: float
    total_assets: float
    nav: Optional[float]
    holdings: List[HoldingCreate]


class ManualHoldingsPayload(BaseModel):
    date: date
    holdings: List[HoldingCreate]


class CashBalance(TimestampModel):
    amount: float


class CashUpdate(BaseModel):
    amount: float = Field(..., ge=0)


class LoginRequest(BaseModel):
    identifier: str
    password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class InvestorTokenBase(BaseModel):
    token: str
    investor_id: int
    expires_at: datetime
    last_used_at: Optional[datetime] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None


class InvestorTokenCreate(InvestorTokenBase):
    pass


class InvestorTokenRead(InvestorTokenBase, TimestampModel):
    id: int


class LoginResponse(BaseModel):
    investor: InvestorRead
    token: InvestorTokenRead