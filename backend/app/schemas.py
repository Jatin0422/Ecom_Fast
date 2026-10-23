from typing import Literal

from pydantic import BaseModel, EmailStr, Field

class UserRegister(BaseModel):
    full_name:str=Field(min_length=2,max_length=100 )
    email:EmailStr
    password:str=Field(min_length=8,max_length=16)
    role: Literal["seller", "user"]
    city:str=Field(min_length=1, max_length=100)
    state:str=Field(min_length=1, max_length=100)

# data to be responded to the user

class  UserResponse(BaseModel):
    id:int
    full_name:str
    email:EmailStr
    city:str
    state:str
    model_config={'from_attributes':True}

#

class LoginRequest(BaseModel):
    email:EmailStr
    password:str=Field(min_length=8,max_length=16)

class TokenResponse(BaseModel):
    access_token:str
    token_type:str='bearer'