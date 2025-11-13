from __future__ import annotations

from datetime import date
from typing import Iterable, List, Optional

from sqlalchemy import asc, desc, func, select
from sqlalchemy.orm import Session

from loguru import logger

from . import models, schemas


def get_latest_holdings(db: Session) -> Optional[schemas.HoldingsResponse]:
    stmt = (
        select(models.Holding.date)
        .order_by(desc(models.Holding.date))
        .limit(1)
    )
    latest_date = db.execute(stmt).scalar_one_or_none()
    if latest_date is None:
        return None

    holdings_stmt = (
        select(models.Holding)
        .where(models.Holding.date == latest_date)
        .order_by(desc(models.Holding.market_value))
    )
    holdings = [holding for holding, in db.execute(holdings_stmt)]
    total_value = sum(h.market_value for h in holdings)
    return schemas.HoldingsResponse(
        date=latest_date,
        total_value=total_value,
        holdings=[schemas.HoldingRead.from_orm(h) for h in holdings],
    )


def get_holdings_by_date(db: Session, target_date: date) -> List[models.Holding]:
    stmt = (
        select(models.Holding)
        .where(models.Holding.date == target_date)
        .order_by(desc(models.Holding.market_value))
    )
    return [holding for holding, in db.execute(stmt)]


def replace_holdings(
    db: Session,
    items: Iterable[schemas.HoldingCreate],
    holdings_date: date,
) -> List[models.Holding]:
    db.query(models.Holding).filter(models.Holding.date == holdings_date).delete()
    db.flush()

    holdings: list[models.Holding] = []
    total_value = sum(item.market_value for item in items)
    for item in items:
        weight = (item.market_value / total_value) if total_value else None
        holding = models.Holding(
            name=item.name,
            symbol=item.symbol,
            quantity=item.quantity,
            cost_price=item.cost_price,
            market_value=item.market_value,
            weight=weight,
            date=holdings_date,
        )
        db.add(holding)
        holdings.append(holding)

    return holdings


def get_investors(db: Session) -> List[models.Investor]:
    stmt = select(models.Investor).order_by(asc(models.Investor.id))
    return [investor for investor, in db.execute(stmt)]


def get_investor(db: Session, investor_id: int) -> Optional[models.Investor]:
    stmt = select(models.Investor).where(models.Investor.id == investor_id)
    return db.execute(stmt).scalar_one_or_none()


def create_investor(db: Session, payload: schemas.InvestorCreate) -> models.Investor:
    identifier = (payload.identifier or "").strip() or None
    investor = models.Investor(
        name=payload.name,
        identifier=identifier,
        initial_investment=payload.initial_investment,
        shares=payload.shares,
        current_value=payload.shares,  # assumes initial NAV of 1.0
    )
    db.add(investor)
    db.commit()
    db.refresh(investor)
    _recalculate_nav_with_latest_holdings(db)
    db.refresh(investor)
    return investor


def update_investor(
    db: Session,
    investor: models.Investor,
    payload: schemas.InvestorUpdate,
) -> models.Investor:
    update_data = payload.dict(exclude_unset=True)
    if "identifier" in update_data:
        raw_identifier = update_data["identifier"] or ""
        update_data["identifier"] = raw_identifier.strip() or None
    for field, value in update_data.items():
        setattr(investor, field, value)
    db.commit()
    db.refresh(investor)
    _recalculate_nav_with_latest_holdings(db)
    db.refresh(investor)
    return investor


def delete_investor(db: Session, investor: models.Investor) -> None:
    db.delete(investor)
    db.commit()
    _recalculate_nav_with_latest_holdings(db)


def get_initial_total_investment(db: Session) -> float:
    stmt = select(func.sum(models.Investor.initial_investment))
    result = db.execute(stmt).scalar_one_or_none()
    return float(result or 0.0)


def get_total_shares(db: Session) -> float:
    stmt = select(func.sum(models.Investor.shares))
    result = db.execute(stmt).scalar_one_or_none()
    return float(result or 0.0)


def get_latest_fund_history(db: Session) -> Optional[models.FundHistory]:
    stmt = (
        select(models.FundHistory)
        .order_by(desc(models.FundHistory.date))
        .limit(1)
    )
    return db.execute(stmt).scalar_one_or_none()


def get_fund_history(db: Session, limit: int = 30) -> List[models.FundHistory]:
    stmt = (
        select(models.FundHistory)
        .order_by(desc(models.FundHistory.date))
        .limit(limit)
    )
    records = [record for record, in db.execute(stmt)]
    return list(reversed(records))


def update_holdings_and_nav(
    db: Session,
    items: Iterable[schemas.HoldingCreate],
    holdings_date: Optional[date] = None,
    created_by: Optional[models.Investor] = None,
) -> schemas.FundSummary:
    holdings_date = holdings_date or date.today()
    items = list(items)
    if not items:
        raise ValueError("Holdings data is empty; nothing to update.")

    holdings = replace_holdings(db, items, holdings_date)
    total_value = sum(h.market_value for h in holdings)
    cash_balance = get_cash_balance(db)
    total_assets = total_value + cash_balance.amount

    total_shares = get_total_shares(db)
    if total_shares <= 0:
        raise ValueError("Investor total shares must be greater than zero.")

    nav = total_assets / total_shares

    investors = get_investors(db)
    for investor in investors:
        investor.current_value = investor.shares * nav

    # Remove history entry for the same date to avoid duplicates
    db.query(models.FundHistory).filter(models.FundHistory.date == holdings_date).delete()
    db.flush()

    previous_history_stmt = (
        select(models.FundHistory)
        .where(models.FundHistory.date < holdings_date)
        .order_by(desc(models.FundHistory.date))
        .limit(1)
    )
    previous_history = db.execute(previous_history_stmt).scalar_one_or_none()

    change_value = None
    change_pct = None
    if previous_history:
        change_value = total_value - previous_history.total_value
        if previous_history.total_value:
            change_pct = (change_value / previous_history.total_value) * 100

    history = models.FundHistory(
        date=holdings_date,
        nav=nav,
        total_value=total_assets,
        change_value=change_value,
        change_pct=change_pct,
        created_by_id=getattr(created_by, "id", None),
    )
    db.add(history)
    db.commit()
    db.refresh(history)

    return schemas.FundSummary(
        date=holdings_date,
        nav=nav,
        total_value=total_assets,
        cash=cash_balance.amount,
        change_value=change_value,
        change_pct=change_pct,
    )


def get_cash_balance(db: Session) -> models.FundCash:
    cash = db.query(models.FundCash).first()
    if not cash:
        cash = models.FundCash(amount=0.0)
        db.add(cash)
        db.commit()
        db.refresh(cash)
    return cash


def update_cash_balance(db: Session, amount: float) -> models.FundCash:
    cash = get_cash_balance(db)
    cash.amount = amount
    db.commit()
    db.refresh(cash)
    _recalculate_nav_with_latest_holdings(db)
    return cash


def _recalculate_nav_with_latest_holdings(db: Session) -> None:
    latest_holdings = get_latest_holdings(db)
    if not latest_holdings or not latest_holdings.holdings:
        return
    try:
        holdings_payload = [
            schemas.HoldingCreate(
                name=item.name,
                symbol=item.symbol,
                quantity=item.quantity,
                cost_price=item.cost_price,
                market_value=item.market_value,
                weight=item.weight,
                date=item.date,
            )
            for item in latest_holdings.holdings
        ]
        update_holdings_and_nav(
            db,
            holdings_payload,
            holdings_date=latest_holdings.date,
        )
    except ValueError as exc:
        logger.warning("NAV recalculation skipped: %s", exc)

