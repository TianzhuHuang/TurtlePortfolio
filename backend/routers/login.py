from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session
from typing import Optional

from .. import crud, schemas, models
from ..database import get_db
from .dependencies import get_current_investor, get_current_admin_investor

router = APIRouter()


@router.post("/login", response_model=schemas.LoginResponse)
def login(
    request: Request,
    payload: schemas.LoginRequest,
    db: Session = Depends(get_db)
) -> schemas.LoginResponse:
    investor = crud.authenticate_investor(db, payload.identifier, payload.password)
    if not investor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid identifier or password"
        )
    
    # 获取客户端IP地址
    ip_address = request.client.host if request.client else None
    # 获取User-Agent
    user_agent = request.headers.get("User-Agent")
    
    # 创建新的投资者令牌
    investor_token = crud.create_investor_token(
        db, 
        investor.id, 
        user_agent=user_agent, 
        ip_address=ip_address
    )
    
    return schemas.LoginResponse(
        investor=schemas.InvestorRead.from_orm(investor),
        token=schemas.InvestorTokenRead.from_orm(investor_token)
    )


@router.post("/logout")
def logout(
    token: str = Header(None),
    db: Session = Depends(get_db)
) -> dict:
    # 检查令牌是否存在
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token is required"
        )
        
    # 删除令牌
    if crud.delete_investor_token(db, token):
        return {"message": "Logged out successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token"
        )


@router.put("/change-password", response_model=schemas.InvestorRead)
def change_password(
    payload: schemas.ChangePasswordRequest,
    token: str = Header("user-token"),
    db: Session = Depends(get_db)
) -> schemas.InvestorRead:
    # 检查令牌是否存在
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token is required"
        )
        
    # 验证令牌
    investor_token = crud.get_investor_token(db, token)
    if not investor_token or investor_token.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    # 验证旧密码
    investor = investor_token.investor
    if not crud.verify_password(payload.old_password, investor.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )
    
    # 更新密码
    updated_investor = crud.update_investor_password(db, investor, payload.new_password)
    return schemas.InvestorRead.from_orm(updated_investor)