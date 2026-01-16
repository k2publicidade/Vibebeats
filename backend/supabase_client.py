"""
Supabase Client Configuration for VibeBeats
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://sjwyyxwccooyoxbzrthq.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")  # Use service role key for backend
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")  # Anon key for public operations

# Create Supabase client
supabase: Client = None

def get_supabase_client() -> Client:
    """Get or create Supabase client instance."""
    global supabase
    if supabase is None:
        if not SUPABASE_KEY:
            raise ValueError("SUPABASE_KEY environment variable is not set")
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return supabase

def get_storage_url(bucket: str, path: str) -> str:
    """Generate public URL for storage object."""
    return f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}"
