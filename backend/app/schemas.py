from datetime import datetime
from typing import Literal
from decimal import Decimal
from pydantic import (
    AnyHttpUrl,
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)

class UserRegister(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=16)
    role: Literal["seller", "user"]
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)
    address: str = Field(min_length=1, max_length=500)
    store_name: str | None = Field(default=None, min_length=2, max_length=150)

class RegistrationResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    city: str
    state: str
    address: str | None
    role: Literal["seller", "user"]
    store_name: str | None = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=16)
    role: Literal["seller", "user"]

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


ProductCategory = Literal[
    "Electronics",
    "Clothing",
    "Home Decor",
    "Kitchen Appliances",
    "Accessories",
    "Footwear",
    "Beauty & Personal Care",
    "Books & Stationery",
    "Sports & Outdoors",
    "Toys & Games",
    "Groceries",
    "Pet Supplies",
    "Other",
]

class ProductsCreate(BaseModel):
    p_name: str = Field(min_length=1, max_length=1000)
    description: str | None = Field(default=None, max_length=1000)
    image_url: AnyHttpUrl | None = None
    category: ProductCategory
    price: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    mrp: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    stock: int = Field(default=0, ge=0)

    @model_validator(mode="after")
    def validate_mrp(self):
        if self.mrp < self.price:
            raise ValueError("MRP must be greater than or equal to price")
        return self


class ProductResponse(BaseModel):
    id: int
    s_id: int
    p_name: str
    description: str | None
    category: ProductCategory
    price: Decimal
    mrp: Decimal
    stock: int
    image_url: str | None

    model_config = ConfigDict(from_attributes=True)


class CartItemCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(default=1, ge=1)


class CartItemQuantityUpdate(BaseModel):
    quantity: int = Field(ge=1)


class CheckoutRequest(BaseModel):
    shipping_address: str = Field(min_length=1, max_length=500)
    payment_method: Literal["cod"] = "cod"

    @field_validator("shipping_address")
    @classmethod
    def validate_shipping_address(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Shipping address cannot be blank")
        return value


class BuyNowRequest(CheckoutRequest):
    product_id: int = Field(gt=0)
    quantity: int = Field(default=1, ge=1)


class CartProductResponse(BaseModel):
    id: int
    p_name: str
    category: ProductCategory
    price: Decimal
    mrp: Decimal
    stock: int
    image_url: str | None

    model_config = ConfigDict(from_attributes=True)


class CartItemResponse(BaseModel):
    product_id: int
    quantity: int
    product: CartProductResponse


class OrderItemResponse(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    unit_price: Decimal


class OrderResponse(BaseModel):
    id: int
    status: str
    payment_method: str
    payment_status: str
    total_amount: Decimal
    shipping_address: str
    created_at: datetime
    items: list[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)


class SellerOrderItemResponse(BaseModel):
    order_id: int
    created_at: datetime
    order_status: str
    payment_method: str
    payment_status: str
    customer_name: str
    shipping_address: str
    product_id: int
    product_name: str
    quantity: int
    unit_price: Decimal
    item_total: Decimal


class Product_Update(BaseModel):
     p_name: str | None = Field(default=None, min_length=1, max_length=1000)
     description: str | None = Field(default=None, max_length=1000)
     image_url: AnyHttpUrl | None = None
     category: ProductCategory | None = None
     price: Decimal | None = Field(
        default=None, gt=0, max_digits=10, decimal_places=2
     )
     mrp: Decimal | None = Field(
        default=None, gt=0, max_digits=10, decimal_places=2
    )
     stock: int | None = Field(default=None, ge=0)