from __future__ import annotations

import os
from datetime import date
from typing import List

from loguru import logger

from .. import schemas

try:
    import tushare as ts
except ImportError:  # pragma: no cover - optional dependency
    ts = None  # type: ignore


def fetch_holdings(account_code: str | None = None) -> List[schemas.HoldingCreate]:
    """
    Fetch current holdings from Tushare.

    The exact implementation depends on the account permissions granted to your token.
    By default this function returns an empty list and should be customized for the
    specific broker interface you have access to.
    """
    token = os.getenv("TUSHARE_TOKEN")
    if not token:
        raise RuntimeError("TUSHARE_TOKEN is not configured in the environment.")

    if ts is None:
        raise RuntimeError("tushare package is not installed. Install it to enable API updates.")

    ts.set_token(token)
    pro = ts.pro_api()

    try:
        # Placeholder implementation: fetch daily basic indicators for demonstration.
        today = date.today().strftime("%Y%m%d")
        df = pro.daily_basic(trade_date=today, fields="ts_code,total_mv,close")
    except Exception as exc:  # pragma: no cover - external API call
        logger.exception("Failed to fetch holdings from Tushare.")
        raise RuntimeError(f"Tushare request failed: {exc}") from exc

    holdings: list[schemas.HoldingCreate] = []
    for _, row in df.iterrows():
        market_value = float(row.get("total_mv") or 0) * 1e4  # total_mv is in 10k RMB
        if market_value <= 0:
            continue

        holdings.append(
            schemas.HoldingCreate(
                name=row.get("ts_code"),
                symbol=row.get("ts_code"),
                market_value=market_value,
            )
        )

    if not holdings:
        logger.warning("Tushare returned no holdings for date %s", today)

    return holdings

