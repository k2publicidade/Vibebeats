from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import base64
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 168  # 7 days

app = FastAPI(
    title="VibeBeats API",
    description="API para marketplace de beats musicais",
    version="1.0.0"
)
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ============ MODELS ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    user_type: Literal["producer", "artist"]
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    user_type: Literal["producer", "artist"]

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Beat(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    producer_id: str
    producer_name: str
    genre: str
    bpm: int
    key: str  # Musical key
    description: str
    price: float
    license_type: Literal["exclusive", "non_exclusive"]
    audio_url: str  # Base64 encoded audio preview
    cover_url: Optional[str] = None  # Base64 encoded cover image
    tags: List[str] = []
    plays: int = 0
    purchases: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BeatCreate(BaseModel):
    title: str
    genre: str
    bpm: int
    key: str
    description: str
    price: float
    license_type: Literal["exclusive", "non_exclusive"]
    tags: List[str] = []

class Purchase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    beat_id: str
    beat_title: str
    buyer_id: str
    buyer_name: str
    producer_id: str
    amount: float
    license_type: str
    payment_method: Literal["stripe", "paypal", "pix"]
    payment_status: Literal["pending", "completed", "failed"] = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PurchaseCreate(BaseModel):
    beat_id: str
    payment_method: Literal["stripe", "paypal", "pix"]

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    artist_id: str
    beat_id: str
    beat_title: str
    description: Optional[str] = None
    status: Literal["draft", "mixing", "mastering", "completed"] = "draft"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectCreate(BaseModel):
    title: str
    beat_id: str
    description: Optional[str] = None

class AIAnalysisRequest(BaseModel):
    prompt: str
    context: Optional[str] = None

class CoverGenerationRequest(BaseModel):
    prompt: str
    beat_title: str

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    payload = decode_token(credentials.credentials)
    user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ============ HEALTH CHECK ============

@api_router.get("/")
async def health_check():
    return {"message": "BeatStore API", "status": "online"}

# ============ AUTH ROUTES ============

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name,
        user_type=user_data.user_type
    )
    
    user_dict = user.model_dump()
    user_dict['password'] = hash_password(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    token = create_token(user.id, user.email)
    
    return {
        "message": "User registered successfully",
        "token": token,
        "user": user.model_dump()
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'], user['email'])
    
    # Remove password from response
    user.pop('password', None)
    
    return {
        "message": "Login successful",
        "token": token,
        "user": user
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    current_user.pop('password', None)
    return current_user

@api_router.put("/auth/profile")
async def update_profile(
    name: Optional[str] = None,
    bio: Optional[str] = None,
    avatar_url: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    update_data = {}
    
    if name:
        update_data["name"] = name
    if bio is not None:
        update_data["bio"] = bio
    if avatar_url:
        update_data["avatar_url"] = avatar_url
    
    if update_data:
        await db.users.update_one({"id": current_user['id']}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": current_user['id']}, {"_id": 0, "password": 0})
    return {"message": "Profile updated successfully", "user": updated_user}

# ============ USERS ROUTES ============

@api_router.get("/users/producers")
async def get_producers(sort: Optional[str] = None, limit: Optional[int] = None):
    """Get list of all producers with optional sorting and limit"""
    try:
        # Find all producers
        query = {"user_type": "producer"}
        cursor = db.users.find(query, {"_id": 0, "password": 0})
        
        # Apply sorting if specified
        if sort == "sales":
            # We'll need to aggregate sales data
            pipeline = [
                {"$match": {"user_type": "producer"}},
                {
                    "$lookup": {
                        "from": "purchases",
                        "localField": "id",
                        "foreignField": "producer_id",
                        "as": "sales"
                    }
                },
                {
                    "$lookup": {
                        "from": "beats",
                        "localField": "id",
                        "foreignField": "producer_id",
                        "as": "beats"
                    }
                },
                {
                    "$addFields": {
                        "total_sales": {"$size": "$sales"},
                        "total_beats": {"$size": "$beats"}
                    }
                },
                {"$sort": {"total_sales": -1}},
                {"$project": {"_id": 0, "password": 0, "sales": 0, "beats": 0}}
            ]
            
            if limit:
                pipeline.append({"$limit": limit})
                
            producers = await db.users.aggregate(pipeline).to_list(length=None)
        else:
            # Default sorting by creation date
            cursor = cursor.sort("created_at", -1)
            if limit:
                cursor = cursor.limit(limit)
            producers = await cursor.to_list(length=None)
            
            # Add total_beats and total_sales for each producer
            for producer in producers:
                beats_count = await db.beats.count_documents({"producer_id": producer["id"]})
                sales_count = await db.purchases.count_documents({"producer_id": producer["id"]})
                producer["total_beats"] = beats_count
                producer["total_sales"] = sales_count
        
        return {"producers": producers, "count": len(producers)}
    except Exception as e:
        logger.error(f"Error fetching producers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users/{user_id}")
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ============ BEATS ROUTES ============

@api_router.post("/beats")
async def create_beat(
    title: str = Form(...),
    genre: str = Form(...),
    bpm: int = Form(...),
    key: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    license_type: str = Form(...),
    tags: str = Form(""),
    audio_file: UploadFile = File(...),
    cover_file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    if current_user['user_type'] != 'producer':
        raise HTTPException(status_code=403, detail="Only producers can upload beats")
    
    # Create uploads directory if it doesn't exist
    uploads_dir = ROOT_DIR / "uploads" / "beats"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename for audio
    beat_id = str(uuid.uuid4())
    audio_ext = audio_file.filename.split('.')[-1] if '.' in audio_file.filename else 'mp3'
    audio_filename = f"{beat_id}.{audio_ext}"
    audio_path = uploads_dir / audio_filename
    
    # Save audio file
    audio_content = await audio_file.read()
    
    # Check if file is too large (limit to 50MB for safety)
    if len(audio_content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Audio file too large. Maximum size is 50MB")
    
    with open(audio_path, 'wb') as f:
        f.write(audio_content)
    
    # Store only file path, not base64 (to avoid MongoDB 16MB limit)
    audio_url = f"/api/uploads/beats/{audio_filename}"
    
    # Handle cover image
    cover_url = None
    if cover_file:
        cover_content = await cover_file.read()
        
        # Check cover size (limit to 5MB)
        if len(cover_content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Cover image too large. Maximum size is 5MB")
        
        cover_ext = cover_file.filename.split('.')[-1] if '.' in cover_file.filename else 'png'
        cover_filename = f"{beat_id}_cover.{cover_ext}"
        cover_path = uploads_dir / cover_filename
        
        with open(cover_path, 'wb') as f:
            f.write(cover_content)
        
        # Store only file path, not base64
        cover_url = f"/api/uploads/beats/{cover_filename}"
    
    # Parse tags
    tags_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
    
    beat = Beat(
        id=beat_id,
        title=title,
        producer_id=current_user['id'],
        producer_name=current_user['name'],
        genre=genre,
        bpm=bpm,
        key=key,
        description=description,
        price=price,
        license_type=license_type,
        audio_url=audio_url,
        cover_url=cover_url,
        tags=tags_list
    )
    
    beat_dict = beat.model_dump()
    beat_dict['created_at'] = beat_dict['created_at'].isoformat()
    
    await db.beats.insert_one(beat_dict)
    
    return {"message": "Beat uploaded successfully", "beat": beat.model_dump()}

@api_router.get("/beats")
async def get_beats(
    genre: Optional[str] = None,
    min_bpm: Optional[int] = None,
    max_bpm: Optional[int] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    limit: int = 50
):
    query = {}
    
    if genre:
        query['genre'] = genre
    if min_bpm:
        query['bpm'] = {"$gte": min_bpm}
    if max_bpm:
        if 'bpm' in query:
            query['bpm']['$lte'] = max_bpm
        else:
            query['bpm'] = {"$lte": max_bpm}
    if max_price:
        query['price'] = {"$lte": max_price}
    if search:
        query['$or'] = [
            {'title': {'$regex': search, '$options': 'i'}},
            {'producer_name': {'$regex': search, '$options': 'i'}},
            {'tags': {'$regex': search, '$options': 'i'}}
        ]
    
    sort_order = -1 if sort_by in ['created_at', 'plays', 'purchases'] else 1
    
    beats = await db.beats.find(query, {"_id": 0}).sort(sort_by, sort_order).limit(limit).to_list(limit)
    
    return {"beats": beats, "count": len(beats)}

@api_router.get("/beats/{beat_id}")
async def get_beat(beat_id: str):
    beat = await db.beats.find_one({"id": beat_id}, {"_id": 0})
    if not beat:
        raise HTTPException(status_code=404, detail="Beat not found")
    
    # Increment play count
    await db.beats.update_one({"id": beat_id}, {"$inc": {"plays": 1}})
    beat['plays'] = beat.get('plays', 0) + 1
    
    return beat

@api_router.get("/beats/producer/{producer_id}")
async def get_producer_beats(producer_id: str):
    beats = await db.beats.find({"producer_id": producer_id}, {"_id": 0}).to_list(1000)
    return {"beats": beats, "count": len(beats)}

@api_router.put("/beats/{beat_id}")
async def update_beat(
    beat_id: str,
    title: str = Form(...),
    genre: str = Form(...),
    bpm: int = Form(...),
    key: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    license_type: str = Form(...),
    tags: str = Form(""),
    cover_file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    if current_user['user_type'] != 'producer':
        raise HTTPException(status_code=403, detail="Only producers can update beats")
    
    beat = await db.beats.find_one({"id": beat_id})
    if not beat:
        raise HTTPException(status_code=404, detail="Beat not found")
    
    if beat['producer_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Parse tags
    tags_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
    
    # Handle cover image if uploaded
    cover_url = beat.get('cover_url')
    if cover_file:
        cover_content = await cover_file.read()
        cover_base64 = base64.b64encode(cover_content).decode('utf-8')
        cover_url = f"data:image/png;base64,{cover_base64}"
    
    # Update beat
    update_data = {
        "title": title,
        "genre": genre,
        "bpm": bpm,
        "key": key,
        "description": description,
        "price": price,
        "license_type": license_type,
        "tags": tags_list,
        "cover_url": cover_url
    }
    
    await db.beats.update_one({"id": beat_id}, {"$set": update_data})
    
    updated_beat = await db.beats.find_one({"id": beat_id}, {"_id": 0})
    return {"message": "Beat updated successfully", "beat": updated_beat}

@api_router.delete("/beats/{beat_id}")
async def delete_beat(beat_id: str, current_user: dict = Depends(get_current_user)):
    beat = await db.beats.find_one({"id": beat_id})
    if not beat:
        raise HTTPException(status_code=404, detail="Beat not found")
    
    if beat['producer_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.beats.delete_one({"id": beat_id})
    return {"message": "Beat deleted successfully"}

# ============ PURCHASES ROUTES ============

@api_router.post("/purchases")
async def create_purchase(
    purchase_data: PurchaseCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user['user_type'] != 'artist':
        raise HTTPException(status_code=403, detail="Only artists can purchase beats")
    
    beat = await db.beats.find_one({"id": purchase_data.beat_id}, {"_id": 0})
    if not beat:
        raise HTTPException(status_code=404, detail="Beat not found")
    
    # Check if already purchased
    existing = await db.purchases.find_one({
        "beat_id": purchase_data.beat_id,
        "buyer_id": current_user['id']
    })
    if existing:
        raise HTTPException(status_code=400, detail="Beat already purchased")
    
    purchase = Purchase(
        beat_id=beat['id'],
        beat_title=beat['title'],
        buyer_id=current_user['id'],
        buyer_name=current_user['name'],
        producer_id=beat['producer_id'],
        amount=beat['price'],
        license_type=beat['license_type'],
        payment_method=purchase_data.payment_method,
        payment_status="completed"  # Simplified for MVP
    )
    
    purchase_dict = purchase.model_dump()
    purchase_dict['created_at'] = purchase_dict['created_at'].isoformat()
    
    await db.purchases.insert_one(purchase_dict)
    
    # Update beat purchase count
    await db.beats.update_one({"id": beat['id']}, {"$inc": {"purchases": 1}})
    
    return {"message": "Purchase completed", "purchase": purchase.model_dump()}

@api_router.get("/purchases/my-purchases")
async def get_my_purchases(current_user: dict = Depends(get_current_user)):
    purchases = await db.purchases.find(
        {"buyer_id": current_user['id']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    return {"purchases": purchases, "count": len(purchases)}

@api_router.get("/purchases/my-sales")
async def get_my_sales(current_user: dict = Depends(get_current_user)):
    if current_user['user_type'] != 'producer':
        raise HTTPException(status_code=403, detail="Only producers can view sales")
    
    sales = await db.purchases.find(
        {"producer_id": current_user['id']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    total_revenue = sum(sale.get('amount', 0) for sale in sales)
    
    return {"sales": sales, "count": len(sales), "total_revenue": total_revenue}

# ============ PROJECTS ROUTES ============

@api_router.post("/projects")
async def create_project(
    project_data: ProjectCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user['user_type'] != 'artist':
        raise HTTPException(status_code=403, detail="Only artists can create projects")
    
    # Verify beat purchase
    purchase = await db.purchases.find_one({
        "beat_id": project_data.beat_id,
        "buyer_id": current_user['id']
    })
    if not purchase:
        raise HTTPException(status_code=403, detail="You must purchase this beat first")
    
    beat = await db.beats.find_one({"id": project_data.beat_id}, {"_id": 0})
    
    project = Project(
        title=project_data.title,
        artist_id=current_user['id'],
        beat_id=project_data.beat_id,
        beat_title=beat['title'],
        description=project_data.description
    )
    
    project_dict = project.model_dump()
    project_dict['created_at'] = project_dict['created_at'].isoformat()
    project_dict['updated_at'] = project_dict['updated_at'].isoformat()
    
    await db.projects.insert_one(project_dict)
    
    return {"message": "Project created", "project": project.model_dump()}

@api_router.get("/projects/my-projects")
async def get_my_projects(current_user: dict = Depends(get_current_user)):
    projects = await db.projects.find(
        {"artist_id": current_user['id']},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(1000)
    
    return {"projects": projects, "count": len(projects)}

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project['artist_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return project

@api_router.put("/projects/{project_id}")
async def update_project(
    project_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    status: Optional[Literal["draft", "mixing", "mastering", "completed"]] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user['user_type'] != 'artist':
        raise HTTPException(status_code=403, detail="Only artists can update projects")
    
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project['artist_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if title:
        update_data["title"] = title
    if description is not None:
        update_data["description"] = description
    if status:
        update_data["status"] = status
    
    await db.projects.update_one({"id": project_id}, {"$set": update_data})
    
    updated_project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    return {"message": "Project updated successfully", "project": updated_project}

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project['artist_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.projects.delete_one({"id": project_id})
    return {"message": "Project deleted successfully"}

# ============ AI ROUTES ============

@api_router.post("/ai/analyze")
async def ai_analyze(
    request: AIAnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    """Análise de mixagem por IA - Em desenvolvimento"""
    return {
        "analysis": "Funcionalidade de análise por IA em desenvolvimento. Em breve você poderá receber sugestões de mixagem e mastering para seus projetos."
    }

@api_router.post("/ai/generate-cover")
async def generate_cover(
    request: CoverGenerationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Geração de capa por IA - Em desenvolvimento"""
    return {
        "cover_url": None,
        "message": "Funcionalidade de geração de capas por IA em desenvolvimento."
    }

# ============ STATS ROUTES ============

@api_router.get("/stats/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    if current_user['user_type'] == 'producer':
        beats = await db.beats.find({"producer_id": current_user['id']}, {"_id": 0}).to_list(1000)
        sales = await db.purchases.find({"producer_id": current_user['id']}, {"_id": 0}).to_list(1000)
        
        total_plays = sum(beat.get('plays', 0) for beat in beats)
        total_sales = len(sales)
        total_revenue = sum(sale.get('amount', 0) for sale in sales)
        
        return {
            "total_beats": len(beats),
            "total_plays": total_plays,
            "total_sales": total_sales,
            "total_revenue": total_revenue,
            "beats": beats[:10]  # Latest 10 beats
        }
    else:
        purchases = await db.purchases.find({"buyer_id": current_user['id']}, {"_id": 0}).to_list(1000)
        projects = await db.projects.find({"artist_id": current_user['id']}, {"_id": 0}).to_list(1000)
        
        total_spent = sum(purchase.get('amount', 0) for purchase in purchases)
        
        return {
            "total_purchases": len(purchases),
            "total_projects": len(projects),
            "total_spent": total_spent,
            "recent_purchases": purchases[:10],
            "active_projects": projects[:10]
        }

# Mount uploads directory BEFORE including router (so it doesn't conflict)
uploads_dir = ROOT_DIR / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Include router
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