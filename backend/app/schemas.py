from typing import Literal
from decimal import Decimal
from pydantic import (
    AnyHttpUrl,
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
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
