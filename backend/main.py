from datetime import datetime
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, engine, SessionLocal
from .routers import fund, holdings, investors, upload, login
from . import models, crud
from .utils.scheduler import scheduler


def create_app() -> FastAPI:
    """
    Application factory used to configure FastAPI and register routers.
    """
    app = FastAPI(
        title="Turtle Fund NAV API",
        description="APIs for managing fund holdings, investors, and NAV calculations.",
        version="0.1.0",
        contact={"name": "Turtle Fund Ops"},
    )

    # Ensure database schema exists before the API starts serving requests.
    Base.metadata.create_all(bind=engine)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(fund.router, prefix="/api/fund", tags=["fund"])
    app.include_router(holdings.router, prefix="/api/holdings", tags=["holdings"])
    app.include_router(investors.router, prefix="/api/investors", tags=["investors"])
    app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
    app.include_router(login.router, prefix="/api/auth", tags=["authentication"])

    @app.on_event("startup")
    async def startup_event() -> None:
        # Create directories needed for runtime storage.
        uploads_dir = Path(__file__).resolve().parent.parent / "uploads"
        uploads_dir.mkdir(parents=True, exist_ok=True)

        # Create default admin investor if not exists
        db: Session = SessionLocal()
        try:
            # Check if any admin investor exists
            stmt = db.query(models.Investor).filter(models.Investor.is_admin == True)
            admin_exists = stmt.first()
            
            if not admin_exists:
                # Create default admin investor
                admin_investor = models.Investor(
                    name="Default Admin",
                    identifier="admin",
                    initial_investment=0.0,
                    shares=0.0,
                    current_value=0.0,
                    password_hash=crud.get_password_hash("admin123"),
                    is_admin=True
                )
                db.add(admin_investor)
                db.commit()
                print("Default admin investor created with username: admin and password: admin123")
        except Exception as e:
            db.rollback()
            print(f"Error creating default admin investor: {e}")
        finally:
            db.close()

        if not scheduler.running:
            scheduler.start()

    @app.on_event("shutdown")
    async def shutdown_event() -> None:
        if scheduler.running:
            scheduler.shutdown(wait=False)

    @app.get("/health")
    async def healthcheck() -> dict[str, str]:
        """
        Lightweight endpoint used by deployment targets to verify readiness.
        """
        return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

    return app


app = create_app()