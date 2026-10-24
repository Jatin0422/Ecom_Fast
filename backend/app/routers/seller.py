from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies import get_current_user
from app.models import Customer, Seller,Products
from app.schemas import ProductResponse, ProductsCreate
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter(prefix="/seller", tags=["Seller"])


@router.get("/dashboard")
def get_seller_dashboard(
    current_account: Customer | Seller = Depends(get_current_user),
):
    if not isinstance(current_account, Seller):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seller access required",
        )

    return {
        "store_name": current_account.store_name,
    }

@router.post('/productlisting', response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def product_create(
    product: ProductsCreate,
    db: Session = Depends(get_db),
    current_account: Customer | Seller = Depends(get_current_user),
):
    if not isinstance(current_account, Seller):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seller access required",
        )

    new_product=Products(
        s_id=current_account.id,
        p_name=product.p_name,
        description=product.description,
        category=product.category,
        price=product.price,
        mrp=product.mrp,
        stock=product.stock,
        image_url=str(product.image_url) if product.image_url else None,
    )
    try:
        db.add(new_product)
        db.commit()
        db.refresh(new_product)
    except SQLAlchemyError as err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create product",
        ) from err
    return new_product