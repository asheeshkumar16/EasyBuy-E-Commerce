from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import random
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator, EmailStr
from typing import List, Optional, Annotated
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

PyObjectId = Annotated[str, BeforeValidator(str)]


class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: PyObjectId = Field(default_factory=lambda: str(ObjectId()), alias="_id")

    def to_mongo(self):
        doc = self.model_dump(by_alias=True)
        doc["_id"] = ObjectId(doc["_id"])
        return doc

    @classmethod
    def from_mongo(cls, doc):
        return cls(**doc)


# ---------------- Products ----------------
class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    price: float
    compareAt: Optional[float] = None
    gender: str
    category: str
    tags: List[str] = []
    colors: List[str] = []
    sizes: List[str] = []
    image: str
    description: str


SEED_PRODUCTS = [
    {"id": "w1", "name": "The Oversized Camel Coat", "price": 189, "compareAt": 229, "gender": "women", "category": "Outerwear", "tags": ["featured", "trending"], "colors": ["Camel"], "sizes": ["XS", "S", "M", "L", "XL"], "image": "/images/p-w1.jpg", "description": "A sculptural oversized coat cut from double-faced camel wool. Dropped shoulders, hidden placket, and a silhouette that moves between seasons with ease."},
    {"id": "w2", "name": "Ivory Silk Slip Dress", "price": 129, "gender": "women", "category": "Dresses", "tags": ["featured", "new"], "colors": ["Ivory"], "sizes": ["XS", "S", "M", "L", "XL"], "image": "/images/p-w2.jpg", "description": "Bias-cut silk slip with a fluid drape and delicate straps. Wears alone in summer, layers under tailoring in winter."},
    {"id": "w3", "name": "Double-Breasted Blazer", "price": 149, "gender": "women", "category": "Tailoring", "tags": ["trending"], "colors": ["Black"], "sizes": ["XS", "S", "M", "L", "XL"], "image": "/images/p-w3.jpg", "description": "Sharp double-breasted blazer in a structured wool blend. Peak lapels, horn-effect buttons, endless ways to wear."},
    {"id": "w4", "name": "Chunky Cable Knit", "price": 89, "gender": "women", "category": "Knitwear", "tags": ["new"], "colors": ["Cream"], "sizes": ["XS", "S", "M", "L", "XL"], "image": "/images/p-w4.jpg", "description": "Hand-feel first. A chunky cable-knit spun from a soft wool blend with a relaxed, borrowed-from-him fit."},
    {"id": "w5", "name": "Wide-Leg Pleated Trousers", "price": 99, "compareAt": 119, "gender": "women", "category": "Trousers", "tags": ["featured", "trending"], "colors": ["Charcoal"], "sizes": ["XS", "S", "M", "L", "XL"], "image": "/images/p-w5.jpg", "description": "High-rise, wide-leg trousers with a single front pleat. Tailored to pool just above the shoe."},
    {"id": "w6", "name": "Poplin Oversized Shirt", "price": 69, "gender": "women", "category": "Shirts", "tags": ["new"], "colors": ["White"], "sizes": ["XS", "S", "M", "L", "XL"], "image": "/images/p-w6.jpg", "description": "Crisp cotton poplin shirt with an oversized cut and elongated cuffs. The hardest-working piece in the wardrobe."},
    {"id": "w7", "name": "Pleated Midi Skirt", "price": 79, "gender": "women", "category": "Skirts", "tags": ["new"], "colors": ["Black"], "sizes": ["XS", "S", "M", "L", "XL"], "image": "/images/p-w7.jpg", "description": "Knife-pleated midi skirt with fluid movement and a clean waistband. Day to dinner without a second thought."},
    {"id": "w8", "name": "Ribbed Cashmere Cardigan", "price": 139, "gender": "women", "category": "Knitwear", "tags": ["featured"], "colors": ["Beige"], "sizes": ["XS", "S", "M", "L", "XL"], "image": "/images/p-w8.jpg", "description": "Rib-knit cardigan in pure cashmere with corozo buttons. Soft enough to sleep in, sharp enough to leave the house in."},
    {"id": "m1", "name": "Single-Breasted Overcoat", "price": 199, "gender": "men", "category": "Outerwear", "tags": ["featured", "trending"], "colors": ["Beige"], "sizes": ["S", "M", "L", "XL", "XXL"], "image": "/images/p-m1.jpg", "description": "A clean single-breasted overcoat in brushed wool. Minimal lapels, welt pockets, cut to layer over knitwear."},
    {"id": "m2", "name": "Relaxed Linen Shirt", "price": 59, "gender": "men", "category": "Shirts", "tags": ["new"], "colors": ["White"], "sizes": ["S", "M", "L", "XL", "XXL"], "image": "/images/p-m2.jpg", "description": "Garment-washed European linen with a relaxed collar and easy drape. Breathes through the warmest days."},
    {"id": "m3", "name": "Tailored Wool Trousers", "price": 109, "gender": "men", "category": "Trousers", "tags": ["trending"], "colors": ["Grey"], "sizes": ["S", "M", "L", "XL", "XXL"], "image": "/images/p-m3.jpg", "description": "Straight-leg tailored trousers in a mid-weight wool blend with a pressed crease and clean hem."},
    {"id": "m4", "name": "Leather Biker Jacket", "price": 249, "compareAt": 299, "gender": "men", "category": "Outerwear", "tags": ["featured", "trending"], "colors": ["Black"], "sizes": ["S", "M", "L", "XL", "XXL"], "image": "/images/p-m4.jpg", "description": "Full-grain leather biker with matte hardware and a quilted lining. Breaks in beautifully, lasts decades."},
    {"id": "m5", "name": "Merino Crewneck", "price": 79, "gender": "men", "category": "Knitwear", "tags": ["new"], "colors": ["Navy"], "sizes": ["S", "M", "L", "XL", "XXL"], "image": "/images/p-m5.jpg", "description": "Extra-fine merino crewneck knitted for a clean, itch-free finish. The year-round layer."},
    {"id": "m6", "name": "Washed Denim Jacket", "price": 119, "gender": "men", "category": "Denim", "tags": ["new"], "colors": ["Indigo"], "sizes": ["S", "M", "L", "XL", "XXL"], "image": "/images/p-m6.jpg", "description": "Rigid denim jacket stonewashed to a lived-in indigo. Boxy fit, copper shanks, zero fuss."},
    {"id": "m7", "name": "Pleated Chino Trousers", "price": 89, "gender": "men", "category": "Trousers", "tags": ["featured"], "colors": ["Stone"], "sizes": ["S", "M", "L", "XL", "XXL"], "image": "/images/p-m7.jpg", "description": "Double-pleated chinos in brushed cotton twill with a tapered leg. Smart without trying."},
    {"id": "m8", "name": "Minimal Leather Sneakers", "price": 99, "gender": "men", "category": "Footwear", "tags": ["new", "trending"], "colors": ["White"], "sizes": ["40", "41", "42", "43", "44", "45"], "image": "/images/p-m8.jpg", "description": "Minimal cupsole sneakers in full-grain white leather with a tonal stitch. Goes with everything you own."},
]


