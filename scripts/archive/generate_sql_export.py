import json
from pathlib import Path

def generate_sql_from_json():
    export_dir = Path("pco_export_chants")
    
    # Générer le SQL pour les chants
    with open(export_dir / "songs_for_d1.json", "r", encoding="utf-8") as f:
        songs = json.load(f)
    
    sql_content = "-- Export des chants vers D1 remote\n"
    
    for song in songs:
        title = song["title"].replace("'", "''")
        author = (song["author"] or "").replace("'", "''")
        ccli = (song["ccli_number"] or "").replace("'", "''")
        copyright = (song["copyright"] or "").replace("'", "''")
        themes = (song["themes"] or "").replace("'", "''")
        notes = (song["notes"] or "").replace("'", "''")
        
        sql_content += f"""INSERT OR IGNORE INTO songs (title, author, ccli_number, copyright, themes, notes)
VALUES ('{title}', '{author}', '{ccli}', '{copyright}', '{themes}', '{notes}');
"""
    
    # Générer le SQL pour les arrangements
    with open(export_dir / "arrangements_fixed.json", "r", encoding="utf-8") as f:
        arrangements = json.load(f)
    
    sql_content += "\n-- Export des arrangements vers D1 remote\n"
    
    for arr in arrangements:
        if "song_id" not in arr:
            continue
        song_id = arr["song_id"]
        name = arr["name"].replace("'", "''")
        key = (arr["key"] or "").replace("'", "''")
        tempo = arr["tempo"] if arr.get("tempo") is not None else "NULL"
        chord_chart = (arr["chord_chart"] or "").replace("'", "''")
        
        sql_content += f"""INSERT OR IGNORE INTO arrangements (song_id, name, key, tempo, chord_chart)
VALUES ({song_id}, '{name}', '{key}', {tempo}, '{chord_chart}');
"""
    
    # Écrire le fichier SQL
    sql_file = export_dir / "import_remote.sql"
    with open(sql_file, "w", encoding="utf-8") as f:
        f.write(sql_content)
    
    print(f"✅ Fichier SQL généré : {sql_file}")
    print(f"   - {len(songs)} chants")
    print(f"   - {len([a for a in arrangements if 'song_id' in a])} arrangements")
    print(f"\n🚀 Pour importer vers D1 remote, lancez :")
    print(f"   npx wrangler d1 execute eglise-db --remote --file={sql_file}")

if __name__ == "__main__":
    generate_sql_from_json()
