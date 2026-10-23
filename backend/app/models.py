from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base,engine

class User(Base):
    __tablename__='users'

    id:Mapped[int]=mapped_column(
        primary_key=True,
        index=True
    )
    full_name:Mapped[str]= mapped_column(
        String(100),
        nullable=False 
    )
    email:Mapped[str]=mapped_column(
        String(300),
        unique=True,
        index=True,
        nullable=False 
    )
    hashed_password:Mapped[str]=mapped_column(
        String(255),
        nullable=False
    )
    state:Mapped['str']=mapped_column(
            String(100),
            nullable=False 
        )
    role:Mapped['str']=mapped_column(
        String(20),
        nullable=False
    )
    city:Mapped['str']=mapped_column(
        String(100),
        nullable=False 
    )

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")