# ---------------- Cart ----------------
class CartItem(BaseModel):
    product_id: str
    size: str
    qty: int = Field(ge=1)


class CartItemPatch(BaseModel):
    product_id: str
    size: str
    qty: int = Field(ge=0)


class CartDocument(BaseDocument):
    items: List[CartItem] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ---------------- Orders ----------------
class Customer(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    address: str
    city: str
    zip: str
    country: str


class OrderLine(BaseModel):
    product_id: str
    name: str
    price: float
    image: str
    size: str
    qty: int


class OrderDocument(BaseDocument):
    order_number: str
    customer: Customer
    items: List[OrderLine]
    subtotal: float
    shipping: float
    total: float
    status: str = "confirmed"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class OrderCreate(BaseModel):
    cart_id: str
    customer: Customer


# ---------------- Helpers ----------------
def shipping_for(subtotal: float) -> float:
    return 0.0 if subtotal == 0 or subtotal >= 150 else 9.0


async def cart_view(cart: CartDocument):
    ids = [i.product_id for i in cart.items]
    prods = await db.products.find({"id": {"$in": ids}}, {"_id": 0}).to_list(200) if ids else []
    pmap = {p["id"]: p for p in prods}
    enriched = []
    subtotal = 0.0
    for i in cart.items:
        p = pmap.get(i.product_id)
        if not p:
            continue
        subtotal += p["price"] * i.qty
        enriched.append({"product_id": i.product_id, "size": i.size, "qty": i.qty, "product": p})
    shipping = shipping_for(subtotal)
    return {"cart_id": cart.id, "items": enriched, "subtotal": round(subtotal, 2), "shipping": shipping, "total": round(subtotal + shipping, 2)}


async def load_cart(cart_id: str) -> CartDocument:
    try:
        oid = ObjectId(cart_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Cart not found")
    doc = await db.carts.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Cart not found")
    return CartDocument.from_mongo(doc)


# ---------------- Routes ----------------
@api_router.get("/")
async def root():
    return {"message": "EasyBuy API"}


@api_router.get("/products", response_model=List[Product])
async def list_products(gender: Optional[str] = None, tag: Optional[str] = None,
                        category: Optional[str] = None, q: Optional[str] = None,
                        sort: str = "featured"):
    query = {}
    if gender and gender != "all":
        query["gender"] = gender
    if tag:
        query["tags"] = tag
    if category:
        query["category"] = category
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"category": {"$regex": q, "$options": "i"}},
            {"gender": {"$regex": q, "$options": "i"}},
        ]
    docs = await db.products.find(query, {"_id": 0}).to_list(500)
    if sort == "low":
        docs.sort(key=lambda d: d["price"])
    elif sort == "high":
        docs.sort(key=lambda d: -d["price"])
    elif sort == "new":
        docs.sort(key=lambda d: 0 if "new" in d["tags"] else 1)
    else:
        docs.sort(key=lambda d: 0 if "featured" in d["tags"] else 1)
    return docs


