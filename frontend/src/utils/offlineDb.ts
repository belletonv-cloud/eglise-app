const DB_NAME = 'eglise-offline';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('offline_songs')) {
        db.createObjectStore('offline_songs', { keyPath: 'song_id' });
      }
    };
  });
}

export async function saveSongOffline(song: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_songs', 'readwrite');
    const store = tx.objectStore('offline_songs');
    store.put({ song_id: song.id, song, downloaded_at: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflineSongs(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_songs', 'readonly');
    const store = tx.objectStore('offline_songs');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.map((r: any) => r.song));
    request.onerror = () => reject(request.error);
  });
}

export async function isSongOffline(songId: number): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_songs', 'readonly');
    const store = tx.objectStore('offline_songs');
    const request = store.get(songId);
    request.onsuccess = () => resolve(!!request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removeOfflineSong(songId: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_songs', 'readwrite');
    const store = tx.objectStore('offline_songs');
    store.delete(songId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflineSongById(songId: number): Promise<any | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_songs', 'readonly');
    const store = tx.objectStore('offline_songs');
    const request = store.get(songId);
    request.onsuccess = () => resolve(request.result?.song || null);
    request.onerror = () => reject(request.error);
  });
}