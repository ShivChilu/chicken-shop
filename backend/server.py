from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends, Request
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import aiofiles
import httpx
import socketio
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Socket.IO setup
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

# Create the main app
app = FastAPI()

# Create API router with /api prefix
api_router = APIRouter(prefix="/api")

# Ensure directories exist
UPLOAD_DIR = ROOT_DIR / "uploads"
LOGS_DIR = ROOT_DIR / "logs"
UPLOAD_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)

# Mount static files for uploaded images
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    image: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CategoryCreate(BaseModel):
    name: str
    image: str = ""

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    price: float
    category: str
    image: str = ""
    in_stock: bool = True
    description: str = ""
    unit: str = "500g"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProductCreate(BaseModel):
    name: str
    price: float
    category: str
    image: str = ""
    in_stock: bool = True
    description: str = ""
    unit: str = "500g"

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image: Optional[str] = None
    in_stock: Optional[bool] = None
    description: Optional[str] = None
    unit: Optional[str] = None

class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int
    unit: str = "500g"

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    phone: str
    address: str
    pincode: str
    items: List[OrderItem]
    total: float
    status: str = "pending"
    payment_mode: str = "Cash on Delivery"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OrderCreate(BaseModel):
    customer_name: str
    phone: str
    address: str
    pincode: str
    items: List[OrderItem]
    total: float

class OrderStatusUpdate(BaseModel):
    status: str

class Pincode(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    active: bool = True

class PincodeCreate(BaseModel):
    code: str
    active: bool = True

class AdminPinVerify(BaseModel):
    pin: str

# ==================== MIDDLEWARE ====================

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"{datetime.now(timezone.utc).isoformat()} - {request.method} - {request.url.path}")
    response = await call_next(request)
    return response

# ==================== HELPER FUNCTIONS ====================

async def verify_admin_pin(pin: str) -> bool:
    admin_pin = os.environ.get('ADMIN_PIN', '4242')
    return pin == admin_pin

async def send_whatsapp_notification(order: Order):
    """Send WhatsApp notification to admin"""
    phone = os.environ.get('WHATSAPP_PHONE', '+919999999999')
    api_key = os.environ.get('WHATSAPP_API_KEY', 'API_KEY_HERE')
    
    items_text = "\n".join([f"• {item.name} x {item.quantity} ({item.unit}) - ₹{item.price * item.quantity}" for item in order.items])
    
    message = f"""🛒 NEW ORDER RECEIVED!

👤 Customer: {order.customer_name}
📞 Phone: {order.phone}
📍 Address: {order.address}
📮 Pincode: {order.pincode}

📦 Items:
{items_text}

💰 Total: ₹{order.total}
💳 Payment: {order.payment_mode}

Order ID: {order.id}
"""
    
    try:
        encoded_message = message.replace('\n', '%0A').replace(' ', '%20')
        url = f"https://api.callmebot.com/whatsapp.php?phone={phone}&text={encoded_message}&apikey={api_key}"
        
        async with httpx.AsyncClient() as client:
            await client.get(url, timeout=10)
            logger.info(f"WhatsApp notification sent for order {order.id}")
    except Exception as e:
        logger.error(f"Failed to send WhatsApp notification: {e}")

async def log_order_to_file(order: Order):
    """Append order to logs/orders.txt"""
    log_file = LOGS_DIR / "orders.txt"
    
    items_text = ", ".join([f"{item.name} x {item.quantity}" for item in order.items])
    log_entry = f"""
================================================================================
Order ID: {order.id}
Date: {order.created_at}
Customer: {order.customer_name}
Phone: {order.phone}
Address: {order.address}, Pincode: {order.pincode}
Items: {items_text}
Total: ₹{order.total}
Payment: {order.payment_mode}
Status: {order.status}
================================================================================
"""
    
    async with aiofiles.open(log_file, mode='a') as f:
        await f.write(log_entry)

# ==================== ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Fresh Meat Hub API"}

# ---------- Admin Authentication ----------

@api_router.post("/admin/verify")
async def verify_admin(data: AdminPinVerify):
    if await verify_admin_pin(data.pin):
        return {"success": True, "message": "PIN verified"}
    raise HTTPException(status_code=401, detail="Invalid PIN")

# ---------- Categories ----------

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

@api_router.post("/categories", response_model=Category)
async def create_category(category: CategoryCreate):
    cat_obj = Category(**category.model_dump())
    doc = cat_obj.model_dump()
    await db.categories.insert_one(doc)
    return cat_obj

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"success": True}

# ---------- Products ----------

@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate):
    prod_obj = Product(**product.model_dump())
    doc = prod_obj.model_dump()
    await db.products.insert_one(doc)
    return prod_obj

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product: ProductUpdate):
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = {k: v for k, v in product.model_dump().items() if v is not None}
    if update_data:
        await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return updated

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True}

# ---------- Image Upload ----------

@api_router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    file_ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = UPLOAD_DIR / filename
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    return {"filename": filename, "url": f"/uploads/{filename}"}

# ---------- Orders ----------

