#!/bin/bash

# Execute all remaining UPDATE statements from the SQL file
# This script will execute them in batches

SQL_FILE="update_all_prices.sql"
BATCH_SIZE=20
START_LINE=91  # We've already done ~90 updates

total_lines=$(grep -c "^UPDATE" "$SQL_FILE")
echo "Total updates: $total_lines"
echo "Starting from line: $START_LINE"
echo "Remaining: $((total_lines - START_LINE + 1))"

# Extract all remaining UPDATE statements
grep "^UPDATE" "$SQL_FILE" | tail -n +$START_LINE > remaining_updates.sql

echo "Created remaining_updates.sql with $(wc -l < remaining_updates.sql) statements"
echo "Ready to execute via Supabase MCP tools"

