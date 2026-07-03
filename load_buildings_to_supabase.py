"""
Load rongai_buildings.geojson into Supabase via bulk_insert_buildings RPC.
Usage: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars, then run.
"""
import json, os, urllib.request, urllib.error
from pathlib import Path
from textwrap import dedent

GEOJSON_PATH = Path(__file__).parent / "rongai_buildings.geojson"
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SERVICE_ROLE = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SERVICE_ROLE:
    print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables first.")
    print("  $env:SUPABASE_URL='https://vxhsftwixqepzxvctsvp.supabase.co'")
    print("  $env:SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'")
    raise SystemExit(1)

RPC_URL = f"{SUPABASE_URL}/rest/v1/rpc/bulk_insert_buildings"
HEADERS = {
    "apikey": SERVICE_ROLE,
    "Authorization": f"Bearer {SERVICE_ROLE}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

print(f"Reading {GEOJSON_PATH} ({(GEOJSON_PATH.stat().st_size / 1024 / 1024):.1f} MB)...")
with open(GEOJSON_PATH) as f:
    geojson = json.load(f)

features = geojson["features"]
total = len(features)
print(f"Total features: {total}")

# Supabase RPC accepts jsonb; we send features array in batches
BATCH = 2000
inserted = 0
errors = 0

for i in range(0, total, BATCH):
    batch = features[i:i+BATCH]
    payload = {
        "p_features": batch,
        "p_default_height_m": 8,
        "p_default_status": "unverified"
    }
    req = urllib.request.Request(
        RPC_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers=HEADERS,
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            body = json.loads(resp.read())
            n = body if isinstance(body, int) else len(body) if isinstance(body, list) else 0
            inserted += n
    except urllib.error.HTTPError as e:
        errors += 1
        err_body = e.read().decode("utf-8", errors="replace")
        print(f"  Batch {i//BATCH + 1} HTTP {e.code}: {err_body[:200]}")
    except Exception as e:
        errors += 1
        print(f"  Batch {i//BATCH + 1} error: {e}")

    if (i // BATCH + 1) % 5 == 0:
        print(f"  Progress: {min(i+BATCH, total)}/{total} features processed...")

print(f"\nDone. Inserted: {inserted}, Errors: {errors}")
print(f"\nNext: verify in Supabase Dashboard → Table Editor → buildings")
