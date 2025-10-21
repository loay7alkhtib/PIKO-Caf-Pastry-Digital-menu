#!/usr/bin/env python3
"""
Execute all UPDATE statements using Supabase client
"""

import os
import sys
from supabase import create_client

# Get Supabase credentials from environment
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SERVICE_KEY:
    print("Error: Missing SUPABASE_URL or SERVICE_KEY environment variables")
    sys.exit(1)

# Create Supabase client
supabase = create_client(SUPABASE_URL, SERVICE_KEY)

# Read all UPDATE statements from remaining_updates.sql
with open("remaining_updates.sql", "r") as f:
    updates = [line.strip() for line in f if line.strip().startswith("UPDATE")]

print(f"Total UPDATE statements to execute: {len(updates)}")

# Execute updates in batches of 20
batch_size = 20
success_count = 0
error_count = 0

for i in range(0, len(updates), batch_size):
    batch = updates[i:i+batch_size]
    batch_sql = "\n".join(batch)
    
    try:
        # Execute the batch
        supabase.rpc("exec_sql", {"query": batch_sql}).execute()
        success_count += len(batch)
        print(f"✅ Executed batch {i//batch_size + 1}: {len(batch)} updates (Total: {success_count}/{len(updates)})")
    except Exception as e:
        error_count += len(batch)
        print(f"❌ Error in batch {i//batch_size + 1}: {e}")

print(f"\n📊 Summary:")
print(f"✅ Success: {success_count}")
print(f"❌ Errors: {error_count}")

