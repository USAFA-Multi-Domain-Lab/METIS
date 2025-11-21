import type { TMissionImportBuild } from '../MissionImport'

// -- BUILD 53 --
// This migration script performs two updates:
// 1. Renames the METIS target environment from 'METIS' to 'metis' (lowercase)
// 2. Renames the 'award' target to 'resource-pool' for better extensibility

const build: TMissionImportBuild = async (missionData) => {
  // Process mission-level effects
  if (missionData.effects && Array.isArray(missionData.effects)) {
    for (const effect of missionData.effects) {
      // Check if this effect uses the old 'METIS' environment ID
      if (effect.environmentId === 'METIS') {
        // Update to lowercase 'metis'
        effect.environmentId = 'metis'
      }

      // Check if this effect uses the old 'award' target ID
      // Note: Check both 'METIS' and 'metis' in case env was already migrated
      if (
        (effect.environmentId === 'METIS' ||
          effect.environmentId === 'metis') &&
        effect.targetId === 'award'
      ) {
        // Update target ID to 'resource-pool'
        effect.targetId = 'resource-pool'

        // Transform effect.args from old structure to new
        // Old: { modifier: number, forceMetadata: {...} }
        // New: { operation: 'award', amount: number, forceMetadata: {...} }
        if (effect.args && effect.args.modifier !== undefined) {
          effect.args.operation = 'award'
          effect.args.amount = effect.args.modifier
          delete effect.args.modifier
        }
      }
    }
  }

  for (const force of missionData.forces) {
    // Loop through nodes.
    for (const node of force.nodes) {
      // Loop through actions.
      for (const action of node.actions) {
        // Loop through effects.
        if (action.effects) {
          for (const effect of action.effects) {
            // Check if this effect uses the old 'METIS' environment ID
            if (effect.environmentId === 'METIS') {
              // Update to lowercase 'metis'
              effect.environmentId = 'metis'
            }

            // Check if this effect uses the old 'award' target ID
            // Note: Check both 'METIS' and 'metis' in case env was already migrated
            if (
              (effect.environmentId === 'METIS' ||
                effect.environmentId === 'metis') &&
              effect.targetId === 'award'
            ) {
              // Update target ID to 'resource-pool'
              effect.targetId = 'resource-pool'

              // Transform effect.args from old structure to new
              // Old: { modifier: number, forceMetadata: {...} }
              // New: { operation: 'award', amount: number, forceMetadata: {...} }
              if (effect.args && effect.args.modifier !== undefined) {
                effect.args.operation = 'award'
                effect.args.amount = effect.args.modifier
                delete effect.args.modifier
              }
            }
          }
        }
      }
    }
  }
}

export default build
