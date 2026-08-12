import { STORAGE_KEYS } from '../constants/forumStorageKeys.js';

const StorageService = {
  get(key, reviver) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw, reviver);
    } catch (err) {
      if (err instanceof SyntaxError) {
        console.warn(`[StorageService] parse failed for ${key}`, err);
      } else {
        console.warn(`[StorageService] get failed for ${key}`, err);
      }
      return null;
    }
  },

  set(key, value, replacer) {
    try {
      const str = JSON.stringify(value, replacer);
      if (str.length > 5_000_000) {
        console.warn(`[StorageService] value large ${str.length} chars for ${key}`);
      }
      if (import.meta.env?.DEV) {
        console.debug(`[StorageService] SET ${key}`, str.length);
      }
      localStorage.setItem(key, str);
    } catch (err) {
      console.warn(`[StorageService] set failed for ${key}`, err);
    }
  },

  remove(key) {
    try {
      if (import.meta.env?.DEV) {
        console.debug(`[StorageService] REMOVE ${key}`);
      }
      localStorage.removeItem(key);
    } catch (err) {
      console.warn(`[StorageService] remove failed for ${key}`, err);
    }
  },

  clearAll(preserveSchemaVersion = true) {
    const allKeys = this.getAllKeys();
    for (const k of allKeys) {
      if (preserveSchemaVersion && k === STORAGE_KEYS.SCHEMA_VERSION) {
        continue;
      }
      this.remove(k);
    }
  },

  getAllKeys() {
    return Object.keys(localStorage).filter(k => k.startsWith('aiforum_'));
  },
};

export default StorageService;
