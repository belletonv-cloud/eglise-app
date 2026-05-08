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

def main():
    export_dir = Path("pco_export_chants")
    export_dir.mkdir(exist_ok=True)
    
    print("📥 Récupération de tous vos chants...")
    songs = fetch_paginated("/songs")
    print(f"✅ {len(songs)} chants trouvés")
    
    # Préparer les données pour import D1
    songs_data = []
    arrangements_data = []
    attachments_data = []
    
    for song in songs:
        song_id = song["id"]
        attrs = song["attributes"]
        title = attrs["title"] or f"chant_{song_id}"
        safe_title = "".join(c for c in title if c.isalnum() or c in (" ", "-", "_")).strip()
        song_dir = export_dir / safe_title
        song_dir.mkdir(exist_ok=True)
        
        # Métadonnées du chant
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
        
        # Ajouter à la liste pour import D1
        songs_data.append({
            "title": title,
            "author": attrs.get("author"),
            "ccli_number": str(attrs.get("ccli_number", "")),
            "copyright": attrs.get("copyright"),
            "themes": attrs.get("themes"),
            "notes": attrs.get("notes")
        })
        
        # Récupérer les arrangements
        print(f"🎵 Arrangements pour : {title}")
        arrangements = fetch_paginated(f"/songs/{song_id}/arrangements")
        
        for arr in arrangements:
            arr_id = arr["id"]
            arr_attrs = arr["attributes"]
            arr_name = arr_attrs.get("name") or f"arrangement_{arr_id}"
            safe_arr = "".join(c for c in arr_name if c.isalnum() or c in (" ", "-", "_")).strip()
            arr_dir = song_dir / safe_arr
            arr_dir.mkdir(exist_ok=True)
            
            # Métadonnées arrangement
            arr_meta = {
                "id": arr_id,
                "nom": arr_name,
                "clef_originale": arr_attrs.get("key"),
                "tempo": arr_attrs.get("tempo"),
                "chord_chart": arr_attrs.get("chord_chart")
            }
            with open(arr_dir / "metadata_arrangement.json", "w", encoding="utf-8") as f:
                json.dump(arr_meta, f, indent=2, ensure_ascii=False)
            
            # Sauvegarder la grille d'accords
            if arr_attrs.get("chord_chart"):
                with open(arr_dir / f"{safe_arr}.cho", "w", encoding="utf-8") as f:
                    f.write(arr_attrs["chord_chart"])
            
            # Ajouter à la liste pour import D1
            arrangements_data.append({
                "song_title": title,
                "name": arr_name,
                "key": arr_attrs.get("key"),
                "tempo": arr_attrs.get("tempo"),
                "chord_chart": arr_attrs.get("chord_chart")
            })
            
            # Télécharger les fichiers joints
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
    
    # Sauvegarder les données pour import D1
    with open(export_dir / "songs_for_d1.json", "w", encoding="utf-8") as f:
        json.dump(songs_data, f, indent=2, ensure_ascii=False)
    
    with open(export_dir / "arrangements_for_d1.json", "w", encoding="utf-8") as f:
        json.dump(arrangements_data, f, indent=2, ensure_ascii=False)
    
    with open(export_dir / "attachments_for_d1.json", "w", encoding="utf-8") as f:
        json.dump(attachments_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n🎉 Export terminé !")
    print(f"📁 Fichiers sauvegardés dans : {export_dir.absolute()}")
    print(f"📊 {len(songs_data)} chants, {len(arrangements_data)} arrangements exportés")
    print(f"💾 Fichiers JSON prêts pour import D1 :")
    print(f"   - songs_for_d1.json")
    print(f"   - arrangements_for_d1.json")
    print(f"   - attachments_for_d1.json")

if __name__ == "__main__":
    main()
