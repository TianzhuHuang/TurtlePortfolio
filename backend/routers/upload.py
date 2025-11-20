import shutil
from datetime import date
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from loguru import logger
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db
from ..routers.dependencies import get_current_admin_investor
from .. import models
from ..utils.ocr_parser import parse_account_screenshot
from ..utils.tushare_client import fetch_holdings


router = APIRouter()


def _aggregate_holdings_from_files(files: list[UploadFile]) -> list[schemas.HoldingCreate]:
    uploads_dir = Path(__file__).resolve().parent.parent.parent / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)

    aggregated: dict[str, dict[str, float | str | None]] = {}
    for file in files:
        destination = uploads_dir / file.filename
        with destination.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        try:
            parsed = parse_account_screenshot(destination)
        except RuntimeError as exc:
            logger.exception("OCR parsing failed for file %s", file.filename)
            raise HTTPException(status_code=500, detail=str(exc)) from exc
        finally:
            file.file.close()
            try:
                destination.unlink()
            except OSError:
                logger.warning("Unable to delete temporary upload %s", destination)

        if not parsed:
            continue

        logger.info(
            "Parsed %s holdings from %s: %s",
            len(parsed),
            file.filename,
            [item["name"] for item in parsed],
        )

        for item in parsed:
            key = item["name"].strip()
            market_value = float(item.get("market_value", 0.0) or 0.0)
            quantity = item.get("quantity")
            cost_price = item.get("cost_price")

            existing = aggregated.get(key)
            if existing:
                if market_value > float(existing.get("market_value", 0.0)):
                    logger.info(
                        "Replacing duplicate entry for %s with higher market value %.2f -> %.2f",
                        key,
                        existing.get("market_value", 0.0),
                        market_value,
                    )
                    existing.update(
                        {
                            "market_value": market_value,
                            "quantity": float(quantity) if quantity is not None else None,
                            "cost_price": float(cost_price) if cost_price is not None else None,
                            "symbol": item.get("symbol"),
                        }
                    )
                else:
                    logger.info(
                        "Ignoring duplicate entry for %s with market value %.2f (existing %.2f)",
                        key,
                        market_value,
                        existing.get("market_value", 0.0),
                    )
                continue

            aggregated[key] = {
                "name": item["name"],
                "symbol": item.get("symbol"),
                "market_value": market_value,
                "quantity": float(quantity) if quantity is not None else None,
                "cost_price": float(cost_price) if cost_price is not None else None,
            }

    if not aggregated:
        raise HTTPException(
            status_code=400,
            detail="无法从截图中识别持仓，请确认截图清晰完整，或尝试上传更高分辨率的图片。",
        )

    holdings_payload: list[schemas.HoldingCreate] = []
    for entry in aggregated.values():
        holdings_payload.append(
            schemas.HoldingCreate(
                name=str(entry["name"]),
                symbol=str(entry.get("symbol") or "") or None,
                quantity=float(entry["quantity"]) if entry.get("quantity") is not None else None,
                cost_price=float(entry["cost_price"]) if entry.get("cost_price") is not None else None,
                market_value=float(entry.get("market_value", 0.0)),
            )
        )

    holdings_payload.sort(key=lambda item: item.market_value, reverse=True)
    logger.info(
        "Aggregated %s holdings from %s screenshot(s): %s",
        len(holdings_payload),
        len(files),
        [item.name for item in holdings_payload],
    )
    return holdings_payload


@router.post("/tushare", response_model=schemas.FundSummary)
def refresh_from_tushare(
    db: Session = Depends(get_db), 
    current_investor: models.Investor = Depends(get_current_admin_investor)
) -> schemas.FundSummary:
    """
    Attempt to pull the latest holdings from the configured Tushare account.
    """
    try:
        holdings = fetch_holdings()
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    try:
        return crud.update_holdings_and_nav(db, holdings)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/screenshot/preview", response_model=schemas.UploadPreviewResponse)
async def preview_screenshot(
    files: list[UploadFile] = File(...),
    holdings_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_investor: models.Investor = Depends(get_current_admin_investor),
) -> schemas.UploadPreviewResponse:
    """
    Parse the uploaded screenshot and return holdings for client confirmation.
    """
    holdings_payload = _aggregate_holdings_from_files(files)
    holdings_value = sum(item.market_value for item in holdings_payload)

    cash_balance = crud.get_cash_balance(db).amount
    total_assets = holdings_value + cash_balance
    total_shares = crud.get_total_shares(db)
    nav = total_assets / total_shares if total_shares > 0 else None

    return schemas.UploadPreviewResponse(
        date=holdings_date or date.today(),
        holdings_value=holdings_value,
        cash=cash_balance,
        total_assets=total_assets,
        nav=nav,
        holdings=holdings_payload,
    )


@router.post("/screenshot", response_model=schemas.UploadResponse)
async def upload_screenshot(
    files: list[UploadFile] = File(...),
    holdings_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_investor: models.Investor = Depends(get_current_admin_investor),
) -> schemas.UploadResponse:
    """
    Accept a broker screenshot, parse it via OCR, and update holdings for the selected date.
    """
    holdings_payload = _aggregate_holdings_from_files(files)

    holdings_date = holdings_date or date.today()
    try:
        summary = crud.update_holdings_and_nav(db, holdings_payload, holdings_date)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return schemas.UploadResponse(
        date=summary.date,
        nav=summary.nav,
        total_value=summary.total_value,
        holdings_processed=len(holdings_payload),
    )

