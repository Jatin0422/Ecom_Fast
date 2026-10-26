from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies import get_current_user
from app.models import Customer, Order, OrderItem, Products, Seller
from app.schemas import (
    ProductResponse,
    ProductsCreate,
    Product_Update,
    SellerOrderItemResponse,
)
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database import get_db

router = APIRouter(prefix="/seller", tags=["Seller"])


@router.get("/dashboard")
def get_seller_dashboard(
    db: Session = Depends(get_db),
    current_account: Customer | Seller = Depends(get_current_user),
):
    if not isinstance(current_account, Seller):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seller access required",
        )

    seller_items = db.execute(
        select(OrderItem, Order)
        .join(Order, Order.id == OrderItem.order_id)
        .join(Products, Products.id == OrderItem.product_id)
        .where(Products.s_id == current_account.id)
    ).all()
    order_ids = {order.id for _, order in seller_items}
    cancelled_order_ids = {
        order.id for _, order in seller_items if order.status == "cancelled"
    }
    order_value = sum(
        (
            order_item.unit_price * order_item.quantity
            for order_item, order in seller_items
            if order.status != "cancelled"
        ),
        Decimal("0.00"),
    )

    return {
        "store_name": current_account.store_name,
        "total_orders": len(order_ids),
        "cancelled_orders": len(cancelled_order_ids),
        "returns": 0,
        "order_value": order_value,
    }


@router.get("/orders", response_model=list[SellerOrderItemResponse])
def get_seller_orders(
    db: Session = Depends(get_db),
    current_account: Customer | Seller = Depends(get_current_user),
):
    if not isinstance(current_account, Seller):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seller access required",
        )

    rows = db.execute(
        select(OrderItem, Order, Products, Customer)
        .join(Order, Order.id == OrderItem.order_id)
        .join(Products, Products.id == OrderItem.product_id)
        .join(Customer, Customer.id == Order.customer_id)
        .where(Products.s_id == current_account.id)
        .order_by(Order.created_at.desc(), Order.id.desc())
    ).all()
    return [
        {
            "order_id": order.id,
            "created_at": order.created_at,
            "order_status": order.status,
            "payment_method": order.payment_method,
            "payment_status": order.payment_status,
            "customer_name": customer.full_name,
            "shipping_address": order.shipping_address,
            "product_id": product.id,
            "product_name": order_item.product_name,
            "quantity": order_item.quantity,
            "unit_price": order_item.unit_price,
            "item_total": order_item.unit_price * order_item.quantity,
        }
        for order_item, order, product, customer in rows
    ]


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
