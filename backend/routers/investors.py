from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session

from .. import crud, schemas, models
from ..database import get_db
from .dependencies import get_current_investor, get_current_admin_investor


router = APIRouter()


@router.get("/me", response_model=schemas.InvestorRead)
def get_current_investor_info(
    current_investor: models.Investor = Depends(get_current_investor)
) -> schemas.InvestorRead:
    """
    获取当前登录投资者的信息
    """
    return schemas.InvestorRead.from_orm(current_investor)


@router.get("/", response_model=list[schemas.InvestorRead])
def list_investors(
    db: Session = Depends(get_db),
    current_investor: models.Investor = Depends(get_current_admin_investor)
) -> list[schemas.InvestorRead]:
    investors = crud.get_investors(db)
    return [schemas.InvestorRead.from_orm(inv) for inv in investors]


@router.post("/", response_model=schemas.InvestorRead, status_code=status.HTTP_201_CREATED)
def create_investor(
    payload: schemas.InvestorCreate,
    db: Session = Depends(get_db),
    current_investor: models.Investor = Depends(get_current_admin_investor)
) -> schemas.InvestorRead:
    try:
        investor = crud.create_investor(db, payload, current_investor)
        return schemas.InvestorRead.from_orm(investor)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.put("/{investor_id}", response_model=schemas.InvestorRead)
def update_investor(
    payload: schemas.InvestorUpdate,
    investor_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_investor: models.Investor = Depends(get_current_admin_investor)
) -> schemas.InvestorRead:
    investor = crud.get_investor(db, investor_id)
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found.")
    
    try:
        investor = crud.update_investor(db, investor, payload, current_investor)
        return schemas.InvestorRead.from_orm(investor)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.delete("/{investor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_investor(
    investor_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_investor: models.Investor = Depends(get_current_admin_investor)
) -> None:
    investor = crud.get_investor(db, investor_id)
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found.")
    crud.delete_investor(db, investor)