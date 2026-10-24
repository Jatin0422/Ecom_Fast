from fastapi import APIRouter,status,Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas import (
    LoginRequest,
    RegistrationResponse,
    TokenResponse,
    UserRegister,
)
from app.models import Customer, Seller
from app.security import hash_password,create_acess_token,verify_password
from app.database import get_db

router=APIRouter(prefix='/auth',tags=['Authentication'])

@router.post("/register", response_model=RegistrationResponse)
def user_register(user: UserRegister, db: Session = Depends(get_db)):
    if (
        db.query(Customer).filter(Customer.email == user.email).first()
        or db.query(Seller).filter(Seller.email == user.email).first()
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    if user.role == "seller" and not user.store_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Store name is required for seller registration",
        )

    account_values = {
        "full_name": user.full_name,
        "email": user.email,
        "hashed_password": hash_password(user.password),
        "city": user.city,
        "state": user.state,
        "address": user.address,
    }
    new_account = (
        Seller(**account_values, store_name=user.store_name)
        if user.role == "seller"
        else Customer(**account_values)
    )

    try:
        db.add(new_account)
        db.commit()
        db.refresh(new_account)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to register account",
        )

    return {
        "id": new_account.id,
        "full_name": new_account.full_name,
        "email": new_account.email,
        "city": new_account.city,
        "state": new_account.state,
        "address": new_account.address,
        "role": user.role,
        "store_name": new_account.store_name if user.role == "seller" else None,
    }


@router.post("/login", response_model=TokenResponse)
def login_user(login_data: LoginRequest, db: Session = Depends(get_db)):
    account_model = Seller if login_data.role == "seller" else Customer
    account = (
        db.query(account_model)
        .filter(account_model.email == login_data.email)
        .first()
    )

    if account is None or not verify_password(
        login_data.password, account.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    access_token = create_acess_token(account.id, login_data.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }