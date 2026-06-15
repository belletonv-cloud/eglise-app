import json
from pathlib import Path
import unicodedata

def normalize_title(title):
    title = unicodedata.normalize('NFD', title)
    title = ''.join(c for c in title if unicodedata.category(c) != 'Mn')
    title = title.replace("'", " ").replace("'", " ").replace("'", " ")
    return ' '.join(title.split()).lower().strip()

def main():
    export_dir = Path("pco_export_chants")
    
    # 1. Mapping songs : titre normalisé -> titre original
    with open(export_dir / "songs_for_d1.json", "r", encoding="utf-8") as f:
        songs = json.load(f)
    
    song_map = {}
    for s in songs:
        norm = normalize_title(s["title"])
        song_map[norm] = s["title"]
    
    # 2. Charger arrangements
    with open(export_dir / "arrangements_for_d1.json", "r", encoding="utf-8") as f:
        arrangements = json.load(f)
    
    # 3. Dédupliquer par (titre_chant, nom_arrangement)
    seen = set()
    unique_arrangements = []
    
    for arr in arrangements:
        song_title = arr.get("song_title", "").strip()
        name = arr.get("name", "").strip()
        key = arr.get("key", "")
        tempo = arr.get("tempo")
        chord_chart = arr.get("chord_chart", "")
        
        norm_song = normalize_title(song_title)
        matched_title = song_map.get(norm_song)
        
        if not matched_title:
            # Essayer correspondance partielle
            for norm_key, orig_title in song_map.items():
                if norm_song in norm_key or norm_key in norm_song:
                    matched_title = orig_title
                    break
        
        if not matched_title:
            continue
        
        # Clé de déduplication
        dedup_key = (matched_title, name)
        if dedup_key in seen:
            continue
        seen.add(dedup_key)
        
        unique_arrangements.append({
            "song_title": matched_title,
            "name": name,
            "key": key,
            "tempo": tempo,
            "chord_chart": chord_chart
        })
    
    print(f"✅ {len(unique_arrangements)} arrangements uniques sur {len(arrangements)} total")
    
    # 4. Générer SQL avec sous-requête
    sql_lines = ["-- Import propre des arrangements\n"]
    for arr in unique_arrangements:
        title = arr["song_title"].replace("'", "''")
        name = arr["name"].replace("'", "''")
        key = (arr["key"] or "").replace("'", "''")
        tempo = arr["tempo"] if arr["tempo"] is not None else "NULL"
        chord_chart = (arr["chord_chart"] or "").replace("'", "''")
        
        sql = f"""INSERT OR IGNORE INTO arrangements (song_id, name, key, tempo, chord_chart)
SELECT id, '{name}', '{key}', {tempo}, '{chord_chart}'
FROM songs WHERE title = '{title}';"""
        sql_lines.append(sql)
    
    sql_file = export_dir / "arrangements_clean.sql"
    with open(sql_file, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))
    
    print(f"💾 Fichier SQL : {sql_file}")
    print(f"\n🚀 Pour importer :")
    print(f"   npx wrangler d1 execute eglise-db --remote --file={sql_file}")

if __name__ == "__main__":
    main()
