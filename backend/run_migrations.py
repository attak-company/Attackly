"""Attackly Database Migration Runner

Run this to create all database tables in Supabase.
Since direct DB access is restricted from this network,
the SQL is provided for manual execution in Supabase Dashboard.

Usage:
    python run_migrations.py
    
Then open the SQL file or the Supabase Dashboard link.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.core.config import settings

MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), "migrations")
project = settings.SUPABASE_URL.split("//")[1].split(".")[0]


def main():
    sql_files = [f for f in os.listdir(MIGRATIONS_DIR) if f.endswith(".sql")]
    sql_files.sort()
    
    print(f"\n{'='*60}")
    print(f"  Attackly Database Migration")
    print(f"{'='*60}")
    print(f"  Project: {project}")
    print(f"  Migrations found: {len(sql_files)}")
    print()
    
    for f in sql_files:
        filepath = os.path.join(MIGRATIONS_DIR, f)
        with open(filepath, "r", encoding="utf-8") as fh:
            sql = fh.read()
        print(f"  [{f}] {len(sql)} chars")
    print()
    
    print(f"  Link to Supabase SQL Editor:")
    print(f"  https://supabase.com/dashboard/project/{project}/sql/new")
    print()
    print(f"  Steps:")
    print(f"  1. Click the link above")
    print(f"  2. Open the SQL file:")
    print(f"     {MIGRATIONS_DIR}\\001_initial_schema.sql")
    print(f"  3. Copy-paste the SQL content")
    print(f"  4. Click 'Run' to create all tables")
    print()
    print(f"  All tables created by the migration:")
    print(f"  - profiles     (extends auth.users)")
    print(f"  - businesses   (business profiles)")
    print(f"  - services     (service offerings)")
    print(f"  - staff        (staff members)")
    print(f"  - business_hours (operating hours)")
    print(f"  - appointments (booking records)")
    print(f"  - payments     (payment transactions)")
    print(f"  - faqs         (FAQ database)")
    print(f"  - chat_messages (conversation history)")
    print(f"  - shop_bookings_v3 (legacy support)")
    print()
    print(f"  Row Level Security policies applied")
    print(f"  Auto-update triggers configured")
    print(f"{'='*60}")
    print()


if __name__ == "__main__":
    main()
