from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import re
import logging
import random
import secrets
import ipaddress
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator, EmailStr
from typing import List, Optional, Annotated
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ["EMERGENT_EMAIL_KEY"]
EMAIL_FROM_NAME = os.environ["EMAIL_FROM_NAME"]
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")

app = FastAPI()
api_router = APIRouter(prefix="/api")

logger = logging.getLogger(__name__)

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


# ---------------- Auth ----------------
JWT_ALGORITHM = "HS256"


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=15), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, user_id: str, email: str):
    response.set_cookie(key="access_token", value=create_access_token(user_id, email), httponly=True, secure=True, samesite="none", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=create_refresh_token(user_id), httponly=True, secure=True, samesite="none", max_age=604800, path="/")


def extract_token(request: Request) -> Optional[str]:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    return token


async def get_current_user(request: Request) -> dict:
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return {"id": str(user["_id"]), "email": user["email"], "name": user.get("name", ""), "role": user.get("role", "customer")}


async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


async def check_lockout(identifier: str):
    rec = await db.login_attempts.find_one({"identifier": identifier})
    if rec and rec.get("count", 0) >= 5:
        if datetime.now(timezone.utc) - datetime.fromisoformat(rec["last_attempt"]) < timedelta(minutes=15):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")


async def record_failed_attempt(identifier: str):
    await db.login_attempts.update_one(
        {"identifier": identifier},
        {"$inc": {"count": 1}, "$set": {"last_attempt": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )


# ---------------- Email (managed Resend) ----------------
_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan(); scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str, reply_to: Optional[str] = None) -> Optional[str]:
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if reply_to or EMAIL_REPLY_TO:
        payload["contact_email"] = reply_to or EMAIL_REPLY_TO
    try:
        async with httpx.AsyncClient(timeout=30) as http:
            resp = await http.post(f"{EMAIL_BASE_URL}/api/v1/email/send", headers={"X-Email-Key": EMAIL_KEY}, json=payload)
        resp.raise_for_status()
        return resp.json().get("id")
    except Exception as e:
        logger.error("Email send failed: %s", str(e)[:200])
        return None


def order_email_html(order: dict) -> str:
    ship_label = "Free" if order["shipping"] == 0 else "$%.0f" % order["shipping"]
    rows = ""
    for it in order["items"]:
        rows += (
            f'<tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px">{escape(it["name"])} '
            f'<span style="color:#888;font-size:12px">— Size {escape(it["size"])} × {it["qty"]}</span></td>'
            f'<td align="right" style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px">${it["price"] * it["qty"]:.0f}</td></tr>'
        )
    return (
        '<table role="presentation" width="100%" style="max-width:560px;margin:0 auto;font-family:Arial,sans-serif;color:#0A0A0A">'
        f'<tr><td style="padding:32px 24px;border-bottom:2px solid #0A0A0A"><span style="font-size:20px;font-weight:800;letter-spacing:6px">EASYBUY</span></td></tr>'
        f'<tr><td style="padding:24px"><p style="font-size:15px">Hi {escape(order["customer"]["first_name"])}, thank you — your order is confirmed and being prepared.</p>'
        f'<p style="font-size:13px;color:#555">Order <strong>{escape(order["order_number"])}</strong></p></td></tr>'
        f'<tr><td style="padding:0 24px"><table width="100%">{rows}</table></td></tr>'
        f'<tr><td style="padding:16px 24px"><table width="100%" style="font-size:14px">'
        f'<tr><td style="color:#555">Subtotal</td><td align="right">${order["subtotal"]:.0f}</td></tr>'
        f'<tr><td style="color:#555">Shipping</td><td align="right">{ship_label}</td></tr>'
        f'<tr><td style="font-weight:700;padding-top:8px;border-top:1px solid #0A0A0A">Total</td><td align="right" style="font-weight:700;padding-top:8px;border-top:1px solid #0A0A0A">${order["total"]:.0f}</td></tr>'
        f'</table></td></tr>'
        f'<tr><td style="padding:8px 24px 24px"><a href="{escape(FRONTEND_URL)}/orders" style="display:inline-block;background:#0A0A0A;color:#ffffff;padding:12px 28px;font-size:12px;letter-spacing:3px;text-decoration:none">VIEW YOUR ORDERS</a></td></tr>'
        f'<tr><td style="padding:16px 24px;border-top:1px solid #eee;font-size:11px;color:#999">Sent by {escape(EMAIL_FROM_NAME)}. We never ask for your password or card details by email.</td></tr>'
        '</table>'
    )


async def send_order_email(order: dict):
    subject = f"EasyBuy order {order['order_number']} confirmed"
    return await send_email(to=order["customer"]["email"], subject=subject, html=order_email_html(order))


# ---------------- Models ----------------
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
    user_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


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
    user_id: Optional[str] = None
    cart_id: Optional[str] = None
    status: str = "awaiting_payment"
    paid_at: Optional[str] = None
    email_sent: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class OrderCreate(BaseModel):
    cart_id: str
    customer: Customer


class MergeRequest(BaseModel):
    cart_id: Optional[str] = None


class WishlistToggle(BaseModel):
    product_id: str


class WishlistSync(BaseModel):
    product_ids: List[str] = []


class PaymentCheckoutRequest(BaseModel):
    order_number: str
    origin_url: str


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


async def mark_order_paid(session_id: str):
    tx = await db.payment_transactions.find_one({"session_id": session_id})
    if not tx:
        return None
    if tx.get("payment_status") != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id, "payment_status": {"$ne": "paid"}},
            {"$set": {"status": "completed", "payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}},
        )
    order = await db.orders.find_one({"order_number": tx["order_number"]})
    if not order:
        return None
    if order.get("status") != "paid":
        await db.orders.update_one(
            {"order_number": tx["order_number"]},
            {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}},
        )
        if tx.get("cart_id"):
            try:
                await db.carts.update_one({"_id": ObjectId(tx["cart_id"])}, {"$set": {"items": []}})
            except Exception:
                pass
    if not order.get("email_sent"):
        email_id = await send_order_email(order)
        if email_id:
            await db.orders.update_one({"order_number": tx["order_number"]}, {"$set": {"email_sent": True}})
            logger.info("Order confirmation email %s sent for %s", email_id, tx["order_number"])
    return await db.orders.find_one({"order_number": tx["order_number"]}, {"_id": 0})


