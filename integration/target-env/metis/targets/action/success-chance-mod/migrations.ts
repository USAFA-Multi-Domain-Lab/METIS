import { TargetMigrationRegistry } from '@metis/schema/TargetMigrationRegistry'
import { MigrationToolbox } from '@metis/toolbox/migrations/MigrationToolbox'

let migrations = new TargetMigrationRegistry()

// Migrates effects to be compatible with renamed parameter IDs in v2.5.0 of METIS.
migrations.register('2.5.0', (effect) => {
  MigrationToolbox.updateParameterId(effect, 'actionMetadata', 'applyTo')
  MigrationToolbox.updateParameterId(effect, 'successChance', 'amount')
})

export { migrations }
