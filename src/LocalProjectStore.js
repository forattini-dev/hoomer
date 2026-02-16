const DEFAULT_DB_NAME = 'ffplanner-local';
const DEFAULT_STORE_NAME = 'projects';
const DEFAULT_DB_VERSION = 1;
const DEFAULT_FALLBACK_KEY = 'ffplanner:local-project';

function hasWindowStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function hasIndexedDb() {
  return typeof window !== 'undefined' && !!window.indexedDB;
}

function safeParse(jsonText) {
  try { return JSON.parse(jsonText); } catch {
    return null;
  }
}

function now() {
  return Date.now();
}

export class LocalProjectStore {
  constructor({
    dbName = DEFAULT_DB_NAME,
    storeName = DEFAULT_STORE_NAME,
    dbVersion = DEFAULT_DB_VERSION,
    projectKey = 'default',
    localStorageKey = DEFAULT_FALLBACK_KEY,
  } = {}) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.dbVersion = dbVersion;
    this.projectKey = projectKey;
    this.localStorageKey = `${localStorageKey}:${projectKey}`;
    this._db = null;
    this._dbReady = null;
  }

  async save(payload) {
    const record = this._normalizeRecord(payload);
    if (!record) return null;

    try {
      if (this._supportsIndexedDb()) {
        return await this._saveRecordIndexedDb(record);
      }
    } catch (err) {
      console.warn('IndexedDB save failed, using localStorage', err);
    }

    this._saveRecordLocalStorage(record);
    return record;
  }

  async load() {
    if (this._supportsIndexedDb()) {
      try {
        const fromDb = await this._loadRecordIndexedDb();
        if (fromDb) return this._extractPayload(fromDb);
      } catch (err) {
        console.warn('IndexedDB load failed, using localStorage', err);
      }
    }

    const fromLocal = this._loadRecordLocalStorage();
    return fromLocal ? this._extractPayload(fromLocal) : null;
  }

  async _saveRecordIndexedDb(record) {
    const db = await this._getDb();
    if (!db) return null;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.put(record, this.projectKey);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => resolve(record);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async _loadRecordIndexedDb() {
    const db = await this._getDb();
    if (!db) return null;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.get(this.projectKey);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  _saveRecordLocalStorage(record) {
    if (!hasWindowStorage()) return;
    localStorage.setItem(this.localStorageKey, JSON.stringify(record));
  }

  _loadRecordLocalStorage() {
    if (!hasWindowStorage()) return null;
    const raw = localStorage.getItem(this.localStorageKey);
    return safeParse(raw);
  }

  _extractPayload(record) {
    if (!record || typeof record !== 'object') return null;
    if (record.payload && typeof record.payload === 'object') return record.payload;
    if (record.data && typeof record.data === 'object') return record.data;
    return record;
  }

  _normalizeRecord(payload) {
    if (!payload || typeof payload !== 'object') return null;
    return {
      id: this.projectKey,
      payload,
      updatedAt: now(),
      schemaVersion: 1,
    };
  }

  _supportsIndexedDb() {
    return hasIndexedDb();
  }

  async _getDb() {
    if (this._db) return this._db;
    if (!this._supportsIndexedDb()) return null;

    if (!this._dbReady) {
      this._dbReady = new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.dbVersion);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName);
          }
        };
        request.onsuccess = () => {
          this._db = request.result;
          resolve(this._db);
        };
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(request.error || new Error('IndexedDB open blocked'));
      });
    }

    try {
      return await this._dbReady;
    } catch (err) {
      this._dbReady = null;
      this._db = null;
      return null;
    }
  }
}
