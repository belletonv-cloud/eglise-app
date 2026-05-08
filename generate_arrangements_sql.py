import json
from pathlib import Path
import unicodedata

def normalize_title(title):
    title = unicodedata.normalize('NFD', title)
    title = ''.join(c for c in title if unicodedata.category(c) != 'Mn')
    title = title.replace("'", " ").replace("’", " ").replace("'", " ")
    return ' '.join(title.split()).lower().strip()

def main():
    export_dir = Path("pco_export_chants")
    
    # 1. Mapping des chants depuis le JSON local
    with open(export_dir / "songs_for_d1.json", "r", encoding="utf-8") as f:
        songs = json.load(f)
    
    song_map = {}  # {normalized_title: original_title}
    for s in songs:
        norm = normalize_title(s["title"])
        song_map[norm] = s["title"]
    
    print(f"✅ {len(song_map)} chants dans le mapping")
    
    # 2. Charger arrangements
    with open(export_dir / "arrangements_for_d1.json", "r", encoding="utf-8") as f:
        arrangements = json.load(f)
    
    # 3. Générer SQL avec sous-requête
    sql_lines = ["-- Import arrangements avec sous-requête\n"]
    success = 0
    failed = []
    
    for arr in arrangements:
        song_title = arr.get("song_title", "").strip()
        norm_song = normalize_title(song_title)
        
        # Trouver le titre original
        matched_title = song_map.get(norm_song)
        if not matched_title:
            # Chercher correspondance partielle
            for norm_key, orig_title in song_map.items():
                if norm_song in norm_key or norm_key in norm_song:
                    matched_title = orig_title
                    break
        
        if not matched_title:
            if song_title and len(song_title) > 2 and not song_title.startswith("z"):
                failed.append(song_title)
            continue
        
        name = arr["name"].replace("'", "''")
        key = (arr.get("key") or "").replace("'", "''")
        tempo = arr.get("tempo")
        if tempo is None:
            tempo = "NULL"
        chord_chart = (arr.get("chord_chart") or "").replace("'", "''")
        
        # SQL avec sous-requête pour trouver song_id
        sql = f"""INSERT OR IGNORE INTO arrangements (song_id, name, key, tempo, chord_chart)
SELECT id, '{name}', '{key}', {tempo}, '{chord_chart}'
FROM songs WHERE title = '{matched_title.replace("'", "''")}';"""
        
        sql_lines.append(sql)
        success += 1
    
    # 4. Écrire le fichier SQL
    sql_file = export_dir / "arrangements_import.sql"
    with open(sql_file, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))
    
    print(f"✅ {success} arrangements prêts pour import")
    if failed:
        print(f"⚠️ {len(failed)} sans correspondance :")
        for t in failed[:5]:
            print(f"   - {t}")
    
    print(f"\n💾 Fichier : {sql_file}")
    print(f"🚀 Pour importer :")
    print(f"   npx wrangler d1 execute eglise-db --remote --file={sql_file}")

if __name__ == "__main__":
    main()
