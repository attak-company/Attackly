"""Attackly Database Connection Test — Full Integration Check"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from supabase import create_client
from app.core.config import settings

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
project = settings.SUPABASE_URL.split("//")[1].split(".")[0]

print(f"\n{'='*60}")
print(f"  Attackly Database Integration Report")
print(f"{'='*60}")
print(f"  Project:  {project}")
print(f"  REST API: https://{project}.supabase.co")
print()

# ─── Check existing tables ───
tables_to_check = [
    "users", "profiles", "businesses", "services", 
    "staff", "business_hours", "appointments", 
    "payments", "faqs", "chat_messages", "shop_bookings_v3"
]

existing = []
missing = []

for table in tables_to_check:
    try:
        r = supabase.table(table).select("id").limit(1).execute()
        count = r.count if hasattr(r, 'count') else len(r.data)
        existing.append(f"  [{table:20s}] OK  ({count} rows)")
    except Exception as e:
        missing.append(f"  [{table:20s}] NEEDS CREATION")

print(f"  --- Existing Tables ---")
for t in existing:
    print(t)

print(f"\n  --- Missing Tables (need migration) ---")
for t in missing:
    print(t)

# ─── Check users table ───
print(f"\n  --- Users in Database ---")
r = supabase.table("users").select("id, email, created_at").order("created_at").execute()
for u in r.data:
    print(f"  [{u['id'][:8]}] {u['email']:30s} | {u['created_at'][:10]}")

print(f"\n  --- Summary ---")
print(f"  Tables existing: {len(existing)}/{len(tables_to_check)}")
print(f"  Tables missing:  {len(missing)}/{len(tables_to_check)}")
print(f"  Users found:     {len(r.data)}")
print(f"\n{'='*60}")
