#!/usr/bin/env python3
"""Generate D1-compatible INSERT SQL from arrangements_for_d1.json"""

import json
import sys
import re
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_FILE = os.path.join(SCRIPT_DIR, 'arrangements_for_d1.json')

def escape_sql(s):
    if s is None:
        return "''"
    s = str(s)
    s = s.replace("'", "''")
    s = s.replace("\\", "\\\\")
    return "'" + s + "'"

with open(JSON_FILE, encoding='utf-8') as f:
    arrangements = json.load(f)

print(f"-- Generated from arrangements_for_d1.json ({len(arrangements)} arrangements)")

for arr in arrangements:
    title = arr.get('song_title', '').strip()
    name = arr.get('name', '') or ''
    key = arr.get('key') or ''
    tempo = arr.get('tempo')
    chart = arr.get('chord_chart') or ''

    if not title or title.lower() in ('zz', 'zzz', 'zzzz'):
        continue

    safe_name = name.replace("'", "''")

    if chart:
        print(f"INSERT OR REPLACE INTO arrangements (song_id, name, key, tempo, chord_chart)")
        print(f"  SELECT id, {escape_sql(safe_name)}, {escape_sql(key)}, {escape_sql(tempo) if tempo else 'NULL'}, {escape_sql(chart)}")
        print(f"  FROM songs WHERE title = {escape_sql(title)} LIMIT 1;")
    else:
        print(f"INSERT OR IGNORE INTO arrangements (song_id, name, key, tempo, chord_chart)")
        print(f"  SELECT id, {escape_sql(safe_name)}, {escape_sql(key)}, {escape_sql(tempo) if tempo else 'NULL'}, ''")
        print(f"  FROM songs WHERE title = {escape_sql(title)} LIMIT 1;")