@api_router.get("/orders", response_model=List[Order])
async def get_orders(date: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if date:
        query["created_at"] = {"$regex": f"^{date}"}
    if status:
        query["status"] = status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    order_obj = Order(**order.model_dump())
    doc = order_obj.model_dump()
    
    # Convert items to dict
    doc['items'] = [item.model_dump() for item in order_obj.items]
    
    await db.orders.insert_one(doc)
    
    # Log order to file
    await log_order_to_file(order_obj)
    
    # Send WhatsApp notification
    await send_whatsapp_notification(order_obj)
    
    # Emit socket event for real-time notification
    await sio.emit('orderPlaced', doc)
    
    return order_obj

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status_update: OrderStatusUpdate):
    valid_statuses = ["pending", "confirmed", "packed", "out_for_delivery", "completed", "cancelled"]
    if status_update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status_update.status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Emit socket event for status update
    await sio.emit('orderStatusUpdated', {"order_id": order_id, "status": status_update.status})
    
    return {"success": True, "status": status_update.status}

# ---------- Pincodes ----------

@api_router.get("/pincodes", response_model=List[Pincode])
async def get_pincodes():
    pincodes = await db.pincodes.find({}, {"_id": 0}).to_list(100)
    return pincodes

@api_router.post("/pincodes", response_model=Pincode)
async def create_pincode(pincode: PincodeCreate):
    existing = await db.pincodes.find_one({"code": pincode.code})
    if existing:
        raise HTTPException(status_code=400, detail="Pincode already exists")
    
    pin_obj = Pincode(**pincode.model_dump())
    doc = pin_obj.model_dump()
    await db.pincodes.insert_one(doc)
    return pin_obj

@api_router.delete("/pincodes/{pincode_id}")
async def delete_pincode(pincode_id: str):
    result = await db.pincodes.delete_one({"id": pincode_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pincode not found")
    return {"success": True}

@api_router.get("/pincodes/verify/{code}")
async def verify_pincode(code: str):
    pincode = await db.pincodes.find_one({"code": code, "active": True}, {"_id": 0})
    return {"valid": pincode is not None}

# ---------- Initialize Default Data ----------

@api_router.post("/init-data")
async def init_data():
    """Initialize default categories and pincodes"""
    # Check if already initialized
    existing_cats = await db.categories.count_documents({})
    if existing_cats > 0:
        return {"message": "Data already initialized"}
    
    # Default categories
    default_categories = [
        {"id": str(uuid.uuid4()), "name": "Chicken", "image": "https://images.unsplash.com/photo-1682991136736-a2b44623eeba?w=400", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Mutton", "image": "https://images.unsplash.com/photo-1708974140638-8554bc01690d?w=400", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Others", "image": "https://images.unsplash.com/photo-1627038259646-04600f5167a3?w=400", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    # Default pincodes
    default_pincodes = [
        {"id": str(uuid.uuid4()), "code": "500001", "active": True},
        {"id": str(uuid.uuid4()), "code": "500002", "active": True},
        {"id": str(uuid.uuid4()), "code": "500003", "active": True},
        {"id": str(uuid.uuid4()), "code": "500004", "active": True},
    ]
    
    # Default products
    default_products = [
        {"id": str(uuid.uuid4()), "name": "Chicken Breast", "price": 280, "category": "Chicken", "image": "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400", "in_stock": True, "description": "Boneless chicken breast, tender and fresh", "unit": "500g", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Chicken Curry Cut", "price": 220, "category": "Chicken", "image": "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400", "in_stock": True, "description": "Fresh curry cut chicken pieces with bone", "unit": "500g", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Chicken Wings", "price": 200, "category": "Chicken", "image": "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400", "in_stock": True, "description": "Fresh chicken wings, perfect for frying", "unit": "500g", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Chicken Drumsticks", "price": 240, "category": "Chicken", "image": "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400", "in_stock": True, "description": "Juicy chicken drumsticks", "unit": "500g", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Mutton Curry Cut", "price": 650, "category": "Mutton", "image": "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400", "in_stock": True, "description": "Premium goat meat curry cut with bone", "unit": "500g", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Mutton Boneless", "price": 800, "category": "Mutton", "image": "https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=400", "in_stock": True, "description": "Tender boneless mutton pieces", "unit": "500g", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Mutton Keema", "price": 700, "category": "Mutton", "image": "https://images.unsplash.com/photo-1599921841143-819065a55cc6?w=400", "in_stock": True, "description": "Fresh minced mutton", "unit": "500g", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Fish Fillet", "price": 450, "category": "Others", "image": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400", "in_stock": True, "description": "Fresh boneless fish fillet", "unit": "500g", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Prawns", "price": 550, "category": "Others", "image": "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400", "in_stock": True, "description": "Fresh medium-sized prawns", "unit": "500g", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Eggs (12 pcs)", "price": 90, "category": "Others", "image": "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400", "in_stock": True, "description": "Farm fresh eggs, pack of 12", "unit": "12 pcs", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    await db.categories.insert_many(default_categories)
    await db.pincodes.insert_many(default_pincodes)
    await db.products.insert_many(default_products)
    
    return {"message": "Data initialized successfully"}

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Socket.IO events
@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")

# Mount Socket.IO
socket_app = socketio.ASGIApp(sio, app)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
