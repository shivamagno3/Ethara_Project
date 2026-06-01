from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from decimal import Decimal
from app import models, schemas

class InsufficientStockException(Exception):
    def __init__(self, product_name: str, requested: int, available: int):
        self.product_name = product_name
        self.requested = requested
        self.available = available
        super().__init__(f"Insufficient stock for '{product_name}'. Requested {requested}, available {available}.")

class EntityNotFoundException(Exception):
    pass


def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).order_by(models.Product.id.desc()).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(
        product_name=product.product_name,
        sku=product.sku,
        price=product.price,
        quantity_in_stock=product.quantity_in_stock
    )
    db.add(db_product)
    try:
        db.commit()
        db.refresh(db_product)
        return db_product
    except IntegrityError as e:
        db.rollback()
        raise e

def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    
    update_data = product_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    try:
        db.commit()
        db.refresh(db_product)
        return db_product
    except IntegrityError as e:
        db.rollback()
        raise e

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        return False
    try:
        db.delete(db_product)
        db.commit()
        return True
    except IntegrityError as e:
        db.rollback()
        raise e


def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).order_by(models.Customer.id.desc()).offset(skip).limit(limit).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    db_customer = models.Customer(
        full_name=customer.full_name,
        email=customer.email,
        phone_number=customer.phone_number
    )
    db.add(db_customer)
    try:
        db.commit()
        db.refresh(db_customer)
        return db_customer
    except IntegrityError as e:
        db.rollback()
        raise e

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        return False
    try:
        db.delete(db_customer)
        db.commit()
        return True
    except IntegrityError as e:
        db.rollback()
        raise e


def get_order(db: Session, order_id: int):
    order = db.query(models.Order).options(
        joinedload(models.Order.customer),
        joinedload(models.Order.items).joinedload(models.OrderItem.product)
    ).filter(models.Order.id == order_id).first()
    
    if order:
        order.customer_name = order.customer.full_name
        for item in order.items:
            item.product_name = item.product.product_name
    return order

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    orders = db.query(models.Order).options(
        joinedload(models.Order.customer),
        joinedload(models.Order.items).joinedload(models.OrderItem.product)
    ).order_by(models.Order.id.desc()).offset(skip).limit(limit).all()
    
    for o in orders:
        o.customer_name = o.customer.full_name
        for item in o.items:
            item.product_name = item.product.product_name
    return orders

def create_order(db: Session, order_in: schemas.OrderCreate):
    customer = get_customer(db, order_in.customer_id)
    if not customer:
        raise EntityNotFoundException(f"Customer with ID {order_in.customer_id} does not exist.")

    items_to_create = []
    total_amount = Decimal("0.00")
    
    for item_in in order_in.items:
        product = get_product(db, item_in.product_id)
        if not product:
            raise EntityNotFoundException(f"Product with ID {item_in.product_id} does not exist.")
        
        if product.quantity_in_stock < item_in.quantity:
            raise InsufficientStockException(
                product_name=product.product_name,
                requested=item_in.quantity,
                available=product.quantity_in_stock
            )
        
        line_price = product.price * Decimal(item_in.quantity)
        total_amount += line_price
        
        items_to_create.append({
            "product": product,
            "quantity": item_in.quantity,
            "unit_price": product.price
        })

    try:
        db_order = models.Order(
            customer_id=order_in.customer_id,
            total_amount=total_amount
        )
        db.add(db_order)
        db.flush()

        for item in items_to_create:
            product = item["product"]
            quantity = item["quantity"]
            unit_price = item["unit_price"]

            product.quantity_in_stock -= quantity
            db.add(product)

            db_item = models.OrderItem(
                order_id=db_order.id,
                product_id=product.id,
                quantity=quantity,
                unit_price=unit_price
            )
            db.add(db_item)

        db.commit()
        return get_order(db, db_order.id)

    except Exception as e:
        db.rollback()
        raise e

def delete_order(db: Session, order_id: int):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        return False
    
    try:
        for item in db_order.items:
            product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            if product:
                product.quantity_in_stock += item.quantity
                db.add(product)
        
        db.delete(db_order)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise e


def get_dashboard_metrics(db: Session):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    
    low_stock_query = db.query(models.Product).filter(models.Product.quantity_in_stock < 10)
    low_stock_count = low_stock_query.count()
    low_stock_items = low_stock_query.order_by(models.Product.quantity_in_stock.asc()).all()

    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_products_count": low_stock_count,
        "low_stock_products": low_stock_items
    }