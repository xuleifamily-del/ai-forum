import StorageService from './storageService.js';
import { STORAGE_KEYS, SCHEMA_CURRENT_VERSION } from '../constants/forumStorageKeys.js';

const MigrationService = {
  migrations: {
    1: function migrateV0ToV1(allData) {
      const qs = allData[STORAGE_KEYS.QUESTIONS] ?? [];
      qs.forEach(q => { if (!q.titleRaw) q.titleRaw = q.title; });
      return allData;
    },
    2: function migrateV1ToV2(allData) {
      return allData;
    },
  },

  runMigrations() {
    const oldV = StorageService.get(STORAGE_KEYS.SCHEMA_VERSION) ?? 0;
    const newV = SCHEMA_CURRENT_VERSION;

    if (oldV > newV) {
      console.warn(`[Migration] schema version ${oldV} too new, skipping`);
      return;
    }

    if (oldV === newV) {
      return;
    }

    const allData = { SCHEMA_VERSION: oldV };
    for (const key of Object.keys(STORAGE_KEYS)) {
      const storageKey = STORAGE_KEYS[key];
      allData[storageKey] = StorageService.get(storageKey);
    }

    const snapshot = JSON.parse(JSON.stringify(allData));

    try {
      for (let v = oldV; v < newV; v++) {
        const targetVersion = v + 1;
        const migrateFn = this.migrations[targetVersion];
        if (migrateFn) {
          migrateFn(allData);
        }
      }

      allData.SCHEMA_VERSION = newV;
      allData[STORAGE_KEYS.SCHEMA_VERSION] = newV;

      for (const key of Object.keys(STORAGE_KEYS)) {
        const storageKey = STORAGE_KEYS[key];
        StorageService.set(storageKey, allData[storageKey]);
      }

      if (import.meta.env?.DEV) {
        const qs = allData[STORAGE_KEYS.QUESTIONS] ?? [];
        const ans = allData[STORAGE_KEYS.ANSWERS] ?? [];
        console.log(`[Migration] v${oldV} → v${newV}: processed ${qs.length} questions, ${ans.length} answers`);
      }
    } catch (err) {
      StorageService.set('aiforum_migration_error', {
        version: oldV,
        error: String(err),
        stack: err?.stack,
        timestamp: Date.now(),
      });
      for (const key of Object.keys(STORAGE_KEYS)) {
        const storageKey = STORAGE_KEYS[key];
        StorageService.set(storageKey, snapshot[storageKey]);
      }
      throw err;
    }
  },
};

export default MigrationService;
