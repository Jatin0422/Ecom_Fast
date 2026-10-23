from fastapi import  FastAPI
from app.routers import auth
from fastapi.middleware.cors import CORSMiddleware

app=FastAPI(title='Ecom-app')

app.add_middleware( CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],)

app.include_router(auth.router)

@app.get('/')
def home():
    return {"message": "E-Commerce API is running!"}