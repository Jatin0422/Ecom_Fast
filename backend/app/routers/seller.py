from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies import get_current_user
from app.models import Customer, Seller,Products
from app.schemas import ProductResponse, ProductsCreate,Product_Update
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from sqlalchemy import select
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


@router.get('/products', response_model=list[ProductResponse])
def get_seller_products(db:Session=Depends(get_db), current_account:Customer|Seller=Depends(get_current_user)):
    if not isinstance(current_account, Seller):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seller access required",
        )
    return db.scalars(
        select(Products).where(Products.s_id==current_account.id)).all()

@router.patch(
    "/products/{product_id}",
    response_model=ProductResponse,
)
def update_seller_product(
    product_id: int,
    changes: Product_Update,
    db: Session = Depends(get_db),
    current_account: Customer | Seller = Depends(get_current_user),
):
    if not isinstance(current_account, Seller):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seller access required",
        )

    product = db.scalar(
        select(Products).where(
            Products.id == product_id,
            Products.s_id == current_account.id,
        )
    )
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    updated_values = changes.model_dump(exclude_unset=True)
    current_values = {
        "p_name": product.p_name,
        "description": product.description,
        "category": product.category,
        "price": product.price,
        "mrp": product.mrp,
        "stock": product.stock,
        "image_url": product.image_url,
    }
    current_values.update(updated_values)

    # Validate the complete product after applying this partial update.
    validated_product = ProductsCreate.model_validate(current_values)
    validated_values = validated_product.model_dump()
    if validated_values["image_url"] is not None:
        validated_values["image_url"] = str(validated_values["image_url"])

    for field, value in validated_values.items():
        setattr(product, field, value)

    try:
        db.commit()
        db.refresh(product)
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not update product",
        ) from error

    return product
