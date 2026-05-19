import os
import json
import time
from pathlib import Path
from dotenv import load_dotenv
import requests

load_dotenv()

# Configuration
PCO_TOKEN_ID = os.getenv("PCO_TOKEN_ID")
PCO_TOKEN_SECRET = os.getenv("PCO_TOKEN_SECRET")
BASE_URL = "https://api.planningcenteronline.com/services/v2"

if not PCO_TOKEN_ID or not PCO_TOKEN_SECRET:
    raise ValueError("⚠️ Vous devez remplir PCO_TOKEN_ID et PCO_TOKEN_SECRET dans le fichier .env")

session = requests.Session()
session.auth = (PCO_TOKEN_ID, PCO_TOKEN_SECRET)

def fetch_paginated(endpoint, params=None):
    """Récupère toutes les pages d'un endpoint paginé"""
    params = params or {}
    params["per_page"] = 100
    offset = 0
    all_items = []
    
    while True:
        params["offset"] = offset
        resp = session.get(f"{BASE_URL}{endpoint}", params=params)
        resp.raise_for_status()
        data = resp.json()
        all_items.extend(data.get("data", []))
        
        if not data.get("links", {}).get("next"):
            break
        offset += 100
        time.sleep(0.1)
    return all_items

def download_file(url, save_path):
    """Télécharge un fichier joint"""
    resp = session.get(url, stream=True)
    resp.raise_for_status()
    with open(save_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)

def export_songs(export_dir):
    """Export songs, arrangements, and attachments"""
    print("📥 Récupération de tous vos chants...")
    songs = fetch_paginated("/songs")
    print(f"✅ {len(songs)} chants trouvés")
    
    songs_data = []
    arrangements_data = []
    attachments_data = []
    
    for song in songs:
        song_id = song["id"]
        attrs = song["attributes"]
        title = attrs["title"] or f"chant_{song_id}"
        safe_title = "".join(c for c in title if c.isalnum() or c in (" ", "-", "_")).strip()
        song_dir = export_dir / "chants" / safe_title
        song_dir.mkdir(exist_ok=True, parents=True)
        
        song_meta = {
            "id": song_id,
            "titre": title,
            "auteur": attrs.get("author"),
            "numero_ccli": attrs.get("ccli_number"),
            "copyright": attrs.get("copyright"),
            "themes": attrs.get("themes"),
            "notes": attrs.get("notes")
        }
        with open(song_dir / "metadata_chant.json", "w", encoding="utf-8") as f:
            json.dump(song_meta, f, indent=2, ensure_ascii=False)
        
        songs_data.append({
            "title": title,
            "author": attrs.get("author"),
            "ccli_number": str(attrs.get("ccli_number", "")),
            "copyright": attrs.get("copyright"),
            "themes": attrs.get("themes"),
            "notes": attrs.get("notes")
        })
        
        print(f"🎵 Arrangements pour : {title}")
        arrangements = fetch_paginated(f"/songs/{song_id}/arrangements")
        
        for arr in arrangements:
            arr_id = arr["id"]
            arr_attrs = arr["attributes"]
            arr_name = arr_attrs.get("name") or f"arrangement_{arr_id}"
            safe_arr = "".join(c for c in arr_name if c.isalnum() or c in (" ", "-", "_")).strip()
            arr_dir = song_dir / safe_arr
            arr_dir.mkdir(exist_ok=True)
            
            arr_meta = {
                "id": arr_id,
                "nom": arr_name,
                "clef_originale": arr_attrs.get("key"),
                "tempo": arr_attrs.get("tempo"),
                "chord_chart": arr_attrs.get("chord_chart")
            }
            with open(arr_dir / "metadata_arrangement.json", "w", encoding="utf-8") as f:
                json.dump(arr_meta, f, indent=2, ensure_ascii=False)
            
            if arr_attrs.get("chord_chart"):
                with open(arr_dir / f"{safe_arr}.cho", "w", encoding="utf-8") as f:
                    f.write(arr_attrs["chord_chart"])
            
            arrangements_data.append({
                "song_title": title,
                "name": arr_name,
                "key": arr_attrs.get("key"),
                "tempo": arr_attrs.get("tempo"),
                "chord_chart": arr_attrs.get("chord_chart")
            })
            
            attachments = fetch_paginated(f"/songs/{song_id}/attachments")
            if attachments:
                attach_dir = arr_dir / "fichiers_joints"
                attach_dir.mkdir(exist_ok=True)
                for att in attachments:
                    att_attrs = att["attributes"]
                    file_url = att_attrs.get("url")
                    if file_url:
                        filename = att_attrs.get("filename") or f"fichier_{att['id']}"
                        print(f"  ⬇️ Téléchargement : {filename}")
                        download_file(file_url, attach_dir / filename)
                        attachments_data.append({
                            "entity_type": "arrangement",
                            "entity_id": arr_id,
                            "filename": filename,
                            "file_url": file_url,
                            "file_type": filename.split(".")[-1] if "." in filename else "unknown"
                        })
            
            time.sleep(0.1)
    
    with open(export_dir / "songs_for_d1.json", "w", encoding="utf-8") as f:
        json.dump(songs_data, f, indent=2, ensure_ascii=False)
    
    with open(export_dir / "arrangements_for_d1.json", "w", encoding="utf-8") as f:
        json.dump(arrangements_data, f, indent=2, ensure_ascii=False)
    
    with open(export_dir / "attachments_for_d1.json", "w", encoding="utf-8") as f:
        json.dump(attachments_data, f, indent=2, ensure_ascii=False)
    
    print(f"📊 {len(songs_data)} chants, {len(arrangements_data)} arrangements exportés")
    return songs_data, arrangements_data

