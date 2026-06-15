import json
import subprocess
import sys
from pathlib import Path

def import_songs():
    export_dir = Path("pco_export_chants")
    
    # Importer les chants
    with open(export_dir / "songs_for_d1.json", "r", encoding="utf-8") as f:
        songs = json.load(f)
    
    print(f"📥 Import de {len(songs)} chants dans D1 (remote)...")
    
    for i, song in enumerate(songs):
        title = song["title"].replace("'", "''")
        author = (song["author"] or "").replace("'", "''")
        ccli = (song["ccli_number"] or "").replace("'", "''")
        copyright = (song["copyright"] or "").replace("'", "''")
        themes = (song["themes"] or "").replace("'", "''")
        notes = (song["notes"] or "").replace("'", "''")
        
        sql = f"""INSERT OR IGNORE INTO songs (title, author, ccli_number, copyright, themes, notes)
                  VALUES ('{title}', '{author}', '{ccli}', '{copyright}', '{themes}', '{notes}');"""
        
        try:
            result = subprocess.run(
                ["npx", "wrangler", "d1", "execute", "eglise-db", "--remote", "--command", sql],
                capture_output=True, text=True, check=True
            )
            if (i + 1) % 10 == 0:
                print(f"  ✅ {i + 1}/{len(songs)} chants importés...")
        except subprocess.CalledProcessError as e:
            print(f"  ⚠️ Erreur pour '{title}': {e.stderr}")
    
    print(f"✅ {len(songs)} chants importés dans D1")

def import_arrangements():
    export_dir = Path("pco_export_chants")
    
    # Utiliser le fichier corrigé si disponible
    fixed_file = export_dir / "arrangements_fixed.json"
    if fixed_file.exists():
        print(f"\n📥 Import de arrangements (fichier corrigé)...")
        with open(fixed_file, "r", encoding="utf-8") as f:
            arrangements = json.load(f)
    else:
        print(f"\n📥 Import de {len(arrangements)} arrangements dans D1...")
        with open(export_dir / "arrangements_for_d1.json", "r", encoding="utf-8") as f:
            arrangements = json.load(f)
    
    success_count = 0
    for i, arr in enumerate(arrangements):
        name = arr["name"].replace("'", "''")
        key = (arr["key"] or "").replace("'", "''")
        tempo = arr["tempo"] if arr.get("tempo") is not None else "NULL"
        chord_chart = (arr["chord_chart"] or "").replace("'", "''")
        
        # Si song_id est déjà présent (fichier corrigé)
        if "song_id" in arr:
            song_id = arr["song_id"]
        else:
            song_title = arr["song_title"].strip()
            print(f"  ⚠️ Chant non trouvé (pas de song_id): {song_title}")
            continue
        
        sql = f"""INSERT OR IGNORE INTO arrangements (song_id, name, key, tempo, chord_chart)
                  VALUES ({song_id}, '{name}', '{key}', {tempo}, '{chord_chart}');"""
        
        try:
            subprocess.run(
                ["npx", "wrangler", "d1", "execute", "eglise-db", "--remote", "--command", sql],
                capture_output=True, text=True, check=True
            )
            success_count += 1
            if success_count % 10 == 0:
                print(f"  ✅ {success_count}/{len(arrangements)} arrangements importés...")
        except subprocess.CalledProcessError as e:
            print(f"  ⚠️ Erreur pour '{name}': {e.stderr}")
    
    print(f"✅ {success_count} arrangements importés dans D1")

if __name__ == "__main__":
    import_songs()
    import_arrangements()
    print("\n🎉 Import terminé ! Vérifiez dans D1 avec :")
    print("  wrangler d1 execute eglise-db --command 'SELECT COUNT(*) FROM songs;'")
