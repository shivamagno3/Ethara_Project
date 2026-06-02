from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, OperationalError
from typing import List
import time

from app import models, schemas, crud
from app.database import engine, get_db
from app.crud import InsufficientStockException, EntityNotFoundException

MAX_RETRIES = 5
RETRY_DELAY = 3

for attempt in range(1, MAX_RETRIES + 1):
    try:
        models.Base.metadata.create_all(bind=engine)
        print("Database tables initialized successfully.")
        break
    except OperationalError as e:
        if attempt == MAX_RETRIES:
            print(f"Failed to connect to the database after {MAX_RETRIES} attempts. Exiting.")
            raise e
        print(f"Database connection attempt {attempt}/{MAX_RETRIES} failed. Retrying in {RETRY_DELAY}s...")
        time.sleep(RETRY_DELAY)

app = FastAPI(
    title="Inventory & Order Management System API",
    description="Backend API for managing products, customers, orders, and stocks.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ethara-project-ivory.vercel.app",
        "https://ethara-project-ivory.vercel.app/"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(InsufficientStockException)
async def insufficient_stock_handler(request, exc: InsufficientStockException):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error_type": "INSUFFICIENT_STOCK",
            "message": exc.args[0],
            "product_name": exc.product_name,
            "requested": exc.requested,
            "available": exc.available
        }
    )

@app.exception_handler(EntityNotFoundException)
async def entity_not_found_handler(request, exc: EntityNotFoundException):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "error_type": "NOT_FOUND",
            "message": exc.args[0]
        }
    )


@app.get("/", status_code=status.HTTP_200_OK)
def read_root():
    return {
        "status": "healthy",
        "service": "Inventory & Order Management API",
        "docs_url": "/docs"
    }


@app.get("/dashboard/metrics", response_model=schemas.DashboardMetrics, status_code=status.HTTP_200_OK)
def read_dashboard_metrics(db: Session = Depends(get_db)):
    return crud.get_dashboard_metrics(db)


@app.post("/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_product(db=db, product=product)
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product.sku}' already exists."
        )

@app.get("/products", response_model=List[schemas.ProductResponse], status_code=status.HTTP_200_OK)
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_products(db, skip=skip, limit=limit)

@app.get("/products/{id}", response_model=schemas.ProductResponse, status_code=status.HTTP_200_OK)
def read_product(id: int, db: Session = Depends(get_db)):
    db_product = crud.get_product(db, product_id=id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {id} not found."
        )
    return db_product

@app.put("/products/{id}", response_model=schemas.ProductResponse, status_code=status.HTTP_200_OK)
def update_product(id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db)):
    try:
        db_product = crud.update_product(db=db, product_id=id, product_update=product)
        if not db_product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {id} not found."
            )
        return db_product
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Another product with this SKU already exists."
        )

@app.delete("/products/{id}", status_code=status.HTTP_200_OK)
def delete_product(id: int, db: Session = Depends(get_db)):
    try:
        success = crud.delete_product(db=db, product_id=id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {id} not found."
            )
        return {"message": f"Product {id} deleted successfully."}
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete product because it has active order item references. Clear related orders first."
        )


@app.post("/customers", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_customer(db=db, customer=customer)
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with email '{customer.email}' already exists."
        )

@app.get("/customers", response_model=List[schemas.CustomerResponse], status_code=status.HTTP_200_OK)
def read_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_customers(db, skip=skip, limit=limit)

@app.get("/customers/{id}", response_model=schemas.CustomerResponse, status_code=status.HTTP_200_OK)
def read_customer(id: int, db: Session = Depends(get_db)):
    db_customer = crud.get_customer(db, customer_id=id)
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {id} not found."
        )
    return db_customer

@app.delete("/customers/{id}", status_code=status.HTTP_200_OK)
def delete_customer(id: int, db: Session = Depends(get_db)):
    try:
        success = crud.delete_customer(db=db, customer_id=id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer with ID {id} not found."
            )
        return {"message": f"Customer {id} deleted successfully."}
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete customer because they have active order references. Delete related orders first."
        )


@app.post("/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_order(db=db, order_in=order)
    except InsufficientStockException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.args[0]
        )
    except EntityNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.args[0]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while creating your order: {str(e)}"
        )

@app.get("/orders", response_model=List[schemas.OrderResponse], status_code=status.HTTP_200_OK)
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_orders(db, skip=skip, limit=limit)

@app.get("/orders/{id}", response_model=schemas.OrderResponse, status_code=status.HTTP_200_OK)
def read_order(id: int, db: Session = Depends(get_db)):
    db_order = crud.get_order(db, order_id=id)
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {id} not found."
        )
    return db_order

@app.delete("/orders/{id}", status_code=status.HTTP_200_OK)
def delete_order(id: int, db: Session = Depends(get_db)):
    success = crud.delete_order(db=db, order_id=id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {id} not found."
        )
    return {"message": f"Order {id} cancelled and deleted successfully. Stock levels have been restored."}