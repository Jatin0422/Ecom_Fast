from sqlalchemy import inspect
from sqlalchemy.orm import Session

from app.database import engine
from app.models import Customer, LegacyUser, Seller


def migrate_accounts() -> int:
    Customer.__table__.create(bind=engine, checkfirst=True)
    Seller.__table__.create(bind=engine, checkfirst=True)

    if not inspect(engine).has_table(LegacyUser.__tablename__):
        return 0

    migrated_count = 0
    with Session(engine, autoflush=False) as db:
        try:
            for legacy_account in db.query(LegacyUser).order_by(LegacyUser.id):
                customer = (
                    db.query(Customer)
                    .filter(Customer.email == legacy_account.email)
                    .first()
                )
                seller = (
                    db.query(Seller)
                    .filter(Seller.email == legacy_account.email)
                    .first()
                )

                if customer or seller:
                    expected_account = (
                        seller
                        if legacy_account.role == "seller"
                        else customer
                        if legacy_account.role in {"user", "customer"}
                        else None
                    )
                    if expected_account is None or (customer and seller):
                        raise ValueError(
                            f"Conflicting account already exists for "
                            f"{legacy_account.email}"
                        )
                    continue

                account_values = {
                    "full_name": legacy_account.full_name,
                    "email": legacy_account.email,
                    "hashed_password": legacy_account.hashed_password,
                    "city": legacy_account.city,
                    "state": legacy_account.state,
                    "address": None,
                }

                if legacy_account.role == "seller":
                    db.add(Seller(**account_values, store_name=None))
                elif legacy_account.role in {"user", "customer"}:
                    db.add(Customer(**account_values))
                else:
                    raise ValueError(
                        f"Unsupported role for legacy account "
                        f"{legacy_account.email}: {legacy_account.role}"
                    )
                migrated_count += 1

            db.commit()
        except Exception:
            db.rollback()
            raise

    return migrated_count


if __name__ == "__main__":
    print(f"Migrated {migrate_accounts()} account(s).")
