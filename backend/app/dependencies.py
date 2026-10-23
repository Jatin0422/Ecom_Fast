from fastapi import Depends,HTTPException,status
from sqlalchemy.orm import Session
from fastapi.security import HTTPAuthorizationCredentials,HTTPBearer
from jwt.exceptions import InvalidTokenError

from app.models import User
from app.security import decode_acess_token
from app.database import get_db

bearer_scheme=HTTPBearer(auto_error=False)

def get_current_user(
        credentials:HTTPAuthorizationCredentials | None= Depends(bearer_scheme),
        db:Session= Depends(get_db)
)->User:
        #1 checking whether there is a bearer token or not
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail='unauthorized')
    #2 verify the token and it's payload
    try:
        payload=decode_acess_token(credentials.credentials)
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail='invalid token')
    #3 Extract the user id from the token
    user_id=payload.get('sub')
    if not isinstance(user_id,str):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail='invalid payload')
    try:
        user_id=int(user_id)
    except ValueError:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    # 4 finding the user in database

    current_user=db.get(User,user_id)
    if current_user is None:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return current_user