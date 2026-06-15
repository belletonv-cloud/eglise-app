#!/usr/bin/env python3
"""
Import PCO data (people, teams, service types, plans) into Cloudflare D1.
Usage: python import_pco_data.py
"""

import os
import json
import subprocess
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

EXPORT_DIR = Path("pco_export_chants")

def get_d1_db_id():
    """Get the D1 database ID from wrangler.toml"""
    wrangler = Path("wrangler.toml")
    if not wrangler.exists():
        print("❌ wrangler.toml not found")
        sys.exit(1)
    
    content = wrangler.read_text()
    # Simple parsing - look for database_id
    for line in content.split("\n"):
        if "database_id" in line:
            return line.split("=")[1].strip().strip('"').strip("'")
    print("❌ Could not find database_id in wrangler.toml")
    sys.exit(1)

def run_sql(sql, db_id=None):
    """Run SQL against D1"""
    if db_id is None:
        db_id = get_d1_db_id()
    
    cmd = ["npx", "wrangler", "d1", "execute", "eglise-db", "--remote", "--command", sql]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"❌ SQL error: {result.stderr}")
        return False
    return True

def import_people(people_data):
    """Import people into members table"""
    print(f"\n👥 Importing {len(people_data)} people...")
    
    for person in people_data:
        if not person.get("first_name") and not person.get("last_name"):
            continue
        
        first_name = person.get("first_name") or ""
        last_name = person.get("last_name") or ""
        email = person.get("email") or ""
        phone = person.get("phone") or ""
        status = person.get("status", "member")
        
        # Map PCO status to membership_type
        membership_type = "member"
        if status == "archived":
            membership_type = "inactive"
        
        # Escape single quotes
        first_name = first_name.replace("'", "''")
        last_name = last_name.replace("'", "''")
        email = email.replace("'", "''")
        phone = phone.replace("'", "''")
        
        # Check if member already exists (by email)
        if email:
            check_sql = f"SELECT id FROM members WHERE email = '{email}' LIMIT 1"
            result = subprocess.run(
                ["npx", "wrangler", "d1", "execute", "eglise-db", "--remote", "--command", check_sql],
                capture_output=True, text=True
            )
            if result.returncode == 0 and "[]" not in result.stdout and result.stdout.strip():
                print(f"  ⏭️  Skipping {first_name} {last_name} (already exists)")
                continue
        
        sql = f"""INSERT INTO members (first_name, last_name, email, phone, membership_type, notes)
                  VALUES ('{first_name}', '{last_name}', '{email}', '{phone}', '{membership_type}', 'Imported from PCO (pco_id: {person.get("pco_id")})')"""
        
        if run_sql(sql):
            print(f"  ✅ {first_name} {last_name}")
        else:
            print(f"  ❌ Failed: {first_name} {last_name}")

def import_teams(teams_data):
    """Import teams into teams table"""
    print(f"\n🎪 Importing {len(teams_data)} teams...")
    
    for team in teams_data:
        if not team.get("name"):
            continue
        
        name = team["name"].replace("'", "''")
        description = (team.get("description") or "").replace("'", "''")
        
        # Check if team already exists
        check_sql = f"SELECT id FROM teams WHERE name = '{name}' LIMIT 1"
        result = subprocess.run(
            ["npx", "wrangler", "d1", "execute", "eglise-db", "--remote", "--command", check_sql],
            capture_output=True, text=True
        )
        if result.returncode == 0 and "[]" not in result.stdout and result.stdout.strip():
            print(f"  ⏭️  Skipping {team['name']} (already exists)")
            continue
        
        sql = f"""INSERT INTO teams (name, description)
                  VALUES ('{name}', '{description}')"""
        
        if run_sql(sql):
            print(f"  ✅ {team['name']}")
        else:
            print(f"  ❌ Failed: {team['name']}")

def import_service_types(service_types_data):
    """Import service types into service_types table"""
    print(f"\n📋 Importing {len(service_types_data)} service types...")
    
    for st in service_types_data:
        if not st.get("name"):
            continue
        
        name = st["name"].replace("'", "''")
        description = (st.get("description") or "").replace("'", "''")
        color = st.get("color") or "#3b82f6"
        
        # Check if service type already exists
        check_sql = f"SELECT id FROM service_types WHERE name = '{name}' LIMIT 1"
        result = subprocess.run(
            ["npx", "wrangler", "d1", "execute", "eglise-db", "--remote", "--command", check_sql],
            capture_output=True, text=True
        )
        if result.returncode == 0 and "[]" not in result.stdout and result.stdout.strip():
            print(f"  ⏭️  Skipping {st['name']} (already exists)")
            continue
        
        sql = f"""INSERT INTO service_types (name, description, color)
                  VALUES ('{name}', '{description}', '{color}')"""
        
        if run_sql(sql):
            print(f"  ✅ {st['name']}")
        else:
            print(f"  ❌ Failed: {st['name']}")

def main():
    print("🚀 Import PCO data into D1")
    print("=" * 40)
    
    # Load data files
    people_file = EXPORT_DIR / "people_for_d1.json"
    teams_file = EXPORT_DIR / "teams_for_d1.json"
    service_types_file = EXPORT_DIR / "service_types_for_d1.json"
    
    if not people_file.exists() and not teams_file.exists() and not service_types_file.exists():
        print("❌ No export files found. Run export_pco_songs.py first.")
        sys.exit(1)
    
    # Import people
    if people_file.exists():
        people_data = json.loads(people_file.read_text(encoding="utf-8"))
        import_people(people_data)
    
    # Import teams
    if teams_file.exists():
        teams_data = json.loads(teams_file.read_text(encoding="utf-8"))
        import_teams(teams_data)
    
    # Import service types
    if service_types_file.exists():
        service_types_data = json.loads(service_types_file.read_text(encoding="utf-8"))
        import_service_types(service_types_data)
    
    print("\n🎉 Import terminé !")
    print("💡 Les plans (services) nécessitent un mapping plus complexe avec les éléments existants.")
    print("   Utilisez l'interface web pour créer les services manuellement ou via l'import PCO direct.")

if __name__ == "__main__":
    main()
