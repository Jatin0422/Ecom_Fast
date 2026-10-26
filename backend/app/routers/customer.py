from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select, update
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user
from app.models import CartItem, Customer, Order, OrderItem, Products, Seller
from app.schemas import (
    BuyNowRequest,
    CartItemCreate,
    CartItemQuantityUpdate,
    CartItemResponse,
    CheckoutRequest,
    OrderResponse,
    ProductResponse,
)

router = APIRouter(prefix="/customer", tags=["Customer"])


def require_customer(current_account: Customer | Seller) -> Customer:
    if not isinstance(current_account, Customer):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer access required",
        )
    return current_account


def create_order(
    db: Session,
    customer: Customer,
    order_lines: list[tuple[Products, int]],
    shipping_address: str,
    payment_method: str,
    cart_items: list[CartItem] | None = None,
) -> dict:
    if not order_lines:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="There are no products to order",
        )

    total_amount = sum(
        (product.price * quantity for product, quantity in order_lines),
        Decimal("0.00"),
    )
    order = Order(
        customer_id=customer.id,
        status="pending",
        payment_method=payment_method,
        payment_status="pending",
        total_amount=total_amount,
        shipping_address=shipping_address,
    )
    db.add(order)

    try:
        db.flush()
        order_items = []
        for product, quantity in order_lines:
            stock_update = db.execute(
                update(Products)
                .where(Products.id == product.id, Products.stock >= quantity)
                .values(stock=Products.stock - quantity)
            )
            if stock_update.rowcount != 1:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Not enough stock for {product.p_name}",
                )

            order_items.append(
                OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    product_name=product.p_name,
                    quantity=quantity,
                    unit_price=product.price,
                )
            )

        db.add_all(order_items)
        for cart_item in cart_items or []:
            db.delete(cart_item)
        db.commit()
        db.refresh(order)
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not place order",
        ) from error

    return {
        "id": order.id,
        "status": order.status,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "total_amount": order.total_amount,
        "shipping_address": order.shipping_address,
        "created_at": order.created_at,
        "items": [
            {
                "product_id": item.product_id,
                "product_name": item.product_name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
            }
            for item in order_items
        ],
    }


@router.get("/products", response_model=list[ProductResponse])
def get_products(
    db: Session = Depends(get_db),
    current_account: Customer | Seller = Depends(get_current_user),
):
    require_customer(current_account)
    return db.scalars(select(Products)).all()


@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product_detail(
    product_id: int,
    db: Session = Depends(get_db),
    current_account: Customer | Seller = Depends(get_current_user),
):
    require_customer(current_account)
    product = db.get(Products, product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return product


@router.get("/cart", response_model=list[CartItemResponse])
def get_cart(
    db: Session = Depends(get_db),
    current_account: Customer | Seller = Depends(get_current_user),
):
    customer = require_customer(current_account)
    cart_rows = db.execute(
        select(CartItem, Products)
        .join(Products, CartItem.product_id == Products.id)
        .where(CartItem.customer_id == customer.id)
        .order_by(CartItem.created_at)
    ).all()
    return [
        {
            "product_id": cart_item.product_id,
            "quantity": cart_item.quantity,
            "product": product,
        }
        for cart_item, product in cart_rows
    ]


@router.post("/cart", status_code=status.HTTP_200_OK)
def add_product_to_cart(
    item: CartItemCreate,
    db: Session = Depends(get_db),
    current_account: Customer | Seller = Depends(get_current_user),
):
    customer = require_customer(current_account)
    product = db.get(Products, item.product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    cart_item = db.scalar(
        select(CartItem).where(
            CartItem.customer_id == customer.id,
            CartItem.product_id == product.id,
        )
    )
    new_quantity = item.quantity + (cart_item.quantity if cart_item else 0)
    if product.stock < new_quantity:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Requested quantity exceeds available stock",
        )

    if cart_item is None:
        cart_item = CartItem(
            customer_id=customer.id,
            product_id=product.id,
            quantity=item.quantity,
        )
        db.add(cart_item)
    else:
        cart_item.quantity = new_quantity

    try:
        db.commit()
        db.refresh(cart_item)
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not add product to cart",
        ) from error

    return {
        "message": "Product added to cart",
        "product_id": cart_item.product_id,
        "quantity": cart_item.quantity,
    }


