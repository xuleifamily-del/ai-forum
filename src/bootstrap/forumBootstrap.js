import { STORAGE_KEYS } from '../constants/forumStorageKeys.js'
import StorageService from '../services/storageService.js'
import MigrationService from '../services/migrationService.js'
import SeedService from '../services/seedService.js'
import IdentityService from '../services/identityService.js'
import { checkHealth } from '../services/questionRepository.js'

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

  let dbAvailable = false
  try {
    const health = await checkHealth()
    dbAvailable = !!health?.db
  } catch (err) {
    console.warn('[Bootstrap] API health check failed:', err.message)
  }

  return { identity, behaviorProfile, aiAvailable: true, dbAvailable }
}
