from decimal import Decimal
from sqlalchemy import String, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column,relationship

from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(
        String(300), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)


class Seller(Base):
    __tablename__ = "sellers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(
        String(300), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    store_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    products: Mapped[list["Products"]] = relationship(back_populates="seller")


class LegacyUser(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(
        String(300), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)


class Products(Base):
    __tablename__='products'
    id:Mapped[int]=mapped_column(primary_key=True, index=True)
    s_id:Mapped[int]=mapped_column(ForeignKey('sellers.id'),nullable=False,index=True)
    p_name:Mapped[str]=mapped_column(String(1000),nullable=False)
    category:Mapped[str]=mapped_column(String(100),nullable=False)
    description: Mapped[str | None] = mapped_column(
        "descripton", String(1000), nullable=True
    )
    price:Mapped[Decimal]=mapped_column(Numeric(10,2),nullable=False)
    mrp:Mapped[Decimal]=mapped_column(Numeric(10,2),nullable=False)
    stock:Mapped[int]=mapped_column(default=0,nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    seller:Mapped['Seller']=relationship(back_populates='products')