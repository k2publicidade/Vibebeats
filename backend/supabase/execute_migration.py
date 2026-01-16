"""
Execute VibeBeats migrations on Supabase via REST API

This script uses the Supabase Management API to execute SQL migrations.
"""

import httpx
import sys
from pathlib import Path
import json

# Supabase Configuration
SUPABASE_URL = "https://sjwyyxwccooyoxbzrthq.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_DcWTysoG_zzS3ucHOivslA_ouwqhKJh"
SUPABASE_SECRET_KEY = "sb_secret_6ttgD1jRXHWG1FTFXZvmEg_4tKEjQYj"

# Project reference from URL
PROJECT_REF = "sjwyyxwccooyoxbzrthq"


def split_sql_statements(sql: str) -> list[str]:
    """Split SQL into individual statements, respecting function definitions."""
    statements = []
    current = []
    in_function = False
    in_policy = False
    delimiter_count = 0

    lines = sql.split('\n')

    for line in lines:
        stripped = line.strip()

        # Skip comments and empty lines at statement start
        if not current and (stripped.startswith('--') or not stripped):
            continue

        # Track function/trigger definitions
        if 'AS $$' in line or 'AS $' in line:
            in_function = True
            delimiter_count += 1

        if in_function and ('$$ LANGUAGE' in line or '$$;' in line):
            delimiter_count -= 1
            if delimiter_count <= 0:
                in_function = False

        # Track CREATE POLICY (multi-line)
        if stripped.upper().startswith('CREATE POLICY'):
            in_policy = True

        current.append(line)

        # End of statement
        if stripped.endswith(';') and not in_function:
            statement = '\n'.join(current).strip()
            if statement and not statement.startswith('--'):
                statements.append(statement)
            current = []
            in_policy = False

    # Handle last statement without semicolon
    if current:
        statement = '\n'.join(current).strip()
        if statement and not statement.startswith('--'):
            statements.append(statement)

    return statements


def execute_sql_statement(client: httpx.Client, sql: str, description: str = "") -> dict:
    """Execute a single SQL statement via Supabase REST RPC."""

    headers = {
        "apikey": SUPABASE_SECRET_KEY,
        "Authorization": f"Bearer {SUPABASE_SECRET_KEY}",
        "Content-Type": "application/json"
    }

    # Try using the pg_query endpoint if available
    # Or fall back to creating a function
    try:
        # Execute via rpc
        response = client.post(
            f"{SUPABASE_URL}/rest/v1/rpc/pg_execute",
            headers=headers,
            json={"query": sql},
            timeout=30.0
        )

        if response.status_code == 200:
            return {"success": True, "data": response.json()}
        elif response.status_code == 404:
            return {"success": False, "error": "pg_execute function not found"}
        else:
            return {"success": False, "error": f"HTTP {response.status_code}: {response.text[:200]}"}

    except Exception as e:
        return {"success": False, "error": str(e)}


def create_helper_function(client: httpx.Client) -> bool:
    """Create a helper function to execute arbitrary SQL."""

    # This SQL creates a function that can execute arbitrary SQL
    # It needs to be created first via Supabase Dashboard
    helper_sql = """
    CREATE OR REPLACE FUNCTION pg_execute(query text)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
        result json;
    BEGIN
        EXECUTE query;
        RETURN json_build_object('success', true, 'message', 'Query executed successfully');
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM, 'detail', SQLSTATE);
    END;
    $$;

    -- Grant execute to authenticated and service_role
    GRANT EXECUTE ON FUNCTION pg_execute(text) TO authenticated;
    GRANT EXECUTE ON FUNCTION pg_execute(text) TO service_role;
    """

    print("\n  Para executar migrations automaticamente, primeiro crie esta funcao")
    print("  no Supabase SQL Editor:\n")
    print("-" * 60)
    print(helper_sql)
    print("-" * 60)

    return False


def main():
    """Main execution function."""
    print("=" * 70)
    print(" VibeBeats - Executando Migrations no Supabase")
    print("=" * 70)

    # Read the combined migration file
    script_dir = Path(__file__).parent
    migration_file = script_dir / "complete_migration.sql"

    if not migration_file.exists():
        print(f"\nERRO: Arquivo de migracao nao encontrado: {migration_file}")
        print("Execute primeiro: python setup_database.py")
        sys.exit(1)

    sql_content = migration_file.read_text(encoding="utf-8")

    # Try to execute
    with httpx.Client() as client:
        print("\n[1/3] Testando conexao com Supabase...")

        # Test connection
        headers = {
            "apikey": SUPABASE_SECRET_KEY,
            "Authorization": f"Bearer {SUPABASE_SECRET_KEY}",
        }

        try:
            response = client.get(f"{SUPABASE_URL}/rest/v1/", headers=headers)
            if response.status_code == 200:
                print("    Conexao OK!")
            else:
                print(f"    Erro de conexao: {response.status_code}")
        except Exception as e:
            print(f"    Erro: {e}")
            sys.exit(1)

        print("\n[2/3] Verificando funcao pg_execute...")
        result = execute_sql_statement(client, "SELECT 1", "Test query")

        if not result["success"]:
            print("    Funcao pg_execute nao encontrada.")
            create_helper_function(client)

            print("\n" + "=" * 70)
            print(" INSTRUCOES MANUAIS")
            print("=" * 70)
            print(f"""
    A API REST do Supabase nao permite executar DDL (CREATE TABLE, etc)
    diretamente. Voce precisa:

    OPCAO 1: Supabase SQL Editor (Recomendado)
    ------------------------------------------
    1. Acesse: https://supabase.com/dashboard/project/{PROJECT_REF}/sql
    2. Cole o conteudo de: {migration_file}
    3. Clique em "Run"

    OPCAO 2: Conexao PostgreSQL Direta
    ------------------------------------------
    Use um cliente PostgreSQL (psql, DBeaver, etc) com:

    Host: db.{PROJECT_REF}.supabase.co
    Port: 5432
    Database: postgres
    User: postgres
    Password: (veja no Dashboard > Settings > Database)

    OPCAO 3: Supabase CLI
    ------------------------------------------
    npm install -g supabase
    supabase login
    supabase db push --project-ref {PROJECT_REF}
            """)
            sys.exit(0)

        print("\n[3/3] Executando migrations...")
        statements = split_sql_statements(sql_content)

        success_count = 0
        error_count = 0

        for i, stmt in enumerate(statements, 1):
            # Get first line for description
            first_line = stmt.split('\n')[0][:60]
            print(f"\n  [{i}/{len(statements)}] {first_line}...")

            result = execute_sql_statement(client, stmt, first_line)

            if result["success"]:
                print("    OK")
                success_count += 1
            else:
                print(f"    ERRO: {result['error']}")
                error_count += 1

        print("\n" + "=" * 70)
        print(f" RESULTADO: {success_count} sucesso, {error_count} erros")
        print("=" * 70)


if __name__ == "__main__":
    main()
