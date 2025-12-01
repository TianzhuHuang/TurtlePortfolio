from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional

from .. import crud, models
from ..database import get_db


def get_current_investor(token: str = Header(alias="user-token", default=None), db: Session = Depends(get_db)) -> models.Investor:
    """
    从header中获取当前用户
    """
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    investor_token = crud.get_investor_token(db, token)
    if not investor_token:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    return investor_token.investor


def get_current_admin_investor(token: str = Header(alias="user-token", default=None), db: Session = Depends(get_db)) -> models.Investor:
    """
    从header中获取当前管理员用户
    """
    investor = get_current_investor(token, db)
    if not investor.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
        
    return investor