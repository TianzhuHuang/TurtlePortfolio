from __future__ import annotations

import os
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from loguru import logger

from ..database import SessionLocal
from .tushare_client import fetch_holdings

timezone = os.getenv("SCHEDULER_TIMEZONE", "Asia/Shanghai")
scheduler = BackgroundScheduler(timezone=timezone)


def run_daily_update() -> None:
    """
    Job executed by APScheduler to refresh holdings and NAV.
    """
    from .. import crud

    logger.info("Starting scheduled holdings refresh.")
    try:
        holdings = fetch_holdings()
    except RuntimeError as exc:
        logger.warning("Skipping scheduled refresh: %s", exc)
        return

    if not holdings:
        logger.warning("Scheduled refresh returned no holdings; skipping NAV update.")
        return

    session = SessionLocal()
    try:
        crud.update_holdings_and_nav(session, holdings)
        logger.info("Scheduled NAV update complete at %s", datetime.now())
    except Exception:
        logger.exception("Scheduled NAV update failed.")
    finally:
        session.close()


scheduler.add_job(
    run_daily_update,
    trigger="cron",
    hour=16,
    minute=30,
    id="daily_nav_refresh",
    replace_existing=True,
)

