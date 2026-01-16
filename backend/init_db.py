"""
VibeBeats Database Initialization Script

This script:
1. Creates MongoDB indexes for optimal query performance
2. Seeds the database with sample data for development
3. Validates database connection and configuration

Usage:
    python init_db.py [--seed]

Options:
    --seed    Populate database with sample data
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta
import uuid
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import random

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "vibeats")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def generate_id():
    """Generate a unique ID."""
    return str(uuid.uuid4())


def hash_password(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


async def create_indexes(db):
    """Create MongoDB indexes for optimal query performance."""
    print("\n[1/3] Creating indexes...")

    # Users collection indexes
    print("  Creating users indexes...")
    await db.users.create_index("id", unique=True)
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_type")
    await db.users.create_index("created_at")

    # Beats collection indexes
    print("  Creating beats indexes...")
    await db.beats.create_index("id", unique=True)
    await db.beats.create_index("producer_id")
    await db.beats.create_index("genre")
    await db.beats.create_index("created_at")
    await db.beats.create_index("price")
    await db.beats.create_index("plays")
    await db.beats.create_index("purchases")
    await db.beats.create_index(
        [("title", "text"), ("description", "text"), ("tags", "text")],
        name="beats_text_search"
    )

    # Purchases collection indexes
    print("  Creating purchases indexes...")
    await db.purchases.create_index("id", unique=True)
    await db.purchases.create_index("buyer_id")
    await db.purchases.create_index("producer_id")
    await db.purchases.create_index("beat_id")
    await db.purchases.create_index([("beat_id", 1), ("buyer_id", 1)], unique=True)
    await db.purchases.create_index("created_at")

    # Projects collection indexes
    print("  Creating projects indexes...")
    await db.projects.create_index("id", unique=True)
    await db.projects.create_index("artist_id")
    await db.projects.create_index("beat_id")
    await db.projects.create_index("status")
    await db.projects.create_index("created_at")

    print("  All indexes created successfully!")


async def seed_database(db):
    """Populate database with sample data for development."""
    print("\n[2/3] Seeding database...")

    # Check if data already exists
    existing_users = await db.users.count_documents({})
    if existing_users > 0:
        print("  Database already has data. Skipping seed.")
        return

    # Sample genres and keys
    genres = ["Hip Hop", "Trap", "R&B", "Pop", "Lo-fi", "Electronic"]
    keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    tags_pool = [
        "dark", "chill", "hard", "melodic", "bouncy", "sad", "hype",
        "atmospheric", "aggressive", "smooth", "wavy", "experimental"
    ]

    # Create sample producers
    print("  Creating sample producers...")
    producers = []
    producer_names = [
        ("Metro Boomin", "metro@vibebeats.com"),
        ("Murda Beatz", "murda@vibebeats.com"),
        ("Wheezy", "wheezy@vibebeats.com"),
        ("Southside", "southside@vibebeats.com"),
        ("Pi'erre Bourne", "pierre@vibebeats.com")
    ]

    for name, email in producer_names:
        producer = {
            "id": generate_id(),
            "email": email,
            "password_hash": hash_password("producer123"),
            "name": name,
            "user_type": "producer",
            "bio": f"Producer based in Atlanta. Creating fire beats since 2015.",
            "avatar_url": None,
            "social_links": {
                "instagram": f"@{name.lower().replace(' ', '')}",
                "twitter": f"@{name.lower().replace(' ', '')}"
            },
            "created_at": datetime.utcnow() - timedelta(days=random.randint(30, 365))
        }
        await db.users.insert_one(producer)
        producers.append(producer)

    # Create sample artists
    print("  Creating sample artists...")
    artists = []
    artist_names = [
        ("Drake Jr", "drake@vibebeats.com"),
        ("Lil Test", "liltest@vibebeats.com"),
        ("Young Demo", "youngdemo@vibebeats.com")
    ]

    for name, email in artist_names:
        artist = {
            "id": generate_id(),
            "email": email,
            "password_hash": hash_password("artist123"),
            "name": name,
            "user_type": "artist",
            "bio": f"Independent artist looking for fire beats.",
            "avatar_url": None,
            "created_at": datetime.utcnow() - timedelta(days=random.randint(10, 200))
        }
        await db.users.insert_one(artist)
        artists.append(artist)

    # Create sample beats
    print("  Creating sample beats...")
    beat_titles = [
        "Midnight Vibes", "Dark Paradise", "Cloud Nine", "Street Dreams",
        "Neon Nights", "Summer Waves", "Trap Soul", "Velocity",
        "Starlight", "Ocean Drive", "Phoenix Rising", "Lunar Eclipse",
        "Thunder", "Serenity", "Chaos Theory", "Electric Dreams",
        "Gold Rush", "Savage Mode", "Eternal", "Infinity Loop"
    ]

    beats = []
    for i, title in enumerate(beat_titles):
        producer = random.choice(producers)
        beat = {
            "id": generate_id(),
            "title": title,
            "producer_id": producer["id"],
            "producer_name": producer["name"],
            "genre": random.choice(genres),
            "bpm": random.randint(80, 180),
            "key": random.choice(keys),
            "price": random.choice([29.99, 49.99, 79.99, 99.99, 149.99, 199.99]),
            "description": f"High-quality {random.choice(genres).lower()} beat perfect for your next hit. Mixed and mastered professionally.",
            "tags": random.sample(tags_pool, k=random.randint(2, 5)),
            "audio_url": None,
            "cover_url": None,
            "license_type": random.choice(["exclusive", "non-exclusive", "non-exclusive"]),
            "plays": random.randint(50, 5000),
            "purchases": random.randint(0, 50),
            "duration": f"{random.randint(2, 4)}:{random.randint(10, 59):02d}",
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 180))
        }
        await db.beats.insert_one(beat)
        beats.append(beat)

    # Create sample purchases
    print("  Creating sample purchases...")
    for _ in range(10):
        artist = random.choice(artists)
        beat = random.choice(beats)

        # Check if purchase already exists
        existing = await db.purchases.find_one({
            "buyer_id": artist["id"],
            "beat_id": beat["id"]
        })
        if existing:
            continue

        purchase = {
            "id": generate_id(),
            "beat_id": beat["id"],
            "beat_title": beat["title"],
            "buyer_id": artist["id"],
            "buyer_name": artist["name"],
            "producer_id": beat["producer_id"],
            "producer_name": beat["producer_name"],
            "price": beat["price"],
            "payment_method": random.choice(["stripe", "pix", "paypal"]),
            "status": "completed",
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 60))
        }
        await db.purchases.insert_one(purchase)

    print("  Sample data created successfully!")
    print(f"    - {len(producers)} producers")
    print(f"    - {len(artists)} artists")
    print(f"    - {len(beats)} beats")


async def verify_connection(client, db):
    """Verify database connection and configuration."""
    print("\n[3/3] Verifying connection...")

    try:
        # Test connection
        await client.admin.command('ping')
        print(f"  Connected to MongoDB at {MONGO_URL}")
        print(f"  Using database: {DB_NAME}")

        # Count documents
        users_count = await db.users.count_documents({})
        beats_count = await db.beats.count_documents({})
        purchases_count = await db.purchases.count_documents({})
        projects_count = await db.projects.count_documents({})

        print(f"\n  Database statistics:")
        print(f"    - Users: {users_count}")
        print(f"    - Beats: {beats_count}")
        print(f"    - Purchases: {purchases_count}")
        print(f"    - Projects: {projects_count}")

        return True
    except Exception as e:
        print(f"  ERROR: Failed to connect to MongoDB: {e}")
        return False


async def main():
    """Main initialization function."""
    print("=" * 50)
    print("  VibeBeats Database Initialization")
    print("=" * 50)

    # Parse arguments
    seed = "--seed" in sys.argv

    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    try:
        # Create indexes
        await create_indexes(db)

        # Seed database if requested
        if seed:
            await seed_database(db)
        else:
            print("\n[2/3] Skipping seed (use --seed to populate sample data)")

        # Verify connection
        success = await verify_connection(client, db)

        if success:
            print("\n" + "=" * 50)
            print("  Database initialization complete!")
            print("=" * 50)

            if seed:
                print("\n  Test credentials:")
                print("    Producer: metro@vibebeats.com / producer123")
                print("    Artist: drake@vibebeats.com / artist123")
        else:
            print("\n  Database initialization failed!")
            sys.exit(1)

    except Exception as e:
        print(f"\n  ERROR: {e}")
        sys.exit(1)
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
