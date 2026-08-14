import StorageService from './storageService.js';
import { STORAGE_KEYS } from '../constants/forumStorageKeys.js';

function loadFlagsMap() {
  try {
    const stored = StorageService.get(STORAGE_KEYS.FLAGS);
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
      return stored;
    }
  } catch (_) {
  }
  return {};
}

function saveFlagsMap(map) {
  try {
    StorageService.set(STORAGE_KEYS.FLAGS, map);
  } catch (_) {
  }
}

const LocalFlagService = {
  getFlag(name) {
    const map = loadFlagsMap();
    return map[name] ?? null;
  },

  setFlag(name, value) {
    const map = loadFlagsMap();
    map[name] = value;
    saveFlagsMap(map);
  },

  removeFlag(name) {
    const map = loadFlagsMap();
    if (name in map) {
      delete map[name];
      saveFlagsMap(map);
    }
  },

  hasFlag(name) {
    const map = loadFlagsMap();
    return name in map && map[name] !== null && map[name] !== false;
  },

  clearAll() {
    saveFlagsMap({});
  },
};

export default LocalFlagService;
