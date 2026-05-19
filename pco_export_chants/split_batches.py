#!/usr/bin/env python3
"""Split SQL file into batches of N INSERT statements for D1 import."""
import sys, os, re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SQL_FILE = os.path.join(SCRIPT_DIR, 'arrangements_d1_import.sql')
BATCH_SIZE = 10

with open(SQL_FILE, encoding='utf-8') as f:
    content = f.read()

# Split into INSERT statements (ignore comment lines at start)
lines = content.split('\n')
comment_lines = []
sql_lines = []
for line in lines:
    stripped = line.strip()
    if stripped.startswith('--'):
        comment_lines.append(line)
    else:
        sql_lines.append(line)

full_sql = '\n'.join(sql_lines)

# Split by INSERT OR (IGNORE/REPLACE)
# Match "INSERT OR IGNORE" or "INSERT OR REPLACE"
pattern = r'(INSERT\s+OR\s+(?:IGNORE|REPLACE).*?;)\s*'
matches = list(re.finditer(pattern, full_sql, re.IGNORECASE | re.DOTALL))

print(f"Found {len(matches)} INSERT statements")

# Header to prepend to each batch
header = '\n'.join(comment_lines) + '\n' if comment_lines else ''

OUT_DIR = os.path.join(SCRIPT_DIR, 'batches')
os.makedirs(OUT_DIR, exist_ok=True)

# Clean old batches
import glob
for f in glob.glob(os.path.join(OUT_DIR, 'batch_*.sql')):
    os.remove(f)

batch_num = 0
for i in range(0, len(matches), BATCH_SIZE):
    batch_num += 1
    batch_matches = matches[i:i+BATCH_SIZE]
    stmts = [m.group(1) for m in batch_matches]
    # Normalize whitespace
    stmts = [re.sub(r'\s+', ' ', s).strip() for s in stmts]
    batch_content = header + '\n'.join(stmts)
    out_file = os.path.join(OUT_DIR, f'batch_{batch_num:03d}.sql')
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write(batch_content)
    print(f"  batch_{batch_num:03d}.sql: {len(stmts)} statements")

print(f"\nGenerated {batch_num} batches in {OUT_DIR}")