"""Try to execute migration SQL via various APIs"""
import httpx
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.core.config import settings

project = settings.SUPABASE_URL.split("//")[1].split(".")[0]
service_key = settings.SUPABASE_KEY

headers = {
    "apikey": service_key,
    "Authorization": f"Bearer {service_key}",
    "Content-Type": "application/json",
}

# Load migration SQL
migration_file = os.path.join(os.path.dirname(__file__), "migrations", "001_initial_schema.sql")
with open(migration_file, "r", encoding="utf-8") as f:
    sql = f.read()

print(f"Loaded migration: {len(sql)} chars")

# Try to run via Supabase Management API
r = httpx.get(
    f"https://api.supabase.com/v1/projects/{project}",
    headers=headers,
    timeout=10,
)
print(f"Project API: {r.status_code} -> {r.text[:100] if r.text else 'empty'}")

if r.status_code == 200:
    data = r.json()
    print(f"  Name: {data.get('name', 'N/A')}")
    print(f"  Status: {data.get('status', 'N/A')}")
    print(f"  Region: {data.get('region', 'N/A')}")

# Try executing SQL via the database/query endpoint
r = httpx.post(
    f"https://api.supabase.com/v1/projects/{project}/database/query",
    headers=headers,
    json={"query": sql[:100]},
    timeout=10,
)
print(f"\nDatabase query API: {r.status_code}")
print(f"  Response: {r.text[:200]}")
