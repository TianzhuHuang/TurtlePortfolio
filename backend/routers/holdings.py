from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db


router = APIRouter()


@router.get("/today", response_model=Optional[schemas.HoldingsResponse])
def read_latest_holdings(db: Session = Depends(get_db)) -> Optional[schemas.HoldingsResponse]:
    """
    Fetch the most recent holdings snapshot.
    """
    return crud.get_latest_holdings(db)


@router.get("/by-date/{target_date}", response_model=list[schemas.HoldingRead])
def read_holdings_by_date(target_date: date, db: Session = Depends(get_db)) -> list[schemas.HoldingRead]:
    """
    Fetch holdings for a specific trading date.
    """
    records = crud.get_holdings_by_date(db, target_date)
    if not records:
        raise HTTPException(status_code=404, detail="Holdings not found for provided date.")
    return [schemas.HoldingRead.from_orm(record) for record in records]


@router.post("/manual", response_model=schemas.FundSummary)
def upsert_holdings(
    payload: schemas.ManualHoldingsPayload,
    overwrite: bool = Query(True, description="Replace existing holdings for the given date."),
    db: Session = Depends(get_db),
) -> schemas.FundSummary:
    """
    Allow manual upload of holdings data (e.g., CSV import or admin edits).
    """
    if not overwrite and crud.get_holdings_by_date(db, payload.date):
        raise HTTPException(
            status_code=400,
            detail="Holdings already exist for this date. Set overwrite=true to replace them.",
        )
    try:
        return crud.update_holdings_and_nav(db, payload.holdings, holdings_date=payload.date)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

