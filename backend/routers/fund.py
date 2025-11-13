from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db


router = APIRouter()


@router.get("/nav", response_model=Optional[schemas.FundSummary])
def get_latest_nav(db: Session = Depends(get_db)) -> Optional[schemas.FundSummary]:
    latest_history = crud.get_latest_fund_history(db)
    if not latest_history:
        return None
    cash_balance = crud.get_cash_balance(db)
    return schemas.FundSummary(
        date=latest_history.date,
        nav=latest_history.nav,
        total_value=latest_history.total_value,
        cash=cash_balance.amount,
        change_value=latest_history.change_value,
        change_pct=latest_history.change_pct,
    )


@router.get("/history", response_model=list[schemas.FundHistoryRead])
def get_history(limit: int = Query(60, ge=1, le=365), db: Session = Depends(get_db)) -> list[schemas.FundHistoryRead]:
    history = crud.get_fund_history(db, limit=limit)
    return [schemas.FundHistoryRead.from_orm(record) for record in history]


@router.post("/recalculate", response_model=schemas.FundSummary)
def recalculate_nav(
    holdings_date: Optional[date] = None,
    db: Session = Depends(get_db),
) -> schemas.FundSummary:
    target_date = holdings_date or date.today()
    holdings = crud.get_holdings_by_date(db, target_date)
    if not holdings:
        raise HTTPException(status_code=404, detail="No holdings available for the requested date.")

    payload = [
        schemas.HoldingCreate(
            name=h.name,
            symbol=h.symbol,
            quantity=h.quantity,
            cost_price=h.cost_price,
            market_value=h.market_value,
            weight=h.weight,
            date=h.date,
        )
        for h in holdings
    ]
    return crud.update_holdings_and_nav(db, payload, holdings_date=target_date)


@router.get("/cash", response_model=schemas.CashBalance)
def read_cash_balance(db: Session = Depends(get_db)) -> schemas.CashBalance:
    cash = crud.get_cash_balance(db)
    return schemas.CashBalance(
        amount=cash.amount,
        created_at=cash.created_at,
        updated_at=cash.updated_at,
    )


@router.put("/cash", response_model=schemas.CashBalance)
def update_cash_balance(
    payload: schemas.CashUpdate,
    db: Session = Depends(get_db),
) -> schemas.CashBalance:
    cash = crud.update_cash_balance(db, payload.amount)
    return schemas.CashBalance(
        amount=cash.amount,
        created_at=cash.created_at,
        updated_at=cash.updated_at,
    )

