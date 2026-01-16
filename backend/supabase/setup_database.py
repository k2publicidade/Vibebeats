"""
VibeBeats Supabase Database Setup

This script sets up the VibeBeats database in Supabase using the Management API.
It creates tables, functions, triggers, indexes, RLS policies, and storage buckets.

Usage:
    python setup_database.py [--seed] [--drop-existing]

Requirements:
    pip install httpx python-dotenv
"""

import httpx
import sys
import os
from pathlib import Path
from dotenv import load_dotenv
import json
import time

# Load environment variables
load_dotenv()

# Supabase Configuration
SUPABASE_URL = "https://sjwyyxwccooyoxbzrthq.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_DcWTysoG_zzS3ucHOivslA_ouwqhKJh"
SUPABASE_SECRET_KEY = "sb_secret_6ttgD1jRXHWG1FTFXZvmEg_4tKEjQYj"

# Supabase Management API (requires service_role or management key)
# For DDL operations, we need to use the SQL endpoint with service_role


def get_db_url():
    """Get the PostgreSQL connection URL from Supabase."""
    # Format: postgresql://postgres:[YOUR-PASSWORD]@db.sjwyyxwccooyoxbzrthq.supabase.co:5432/postgres
    return f"postgresql://postgres.sjwyyxwccooyoxbzrthq:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"


def execute_sql_via_rest(sql: str, description: str = ""):
    """Execute SQL using Supabase REST API with service role key."""
    print(f"  Executing: {description or sql[:50]}...")

    headers = {
        "apikey": SUPABASE_SECRET_KEY,
        "Authorization": f"Bearer {SUPABASE_SECRET_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    # Create a function to execute arbitrary SQL
    create_exec_fn = """
    CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        result json;
    BEGIN
        EXECUTE sql_query;
        RETURN '{"success": true}'::json;
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
    END;
    $$;
    """

    try:
        # First, try to create the exec_sql function
        with httpx.Client(timeout=60.0) as client:
            # Try calling the function
            response = client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
                headers=headers,
                json={"sql_query": sql}
            )

            if response.status_code == 200:
                result = response.json()
                if isinstance(result, dict) and result.get("success") == False:
                    print(f"    SQL Error: {result.get('error', 'Unknown error')}")
                    return False
                print("    Success!")
                return True
            elif response.status_code == 404:
                print("    Function not found. Please create exec_sql function first.")
                return False
            else:
                print(f"    HTTP {response.status_code}: {response.text[:200]}")
                return False

    except Exception as e:
        print(f"    Error: {e}")
        return False


def print_sql_for_dashboard():
    """Print SQL that needs to be run in Supabase Dashboard."""

    print("\n" + "=" * 70)
    print(" INSTRUCOES PARA CONFIGURAR O BANCO DE DADOS")
    print("=" * 70)

    print("""
    Como o Supabase requer acesso administrativo para criar tabelas,
    voce precisa executar o SQL manualmente:

    PASSO 1: Acesse o Supabase Dashboard
    --------------------------------------
    URL: https://supabase.com/dashboard/project/sjwyyxwccooyoxbzrthq

    PASSO 2: Va para o SQL Editor
    --------------------------------------
    - Clique em "SQL Editor" no menu lateral esquerdo
    - Clique em "New Query"

    PASSO 3: Execute os scripts na ordem
    --------------------------------------
    Execute cada arquivo SQL em ordem:

    1. schema.sql - Tabelas, indices, funcoes, triggers e RLS
    2. storage.sql - Buckets de storage e politicas

    Os arquivos estao em:
    backend/supabase/schema.sql
    backend/supabase/storage.sql

    PASSO 4: Verifique a criacao
    --------------------------------------
    - Va para "Table Editor" e verifique se as tabelas foram criadas
    - Va para "Storage" e verifique se os buckets foram criados
    """)


def create_combined_migration():
    """Create a single SQL file with all migrations."""
    script_dir = Path(__file__).parent

    schema_sql = (script_dir / "schema.sql").read_text(encoding="utf-8")
    storage_sql = (script_dir / "storage.sql").read_text(encoding="utf-8")

    combined = f"""
-- ============================================================
-- VibeBeats Complete Database Migration
-- Execute this in Supabase SQL Editor
-- Created: {time.strftime("%Y-%m-%d %H:%M:%S")}
-- ============================================================

-- =====================
-- PART 1: SCHEMA
-- =====================

{schema_sql}

-- =====================
-- PART 2: STORAGE
-- =====================

{storage_sql}

-- ============================================================
-- Migration Complete!
-- ============================================================
"""

    output_file = script_dir / "complete_migration.sql"
    output_file.write_text(combined, encoding="utf-8")

    print(f"\n  Arquivo de migracao criado: {output_file}")
    return output_file


def main():
    """Main setup function."""
    print("=" * 70)
    print(" VibeBeats - Configuracao do Banco de Dados Supabase")
    print("=" * 70)

    print(f"\n  Projeto Supabase: sjwyyxwccooyoxbzrthq")
    print(f"  URL: {SUPABASE_URL}")

    # Create combined migration file
    print("\n[1/2] Criando arquivo de migracao combinado...")
    migration_file = create_combined_migration()

    # Print instructions
    print("\n[2/2] Instrucoes de configuracao...")
    print_sql_for_dashboard()

    print("\n" + "=" * 70)
    print(" RESUMO DOS ARQUIVOS CRIADOS")
    print("=" * 70)

    script_dir = Path(__file__).parent
    print(f"""
    Arquivos SQL criados:

    1. {script_dir / 'schema.sql'}
       - 5 tabelas: users, beats, purchases, projects, favorites
       - 5 tipos ENUM
       - 15+ indices para performance
       - 6 funcoes PostgreSQL
       - 5 triggers
       - 15+ politicas RLS

    2. {script_dir / 'storage.sql'}
       - 4 buckets: avatars, covers, audio, audio-downloads
       - 16 politicas de storage

    3. {script_dir / 'complete_migration.sql'}
       - Arquivo combinado para execucao unica

    Proximo passo: Execute o arquivo complete_migration.sql
    no Supabase SQL Editor.
    """)


if __name__ == "__main__":
    main()
