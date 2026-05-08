import json
import subprocess
from pathlib import Path
import unicodedata

def normalize_title(title):
    """Normalise un titre : enlève accents, espaces excessifs, met en minuscule"""
    # Enlève les accents
    title = unicodedata.normalize('NFD', title)
    title = ''.join(c for c in title if unicodedata.category(c) != 'Mn')
    # Remplace les apostrophes par des espaces
    title = title.replace("'", " ").replace("’", " ").replace("'", " ")
    # Enlève les espaces multiples
    title = ' '.join(title.split())
    return title.lower().strip()

def main():
    export_dir = Path("pco_export_chants")
    
    # 1. Récupérer les chants de la DB distante
    print("📥 Récupération des chants depuis D1 (remote)...")
    result = subprocess.run(
        ["npx", "wrangler", "d1", "execute", "eglise-db", "--remote", "--command", 
         "SELECT id, title FROM songs;"],
        capture_output=True, text=True
    )
    
    # Parser les résultats
    song_map = {}  # {normalized_title: (id, original_title)}
    for line in result.stdout.split("\n"):
        if "|" in line and "id" not in line.lower() and "count" not in line.lower():
            parts = [p.strip() for p in line.split("|")]
            if len(parts) >= 3:
                try:
                    song_id = parts[1]
                    title = parts[2]
                    norm_title = normalize_title(title)
                    song_map[norm_title] = (song_id, title)
                except:
                    pass
    
    print(f"✅ {len(song_map)} chants récupérés de la DB")
    
    # 2. Charger les arrangements
    with open(export_dir / "arrangements_for_d1.json", "r", encoding="utf-8") as f:
        arrangements = json.load(f)
    
    # 3. Corriger les titres et associer les IDs
    success = 0
    failed = []
    
    for arr in arrangements:
        song_title = arr.get("song_title", "").strip()
        norm_song = normalize_title(song_title)
        
        # Chercher une correspondance
        if norm_song in song_map:
            arr["song_id"] = song_map[norm_song][0]
            arr["matched_title"] = song_map[norm_song][1]
            success += 1
        else:
            # Essayer de trouver une correspondance partielle
            found = False
            for norm_title, (song_id, orig_title) in song_map.items():
                if norm_song in norm_title or norm_title in norm_song:
                    arr["song_id"] = song_id
                    arr["matched_title"] = orig_title
                    success += 1
                    found = True
                    break
            if not found and len(song_title) > 2 and not song_title.startswith("z"):
                failed.append(song_title)
    
    # 4. Sauvegarder le fichier corrigé
    with open(export_dir / "arrangements_fixed.json", "w", encoding="utf-8") as f:
        json.dump(arrangements, f, indent=2, ensure_ascii=False)
    
    print(f"✅ {success} arrangements associés à un chant")
    if failed:
        print(f"⚠️ {len(failed)} arrangements sans correspondance :")
        for t in failed[:10]:
            print(f"   - {t}")
    
    print(f"\n💾 Fichier sauvegardé : {export_dir / 'arrangements_fixed.json'}")

if __name__ == "__main__":
    main()
