from pwdlib import PasswordHash
import os
from datetime import datetime,timedelta,timezone
import jwt 
from dotenv import load_dotenv

load_dotenv()

password_hash=PasswordHash.recommended()

def hash_password(password:str)->str:
    return password_hash.hash(password)

def verify_password(plain_password:str, hashed_password:str)->bool:
    return password_hash.verify(plain_password, hashed_password)

# for login

SECRET_KEY=os.getenv('JWT_SECRET_KEY')

if not SECRET_KEY:
    raise RuntimeError('JWT secret key is not valid')

ALGORITHM='HS256'
ACESS_TOKEN_EXPIRY_MINUTES=30

def create_acess_token(user_id: int, role: str) -> str:
    expires_at=datetime.now(timezone.utc)+timedelta(minutes=ACESS_TOKEN_EXPIRY_MINUTES)

    payload={
        'sub':str(user_id),
        'role':role,
        'exp':expires_at
    }
    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

def decode_acess_token(token:str)->dict:
    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM],
        options={"require": ["sub", "role", "exp"]}
    )