def export_people(export_dir):
    """Export people (members/volunteers) from PCO"""
    print("\n👥 Récupération des personnes...")
    people = fetch_paginated("/people")
    print(f"✅ {len(people)} personnes trouvées")
    
    people_data = []
    for person in people:
        attrs = person["attributes"]
        people_data.append({
            "pco_id": person["id"],
            "first_name": attrs.get("first_name"),
            "last_name": attrs.get("last_name"),
            "email": attrs.get("email"),
            "phone": attrs.get("phone_number") or attrs.get("cell_number"),
            "status": attrs.get("status"),
            "nickname": attrs.get("nickname"),
            "middle_name": attrs.get("middle_name"),
            "suffix": attrs.get("suffix"),
            "birthday": attrs.get("birthday"),
            "gender": attrs.get("gender"),
            "medical_notes": attrs.get("medical_notes"),
            "site": attrs.get("site"),
            "campus": attrs.get("campus"),
        })
    
    with open(export_dir / "people_for_d1.json", "w", encoding="utf-8") as f:
        json.dump(people_data, f, indent=2, ensure_ascii=False)
    
    print(f"📊 {len(people_data)} personnes exportées")
    return people_data

def export_teams(export_dir):
    """Export teams from PCO"""
    print("\n🎪 Récupération des équipes...")
    teams = fetch_paginated("/teams")
    print(f"✅ {len(teams)} équipes trouvées")
    
    teams_data = []
    for team in teams:
        attrs = team["attributes"]
        teams_data.append({
            "pco_id": team["id"],
            "name": attrs.get("name"),
            "description": attrs.get("description"),
            "archived": attrs.get("archived"),
        })
    
    with open(export_dir / "teams_for_d1.json", "w", encoding="utf-8") as f:
        json.dump(teams_data, f, indent=2, ensure_ascii=False)
    
    print(f"📊 {len(teams_data)} équipes exportées")
    return teams_data

def export_service_types(export_dir):
    """Export service types from PCO"""
    print("\n📋 Récupération des types de service...")
    service_types = fetch_paginated("/service_types")
    print(f"✅ {len(service_types)} types de service trouvés")
    
    service_types_data = []
    for st in service_types:
        attrs = st["attributes"]
        service_types_data.append({
            "pco_id": st["id"],
            "name": attrs.get("name"),
            "description": attrs.get("description"),
            "color": attrs.get("color"),
            "archived": attrs.get("archived"),
        })
    
    with open(export_dir / "service_types_for_d1.json", "w", encoding="utf-8") as f:
        json.dump(service_types_data, f, indent=2, ensure_ascii=False)
    
    print(f"📊 {len(service_types_data)} types de service exportés")
    return service_types_data

def export_plans(export_dir):
    """Export plans (scheduled services) from PCO"""
    print("\n📅 Récupération des services planifiés...")
    plans = fetch_paginated("/plans")
    print(f"✅ {len(plans)} services trouvés")
    
    plans_data = []
    plan_items_data = []
    plan_songs_data = []
    
    for plan in plans:
        attrs = plan["attributes"]
        plans_data.append({
            "pco_id": plan["id"],
            "name": attrs.get("name"),
            "starts_at": attrs.get("starts_at"),
            "ends_at": attrs.get("ends_at"),
            "times": attrs.get("times"),
            "title": attrs.get("title"),
            "description": attrs.get("description"),
            "public_description": attrs.get("public_description"),
            "notes": attrs.get("notes"),
            "status": attrs.get("status"),
            "service_type_id": attrs.get("service_type_id"),
            "service_type_name": attrs.get("service_type_name"),
        })
        
        # Fetch plan items (order of service)
        plan_id = plan["id"]
        items = fetch_paginated(f"/plans/{plan_id}/plan_items")
        for item in items:
            item_attrs = item["attributes"]
            plan_items_data.append({
                "pco_plan_id": plan_id,
                "pco_item_id": item["id"],
                "title": item_attrs.get("title"),
                "description": item_attrs.get("description"),
                "item_type": item_attrs.get("type"),
                "position": item_attrs.get("position"),
                "duration": item_attrs.get("duration"),
            })
        
        time.sleep(0.1)
    
    with open(export_dir / "plans_for_d1.json", "w", encoding="utf-8") as f:
        json.dump(plans_data, f, indent=2, ensure_ascii=False)
    
    with open(export_dir / "plan_items_for_d1.json", "w", encoding="utf-8") as f:
        json.dump(plan_items_data, f, indent=2, ensure_ascii=False)
    
    print(f"📊 {len(plans_data)} services, {len(plan_items_data)} éléments exportés")
    return plans_data, plan_items_data

def main():
    export_dir = Path("pco_export_chants")
    export_dir.mkdir(exist_ok=True)
    
    # Export all data types
    export_songs(export_dir)
    export_people(export_dir)
    export_teams(export_dir)
    export_service_types(export_dir)
    export_plans(export_dir)
    
    print(f"\n🎉 Export terminé !")
    print(f"📁 Fichiers sauvegardés dans : {export_dir.absolute()}")
    print(f"💾 Fichiers JSON prêts pour import D1 :")
    print(f"   - songs_for_d1.json")
    print(f"   - arrangements_for_d1.json")
    print(f"   - attachments_for_d1.json")
    print(f"   - people_for_d1.json")
    print(f"   - teams_for_d1.json")
    print(f"   - service_types_for_d1.json")
    print(f"   - plans_for_d1.json")
    print(f"   - plan_items_for_d1.json")

if __name__ == "__main__":
    main()
