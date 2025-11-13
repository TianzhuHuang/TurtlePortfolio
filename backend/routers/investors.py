from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db


router = APIRouter()


@router.get("/", response_model=list[schemas.InvestorRead])
def list_investors(db: Session = Depends(get_db)) -> list[schemas.InvestorRead]:
    investors = crud.get_investors(db)
    return [schemas.InvestorRead.from_orm(inv) for inv in investors]


@router.post("/", response_model=schemas.InvestorRead, status_code=status.HTTP_201_CREATED)
def create_investor(payload: schemas.InvestorCreate, db: Session = Depends(get_db)) -> schemas.InvestorRead:
    investor = crud.create_investor(db, payload)
    return schemas.InvestorRead.from_orm(investor)


@router.put("/{investor_id}", response_model=schemas.InvestorRead)
def update_investor(
    payload: schemas.InvestorUpdate,
    investor_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
) -> schemas.InvestorRead:
    investor = crud.get_investor(db, investor_id)
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found.")
    investor = crud.update_investor(db, investor, payload)
    return schemas.InvestorRead.from_orm(investor)


@router.delete("/{investor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_investor(investor_id: int = Path(..., ge=1), db: Session = Depends(get_db)) -> None:
    investor = crud.get_investor(db, investor_id)
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found.")
    crud.delete_investor(db, investor)