# ---------------- Root & Products ----------------
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


# ---------------- Auth routes ----------------
@api_router.post("/auth/register")
async def register(payload: RegisterRequest, response: Response):
    email = payload.email.lower()
    if await db.users.count_documents({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {"email": email, "password_hash": hash_password(payload.password), "name": payload.name.strip(),
           "role": "customer", "created_at": datetime.now(timezone.utc).isoformat()}
    result = await db.users.insert_one(doc)
    user_id = str(result.inserted_id)
    set_auth_cookies(response, user_id, email)
    return {"id": user_id, "email": email, "name": doc["name"], "role": "customer"}


@api_router.post("/auth/login")
async def login(payload: LoginRequest, request: Request, response: Response):
    email = payload.email.lower()
    identifier = f"{request.client.host if request.client else 'unknown'}:{email}"
    await check_lockout(identifier)
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        await record_failed_attempt(identifier)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    user_id = str(user["_id"])
    set_auth_cookies(response, user_id, email)
    return {"id": user_id, "email": email, "name": user.get("name", ""), "role": user.get("role", "customer")}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    response.set_cookie(key="access_token", value=create_access_token(str(user["_id"]), user["email"]),
                        httponly=True, secure=True, samesite="none", max_age=900, path="/")
    return {"ok": True}


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(min_length=6, max_length=128)


def reset_email_html(token: str) -> str:
    link = f"{FRONTEND_URL}/reset-password?token={token}"
    return (
        '<table role="presentation" width="100%" style="max-width:560px;margin:0 auto;font-family:Arial,sans-serif;color:#0A0A0A">'
        f'<tr><td style="padding:32px 24px;border-bottom:2px solid #0A0A0A"><span style="font-size:20px;font-weight:800;letter-spacing:6px">EASYBUY</span></td></tr>'
        '<tr><td style="padding:24px"><p style="font-size:15px">We received a request to reset your EasyBuy password.</p>'
        '<p style="font-size:13px;color:#555">This link expires in one hour. If you did not request it, you can safely ignore this email — your password stays unchanged.</p></td></tr>'
        f'<tr><td style="padding:0 24px 24px"><a href="{escape(link)}" style="display:inline-block;background:#0A0A0A;color:#ffffff;padding:12px 28px;font-size:12px;letter-spacing:3px;text-decoration:none">RESET YOUR PASSWORD</a></td></tr>'
        f'<tr><td style="padding:16px 24px;border-top:1px solid #eee;font-size:11px;color:#999">Sent by {escape(EMAIL_FROM_NAME)}. We never ask for your password or card details by email.</td></tr>'
        '</table>'
    )


async def send_password_reset_email(email: str, token: str):
    return await send_email(to=email, subject="Reset your EasyBuy password", html=reset_email_html(token))


@api_router.post("/auth/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one({
            "token": token,
            "email": email,
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
            "used": False,
        })
        await send_password_reset_email(email, token)
    return {"ok": True}


@api_router.post("/auth/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    rec = await db.password_reset_tokens.find_one({"token": payload.token})
    if not rec or rec.get("used"):
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    expires = rec["expires_at"]
    if isinstance(expires, str):
        expires = datetime.fromisoformat(expires)
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    await db.users.update_one({"email": rec["email"]}, {"$set": {"password_hash": hash_password(payload.password)}})
    await db.password_reset_tokens.update_one({"token": payload.token}, {"$set": {"used": True}})
    return {"ok": True}


async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ---------------- Cart routes ----------------
@api_router.post("/carts")
async def create_cart(request: Request):
    user = await get_optional_user(request)
    cart = CartDocument(user_id=user["id"] if user else None)
    await db.carts.insert_one(cart.to_mongo())
    return await cart_view(cart)


@api_router.get("/carts/mine")
async def get_my_cart(user=Depends(get_current_user)):
    doc = await db.carts.find_one({"user_id": user["id"]})
    if not doc:
        cart = CartDocument(user_id=user["id"])
        await db.carts.insert_one(cart.to_mongo())
        return await cart_view(cart)
    return await cart_view(CartDocument.from_mongo(doc))


@api_router.post("/carts/merge")
async def merge_cart(payload: MergeRequest, user=Depends(get_current_user)):
    target_doc = await db.carts.find_one({"user_id": user["id"]})
    source = await load_cart(payload.cart_id) if payload.cart_id else None
    if source and target_doc and source.id != target_doc["_id"].__str__():
        target = CartDocument.from_mongo(target_doc)
        items = [i.model_dump() for i in target.items]
        for si in source.items:
            for it in items:
                if it["product_id"] == si.product_id and it["size"] == si.size:
                    it["qty"] += si.qty
                    break
            else:
                items.append(si.model_dump())
        await db.carts.update_one({"_id": ObjectId(target.id)}, {"$set": {"items": items}})
        await db.carts.update_one({"_id": ObjectId(source.id)}, {"$set": {"items": []}})
        return await cart_view(CartDocument(id=target.id, items=items, user_id=user["id"]))
    if source and not target_doc:
        await db.carts.update_one({"_id": ObjectId(source.id)}, {"$set": {"user_id": user["id"]}})
        return await cart_view(CartDocument(id=source.id, items=source.items, user_id=user["id"]))
    return await cart_view(CartDocument.from_mongo(target_doc))


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


# ---------------- Wishlist routes ----------------
@api_router.get("/wishlist")
async def get_wishlist(user=Depends(get_current_user)):
    doc = await db.wishlists.find_one({"user_id": user["id"]})
    return {"product_ids": doc["product_ids"] if doc else []}


@api_router.post("/wishlist/toggle")
async def toggle_wishlist(payload: WishlistToggle, user=Depends(get_current_user)):
    doc = await db.wishlists.find_one({"user_id": user["id"]})
    ids = doc["product_ids"] if doc else []
    if payload.product_id in ids:
        ids = [x for x in ids if x != payload.product_id]
    else:
        if not await db.products.count_documents({"id": payload.product_id}):
            raise HTTPException(status_code=404, detail="Product not found")
        ids.append(payload.product_id)
    await db.wishlists.update_one({"user_id": user["id"]}, {"$set": {"product_ids": ids}}, upsert=True)
    return {"product_ids": ids}


@api_router.put("/wishlist/sync")
async def sync_wishlist(payload: WishlistSync, user=Depends(get_current_user)):
    doc = await db.wishlists.find_one({"user_id": user["id"]})
    existing = doc["product_ids"] if doc else []
    merged = existing + [x for x in payload.product_ids if x not in existing]
    await db.wishlists.update_one({"user_id": user["id"]}, {"$set": {"product_ids": merged}}, upsert=True)
    return {"product_ids": merged}


# ---------------- Order routes ----------------
@api_router.post("/orders")
async def place_order(payload: OrderCreate, request: Request):
    user = await get_optional_user(request)
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
                          subtotal=view["subtotal"], shipping=view["shipping"], total=view["total"],
                          user_id=user["id"] if user else None, cart_id=cart.id)
    await db.orders.insert_one(order.to_mongo())
    return order.model_dump()


@api_router.get("/orders/mine")
async def my_orders(user=Depends(get_current_user)):
    docs = await db.orders.find({"user_id": user["id"]}).sort("created_at", -1).to_list(100)
    return [OrderDocument.from_mongo(d).model_dump() for d in docs]


@api_router.get("/orders/by-session/{session_id}")
async def order_by_session(session_id: str):
    tx = await db.payment_transactions.find_one({"session_id": session_id})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    doc = await db.orders.find_one({"order_number": tx["order_number"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderDocument.from_mongo(doc).model_dump()


@api_router.get("/orders/{order_number}")
async def get_order(order_number: str):
    doc = await db.orders.find_one({"order_number": order_number})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderDocument.from_mongo(doc).model_dump()


# ---------------- Admin routes ----------------
class OrderStatusUpdate(BaseModel):
    status: str


ALLOWED_ORDER_STATUSES = {"awaiting_payment", "paid", "shipped", "delivered", "cancelled"}


@api_router.get("/admin/orders")
async def admin_orders(admin=Depends(require_admin)):
    docs = await db.orders.find().sort("created_at", -1).to_list(200)
    return [OrderDocument.from_mongo(d).model_dump() for d in docs]


@api_router.patch("/orders/{order_number}/status")
async def update_order_status(order_number: str, payload: OrderStatusUpdate, admin=Depends(require_admin)):
    if payload.status not in ALLOWED_ORDER_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    update = {"status": payload.status, "updated_at": datetime.now(timezone.utc).isoformat()}
    if payload.status == "shipped":
        update["shipped_at"] = update["updated_at"]
    if payload.status == "delivered":
        update["delivered_at"] = update["updated_at"]
    result = await db.orders.update_one({"order_number": order_number}, {"$set": update})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Order not found")
    doc = await db.orders.find_one({"order_number": order_number})
    return OrderDocument.from_mongo(doc).model_dump()


# ---------------- Payment routes (Stripe, Flow B) ----------------
def stripe_client(request: Request) -> StripeCheckout:
    host_url = str(request.base_url)
    return StripeCheckout(api_key=os.environ["STRIPE_API_KEY"], webhook_url=f"{host_url}api/webhook/stripe")


@api_router.post("/payments/checkout")
async def create_payment_checkout(payload: PaymentCheckoutRequest, request: Request):
    order = await db.orders.find_one({"order_number": payload.order_number})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.get("status") == "paid":
        raise HTTPException(status_code=400, detail="Order already paid")
    checkout = stripe_client(request)
    req = CheckoutSessionRequest(
        amount=float(order["total"]),
        currency="usd",
        success_url=f"{payload.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{payload.origin_url}/payment/cancel",
        metadata={"order_number": order["order_number"], "cart_id": order.get("cart_id") or ""},
    )
    session = await checkout.create_checkout_session(req)
    tx_doc = {
        "session_id": session.session_id,
        "order_number": order["order_number"],
        "cart_id": order.get("cart_id"),
        "amount": float(order["total"]),
        "currency": "usd",
        "status": "initiated",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.payment_transactions.update_one({"session_id": session.session_id}, {"$set": tx_doc}, upsert=True)
    return {"checkout_url": session.url, "session_id": session.session_id}


@api_router.get("/payments/status/{session_id}")
async def payment_status(session_id: str, request: Request):
    record = await db.payment_transactions.find_one({"session_id": session_id})
    if not record:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if record.get("payment_status") != "paid":
        try:
            status = await stripe_client(request).get_checkout_status(session_id)
            if status.payment_status == "paid":
                await mark_order_paid(session_id)
                record = await db.payment_transactions.find_one({"session_id": session_id})
        except Exception as e:
            logger.warning("Stripe status check failed: %s", str(e)[:120])
    return {"session_id": record["session_id"], "status": record["status"], "payment_status": record["payment_status"]}


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    try:
        resp = await stripe_client(request).handle_webhook(body, request.headers.get("Stripe-Signature", ""))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)[:100]}")
    if resp.payment_status == "paid":
        await mark_order_paid(resp.session_id)
    return {"status": "ok"}


# ---------------- Startup ----------------
@app.on_event("startup")
async def seed_database():
    await db.products.create_index("id", unique=True)
    await db.orders.create_index("order_number", unique=True)
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.payment_transactions.create_index("session_id", unique=True)
    if await db.products.count_documents({}) == 0:
        await db.products.insert_many(SEED_PRODUCTS)
        logger.info("Seeded %d products", len(SEED_PRODUCTS))
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({"email": admin_email, "password_hash": hash_password(admin_password),
                                   "name": "EasyBuy Admin", "role": "admin",
                                   "created_at": datetime.now(timezone.utc).isoformat()})
        logger.info("Seeded admin %s", admin_email)
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()