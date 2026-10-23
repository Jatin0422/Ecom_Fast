from urllib.parse import quote_plus
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker,DeclarativeBase

#SQL connection string

connection_string=(
    'DRIVER={ODBC Driver 18 for SQL Server};'
    'SERVER=LAPTOP-RV4MMQ5P;'
    'DATABASE=EcommerceDB;'
    'Trusted_Connection=yes;'
    'TrustServerCertificate=yes;'
)

# converting ODBC  connection string to sql url

connection_url=(
    'mssql+pyodbc:///?odbc_connect='
    +quote_plus(connection_string)
)

# create sql alchemy engine
engine=create_engine(
    connection_url, echo=True
)

# create a db session factory

sessionLocal=sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)

# base class for db
class Base(DeclarativeBase):
    pass

# provide database session to api routes

def get_db():
    db=sessionLocal()
    try:
        yield db
    finally:
        db.close()

if __name__ == "__main__":
    with engine.connect() as connection:
        result = connection.exec_driver_sql("SELECT DB_NAME()")
        print("Connected database:", result.scalar())