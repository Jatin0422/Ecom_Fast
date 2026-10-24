from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.models import Customer, Seller

router = APIRouter(prefix="/seller", tags=["Seller"])


@router.get("/dashboard")
def get_seller_dashboard(
    current_account: Customer | Seller = Depends(get_current_user),
):
    if not isinstance(current_account, Seller):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seller access required",
        )

    return {
        "store_name": current_account.store_name,
    }
