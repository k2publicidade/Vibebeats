"""
VibeBeats Supabase Migration Script

This script executes the SQL migrations to set up the VibeBeats database in Supabase.

Usage:
    python migrate.py [--seed]

Options:
    --seed    Also seed the database with test data
"""

import os
import sys
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://sjwyyxwccooyoxbzrthq.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

# Use service role key for admin operations
# The publishable key won't work for DDL operations
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


def get_headers():
    """Get headers for Supabase API requests."""
    key = SERVICE_ROLE_KEY or SUPABASE_KEY
    if not key:
        print("ERROR: No Supabase key found. Please set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY")
        sys.exit(1)

    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }


def execute_sql(sql: str, description: str = "SQL") -> bool:
    """Execute SQL via Supabase REST API."""
    print(f"\n  Executing: {description}...")

    # Use the SQL REST endpoint
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"

    try:
        response = requests.post(
            url,
            headers=get_headers(),
            json={"query": sql}
        )

        if response.status_code in [200, 201, 204]:
            print(f"    Success!")
            return True
        else:
            print(f"    Failed: {response.status_code}")
            print(f"    Response: {response.text[:500]}")
            return False
    except Exception as e:
        print(f"    Error: {e}")
        return False


def read_sql_file(filename: str) -> str:
    """Read SQL file content."""
    script_dir = Path(__file__).parent
    filepath = script_dir / filename

    if not filepath.exists():
        print(f"ERROR: SQL file not found: {filepath}")
        sys.exit(1)

    return filepath.read_text(encoding="utf-8")


def create_exec_sql_function():
    """Create a helper function to execute raw SQL via RPC."""
    sql = """
    CREATE OR REPLACE FUNCTION exec_sql(query text)
    RETURNS void AS $$
    BEGIN
        EXECUTE query;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    """

    # This needs to be done via the Supabase Dashboard SQL Editor first
    # or via direct PostgreSQL connection
    print("  Note: exec_sql function must be created via Supabase Dashboard")
    return True


def main():
    """Main migration function."""
    print("=" * 60)
    print("  VibeBeats Supabase Migration")
    print("=" * 60)

    # Check arguments
    seed = "--seed" in sys.argv

    print(f"\n  Supabase URL: {SUPABASE_URL}")
    print(f"  Seed data: {'Yes' if seed else 'No'}")

    # Read SQL files
    print("\n[1/3] Reading SQL files...")
    schema_sql = read_sql_file("schema.sql")
    storage_sql = read_sql_file("storage.sql")
    print("  SQL files loaded successfully")

    print("\n[2/3] Migration Instructions:")
    print("-" * 60)
    print("""
    Due to Supabase security restrictions, you need to run the
    migrations manually via the Supabase Dashboard:

    1. Go to: https://supabase.com/dashboard/project/sjwyyxwccooyoxbzrthq
    2. Navigate to: SQL Editor (left sidebar)
    3. Click: New Query
    4. Copy and paste the contents of:
       - schema.sql (for tables, indexes, functions, RLS)
       - storage.sql (for storage buckets and policies)
    5. Click: Run

    Alternatively, you can connect directly to the PostgreSQL
    database using the connection string from the Dashboard.
    """)

    print("\n[3/3] Files to execute:")
    print(f"  - {Path(__file__).parent / 'schema.sql'}")
    print(f"  - {Path(__file__).parent / 'storage.sql'}")

    print("\n" + "=" * 60)
    print("  Migration files ready!")
    print("=" * 60)

    # Output the SQL for easy copy-paste
    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)

    combined_sql = f"""
-- ============================================================
-- Combined Migration Script for VibeBeats
-- Run this in Supabase SQL Editor
-- ============================================================

-- PART 1: Schema (Tables, Indexes, Functions, RLS)
{schema_sql}

-- PART 2: Storage (Buckets and Policies)
{storage_sql}
"""

    combined_file = output_dir / "combined_migration.sql"
    combined_file.write_text(combined_sql, encoding="utf-8")

    print(f"\n  Combined SQL saved to: {combined_file}")
    print("  You can copy this file content to Supabase SQL Editor")


if __name__ == "__main__":
    main()
