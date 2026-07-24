import { TargetMigrationRegistry } from '@metis/schema/TargetMigrationRegistry'
import { MigrationToolbox } from '@metis/toolbox/migrations/MigrationToolbox'

let migrations = new TargetMigrationRegistry()

// Migrates effects to be compatible with renamed parameter IDs in v2.5.0 of METIS.
migrations.register('2.5.0', (effect) => {
  // Renames are wrapped for this update only. Args stored before the typed array
  // format may omit an optional or dependency-gated parameter, so a rename can
  // find nothing to update. A missing argument is backfilled with its default by
  // the client on load, so skipping it here is safe.
  try {
    MigrationToolbox.updateParameterId(effect, 'actionMetadata', 'applyTo')
  } catch {
    // Argument absent; safe to skip.
  }
})

export { migrations }
