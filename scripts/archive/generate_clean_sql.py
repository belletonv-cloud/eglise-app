import json
from pathlib import Path

def generate_clean_sql():
    export_dir = Path("pco_export_chants")
    
    with open(export_dir / "songs_for_d1.json", "r", encoding="utf-8") as f:
        songs = json.load(f)
    
    # Déduplicater par titre (garder le premier)
    seen_titles = set()
    unique_songs = []
    for song in songs:
        title = song["title"].strip()
        if title.lower() not in seen_titles:
            seen_titles.add(title.lower())
            unique_songs.append(song)
    
    print(f"📊 {len(unique_songs)} chants uniques sur {len(songs)} total")
    
    # Générer SQL
    sql_content = "-- Export propre des chants\n"
    for i, song in enumerate(unique_songs):
        title = song["title"].replace("'", "''")
        author = (song["author"] or "").replace("'", "''")
        ccli = (song["ccli_number"] or "").replace("'", "''")
        copyright = (song["copyright"] or "").replace("'", "''")
        themes = (song["themes"] or "").replace("'", "''")
        notes = (song["notes"] or "").replace("'", "''")
        
        sql_content += f"""INSERT OR IGNORE INTO songs (title, author, ccli_number, copyright, themes, notes)
VALUES ('{title}', '{author}', '{ccli}', '{copyright}', '{themes}', '{notes}');
"""
    
    # Arrangements (avec IDs corrigés)
    fixed_file = export_dir / "arrangements_fixed.json"
    if fixed_file.exists():
        with open(fixed_file, "r", encoding="utf-8") as f:
            arrangements = json.load(f)
        
        sql_content += "\n-- Export des arrangements\n"
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
    
    sql_file = export_dir / "import_clean.sql"
    with open(sql_file, "w", encoding="utf-8") as f:
        f.write(sql_content)
    
    print(f"✅ Fichier SQL propre généré : {sql_file}")
    print(f"   - {len(unique_songs)} chants uniques")
    print(f"   - Arrangements avec song_id")

if __name__ == "__main__":
    generate_clean_sql()
