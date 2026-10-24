from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Customer, Products, Seller
from app.schemas import ProductResponse

router = APIRouter(prefix="/customer", tags=["Customer"])


@router.get("/products", response_model=list[ProductResponse])
def get_products(
    db: Session = Depends(get_db),
    current_account: Customer | Seller = Depends(get_current_user),
):
    if not isinstance(current_account, Customer):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer access required",
        )

    return db.scalars(select(Products)).all()