import { STORAGE_KEYS } from '../constants/forumStorageKeys.js'
import StorageService from '../services/storageService.js'
import MigrationService from '../services/migrationService.js'
import SeedService from '../services/seedService.js'
import IdentityService from '../services/identityService.js'

export async function runForumBootstrap() {
  try {
    MigrationService.runMigrations()
  } catch (err) {
    console.error('[Bootstrap] Migration failed:', err)
  }

  try {
    SeedService.inject()
  } catch (err) {
    console.error('[Bootstrap] Seed inject failed:', err)
  }

  const identity = IdentityService.getOrCreate()
  IdentityService.touchLastActive()

  let behaviorProfile = StorageService.get(STORAGE_KEYS.BEHAVIOR)
  if (!behaviorProfile) {
    behaviorProfile = IdentityService.createEmptyBehaviorProfile(identity.id)
    StorageService.set(STORAGE_KEYS.BEHAVIOR, behaviorProfile)
  }

  return { identity, behaviorProfile, aiAvailable: true }
}