@router.patch("/cart/{product_id}", response_model=CartItemResponse)
def update_cart_item(
    product_id: int,
    changes: CartItemQuantityUpdate,
    db: Session = Depends(get_db),
    current_account: Customer | Seller = Depends(get_current_user),
):
    customer = require_customer(current_account)
    cart_item = db.scalar(
        select(CartItem)
        .options(joinedload(CartItem.product))
        .where(
            CartItem.customer_id == customer.id,
            CartItem.product_id == product_id,
        )
    )
    if cart_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found",
        )
    if changes.quantity > cart_item.product.stock:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Requested quantity exceeds available stock",
        )

    cart_item.quantity = changes.quantity
    try:
        db.commit()
        db.refresh(cart_item)
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not update cart item",
        ) from error
    return cart_item


@router.delete("/cart/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_cart_item(
    product_id: int,
    db: Session = Depends(get_db),
    current_account: Customer | Seller = Depends(get_current_user),
):
    customer = require_customer(current_account)
    cart_item = db.scalar(
        select(CartItem).where(
            CartItem.customer_id == customer.id,
            CartItem.product_id == product_id,
        )
    )
    if cart_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found",
        )
    db.delete(cart_item)
    try:
        db.commit()
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not remove cart item",
        ) from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/orders", response_model=list[OrderResponse])
def get_customer_orders(
    db: Session = Depends(get_db),
    current_account: Customer | Seller = Depends(get_current_user),
):
    customer = require_customer(current_account)
    return db.scalars(
        select(Order)
        .options(joinedload(Order.items))
        .where(Order.customer_id == customer.id)
        .order_by(Order.created_at.desc(), Order.id.desc())
    ).unique().all()


@router.post("/orders/{order_id}/cancel", response_model=OrderResponse)
def cancel_customer_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_account: Customer | Seller = Depends(get_current_user),
):
    customer = require_customer(current_account)
    try:
        cancellation = db.execute(
            update(Order)
            .where(
                Order.id == order_id,
                Order.customer_id == customer.id,
                Order.status == "pending",
            )
            .values(status="cancelled")
        )
        if cancellation.rowcount != 1:
            db.rollback()
            order = db.get(Order, order_id)
            if order is None or order.customer_id != customer.id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Order not found",
                )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only pending orders can be cancelled",
            )

        order_items = db.scalars(
            select(OrderItem).where(OrderItem.order_id == order_id)
        ).all()
        for item in order_items:
            db.execute(
                update(Products)
                .where(Products.id == item.product_id)
                .values(stock=Products.stock + item.quantity)
            )

        db.commit()
    except HTTPException:
        raise
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not cancel order",
        ) from error

    return db.scalars(
        select(Order)
        .options(joinedload(Order.items))
        .where(Order.id == order_id, Order.customer_id == customer.id)
    ).unique().one()


@router.post("/orders/from-cart", response_model=OrderResponse, status_code=201)
def order_cart(
    checkout: CheckoutRequest,
    db: Session = Depends(get_db),
    current_account: Customer | Seller = Depends(get_current_user),
):
    customer = require_customer(current_account)
    cart_rows = db.execute(
        select(CartItem, Products)
        .join(Products, CartItem.product_id == Products.id)
        .where(CartItem.customer_id == customer.id)
    ).all()
    if not cart_rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your cart is empty",
        )

    order_lines = [(product, cart_item.quantity) for cart_item, product in cart_rows]
    cart_items = [cart_item for cart_item, _ in cart_rows]
    return create_order(
        db,
        customer,
        order_lines,
        checkout.shipping_address,
        checkout.payment_method,
        cart_items,
    )


@router.post("/orders/buy-now", response_model=OrderResponse, status_code=201)
def order_product_now(
    checkout: BuyNowRequest,
    db: Session = Depends(get_db),
    current_account: Customer | Seller = Depends(get_current_user),
):
    customer = require_customer(current_account)
    product = db.get(Products, checkout.product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return create_order(
        db,
        customer,
        [(product, checkout.quantity)],
        checkout.shipping_address,
        checkout.payment_method,
    )
