from fastapi import APIRouter,status,Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas import UserRegister,UserResponse,LoginRequest,TokenResponse
from app.models import User
from app.security import hash_password,create_acess_token,verify_password
from app.database import get_db

router=APIRouter(prefix='/auth',tags=['Authentication'])

@router.post('/register',response_model=UserResponse)
def user_register(user:UserRegister,db:Session=Depends(get_db)):

    existing_user=(
        db.query(User).filter(User.email==user.email).first()
    )
    if existing_user:
        raise HTTPException(
            status_code= status.HTTP_409_CONFLICT,
            detail='Email already registered'
        )
    hashed_password=hash_password(user.password)
    new_user=User(
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        hashed_password=hashed_password,
        city=user.city,
        state=user.state
    )
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to register user"
        )
        
    return new_user

@router.post('/login',response_model=TokenResponse)
def login_user(login_data:LoginRequest,db:Session=Depends(get_db)):

    user=db.query(User).filter(User.email==login_data.email).first()

    if user is None or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail='invalid email or password')
    access_token=create_acess_token(user.id)
    return {
        'access_token':access_token,
        'token_type':'bearer'
    }