@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return doc


@api_router.post("/carts")
async def create_cart():
    cart = CartDocument()
    await db.carts.insert_one(cart.to_mongo())
    return await cart_view(cart)


@api_router.get("/carts/{cart_id}")
async def get_cart(cart_id: str):
    cart = await load_cart(cart_id)
    return await cart_view(cart)


@api_router.post("/carts/{cart_id}/items")
async def add_cart_item(cart_id: str, item: CartItem):
    cart = await load_cart(cart_id)
    if not await db.products.count_documents({"id": item.product_id}):
        raise HTTPException(status_code=404, detail="Product not found")
    items = [i.model_dump() for i in cart.items]
    for it in items:
        if it["product_id"] == item.product_id and it["size"] == item.size:
            it["qty"] += item.qty
            break
    else:
        items.append(item.model_dump())
    await db.carts.update_one({"_id": ObjectId(cart.id)}, {"$set": {"items": items}})
    return await cart_view(CartDocument(id=cart.id, items=items))


@api_router.patch("/carts/{cart_id}/items")
async def set_cart_item_qty(cart_id: str, patch: CartItemPatch):
    cart = await load_cart(cart_id)
    items = [i.model_dump() for i in cart.items]
    found = False
    for it in items:
        if it["product_id"] == patch.product_id and it["size"] == patch.size:
            it["qty"] = patch.qty
            found = True
            break
    if not found and patch.qty > 0:
        if not await db.products.count_documents({"id": patch.product_id}):
            raise HTTPException(status_code=404, detail="Product not found")
        items.append(patch.model_dump())
    items = [it for it in items if it["qty"] > 0]
    await db.carts.update_one({"_id": ObjectId(cart.id)}, {"$set": {"items": items}})
    return await cart_view(CartDocument(id=cart.id, items=items))


@api_router.delete("/carts/{cart_id}")
async def clear_cart(cart_id: str):
    cart = await load_cart(cart_id)
    await db.carts.update_one({"_id": ObjectId(cart.id)}, {"$set": {"items": []}})
    return await cart_view(CartDocument(id=cart.id, items=[]))


@api_router.post("/orders")
async def place_order(payload: OrderCreate):
    cart = await load_cart(payload.cart_id)
    view = await cart_view(cart)
    if not view["items"]:
        raise HTTPException(status_code=400, detail="Cart is empty")
    lines = [
        OrderLine(product_id=it["product_id"], name=it["product"]["name"], price=it["product"]["price"],
                  image=it["product"]["image"], size=it["size"], qty=it["qty"])
        for it in view["items"]
    ]
    while True:
        number = f"EB-{random.randint(100000, 999999)}"
        if not await db.orders.count_documents({"order_number": number}):
            break
    order = OrderDocument(order_number=number, customer=payload.customer, items=lines,
                          subtotal=view["subtotal"], shipping=view["shipping"], total=view["total"])
    await db.orders.insert_one(order.to_mongo())
    await db.carts.update_one({"_id": ObjectId(cart.id)}, {"$set": {"items": []}})
    return order.model_dump()


@api_router.get("/orders/{order_number}")
async def get_order(order_number: str):
    doc = await db.orders.find_one({"order_number": order_number})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderDocument.from_mongo(doc).model_dump()


@app.on_event("startup")
async def seed_database():
    await db.products.create_index("id", unique=True)
    await db.orders.create_index("order_number", unique=True)
    if await db.products.count_documents({}) == 0:
        await db.products.insert_many(SEED_PRODUCTS)
        logger.info("Seeded %d products", len(SEED_PRODUCTS))


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()