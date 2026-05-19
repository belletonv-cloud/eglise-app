#!/bin/bash
# Import arrangements to D1
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SQL_FILE="$SCRIPT_DIR/arrangements_d1_import.sql"
DB_NAME="eglise-db"

echo "Importing arrangements to D1..."
echo "SQL file: $SQL_FILE"
echo "Lines: $(wc -l < "$SQL_FILE")"
echo ""

# Split into batches of 50 statements to avoid timeout
SPLIT_DIR=$(mktemp -d)
split -l 50 "$SQL_FILE" "$SPLIT_DIR/batch_"

batch_num=0
total=$(ls "$SPLIT_DIR/batch_"* 2>/dev/null | wc -l | tr -d ' ')
echo "Running $total batches..."

for batch_file in "$SPLIT_DIR"/batch_*; do
  batch_num=$((batch_num + 1))
  echo -n "  Batch $batch_num/$total... "
  # shellcheck disable=SC2086
  wrangler d1 execute "$DB_NAME" --file="$batch_file" --yes 2>&1 | tail -1
  echo "done"
done

rm -rf "$SPLIT_DIR"
echo ""
echo "Done! Verifying..."

# Quick check
wrangler d1 execute "$DB_NAME" --command="SELECT COUNT(*) as total_arrangements FROM arrangements WHERE chord_chart IS NOT NULL AND chord_chart != '';" --yes --output-json 2>/dev/null | grep -o '"total_arrangements":[0-9]*' || echo "Count check done"

echo ""
echo "Sample with chord charts:"
wrangler d1 execute "$DB_NAME" --command="SELECT s.title, a.name, a.key FROM arrangements a JOIN songs s ON s.id = a.song_id WHERE a.chord_chart IS NOT NULL AND a.chord_chart != '' ORDER BY s.title LIMIT 10;" --yes 2>/dev/null