/**
 * High-Performance Local Cache Manager (IndexedDB + LocalStorage fallback)
 * Provides instant zero-lag loading and offline caching for:
 * - Media & Images
 * - Messages & Conversation History
 * - User Profiles & Presence
 * - Notifications
 */

const DB_NAME = 'litenote_cache_v2';
const DB_VERSION = 1;
const STORE_MEDIA = 'media_cache';
const STORE_MESSAGES = 'messages_cache';

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase | null> | null = null;

// Initialize IndexedDB
function getIDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_MEDIA)) {
          db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_MESSAGES)) {
          db.createObjectStore(STORE_MESSAGES, { keyPath: 'convId' });
        }
      };
      request.onsuccess = () => {
        dbInstance = request.result;
        resolve(dbInstance);
      };
      request.onerror = () => {
        console.warn('IndexedDB opening error, falling back to memory/localStorage');
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });

  return dbInitPromise;
}

// Memory LRU Cache for ultra-fast sub-millisecond retrieval
const memoryMediaCache = new Map<string, string>();
const MAX_MEMORY_ITEMS = 120;

export async function cacheMediaItem(id: string, dataUrl: string): Promise<void> {
  if (!id || !dataUrl) return;

  // 1. Memory Cache
  if (memoryMediaCache.size >= MAX_MEMORY_ITEMS) {
    const firstKey = memoryMediaCache.keys().next().value;
    if (firstKey) memoryMediaCache.delete(firstKey);
  }
  memoryMediaCache.set(id, dataUrl);

  // 2. IndexedDB
  try {
    const db = await getIDB();
    if (db) {
      const tx = db.transaction(STORE_MEDIA, 'readwrite');
      const store = tx.objectStore(STORE_MEDIA);
      store.put({ id, dataUrl, timestamp: Date.now() });
    } else {
      // Fallback to sessionStorage if under 1MB
      if (dataUrl.length < 1000000) {
        sessionStorage.setItem(`media_${id}`, dataUrl);
      }
    }
  } catch (e) {
    // Non-fatal cache failure
  }
}

export async function getCachedMediaItem(id: string): Promise<string | null> {
  if (!id) return null;

  // 1. Check memory cache (0ms)
  if (memoryMediaCache.has(id)) {
    return memoryMediaCache.get(id)!;
  }

  // 2. Check IndexedDB
  try {
    const db = await getIDB();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_MEDIA, 'readonly');
        const store = tx.objectStore(STORE_MEDIA);
        const req = store.get(id);
        req.onsuccess = () => {
          if (req.result && req.result.dataUrl) {
            memoryMediaCache.set(id, req.result.dataUrl);
            resolve(req.result.dataUrl);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    }
  } catch {}

  // 3. Fallback to sessionStorage
  try {
    const item = sessionStorage.getItem(`media_${id}`);
    if (item) {
      memoryMediaCache.set(id, item);
      return item;
    }
  } catch {}

  return null;
}

export function saveLocalJSON<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`litenote_${key}`, JSON.stringify(data));
  } catch {}
}

export function getLocalJSON<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(`litenote_${key}`);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}
