// This migration script performs two updates:
// 1. Renames the METIS target environment from 'METIS' to 'metis' (lowercase)
// 2. Renames the 'award' target to 'resource-pool' for better extensibility

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating mission data to updated schema...')

// Query for all missions with effects using the METIS environment or award target.
let cursor_missions = db.missions.find(
  {
    $or: [
      { 'effects.environmentId': 'METIS' },
      { 'effects.targetId': 'award' },
      { 'forces.nodes.actions.effects.environmentId': 'METIS' },
      { 'forces.nodes.actions.effects.targetId': 'award' },
    ],
  },
  { _id: 1, effects: 1, forces: 1 },
)
let missionCount = 0
let envUpdateCount = 0
let targetUpdateCount = 0

// Loop through missions.
while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()
  let missionModified = false

  // Process mission-level effects
  if (mission.effects && Array.isArray(mission.effects)) {
    for (let effect of mission.effects) {
      // Check if this effect uses the old 'METIS' environment ID
      if (effect.environmentId === 'METIS') {
        // Update to lowercase 'metis'
        effect.environmentId = 'metis'
        missionModified = true
        envUpdateCount++
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

        missionModified = true
        targetUpdateCount++
      }
    }
  }

  // Loop through forces.
  for (let force of mission.forces) {
    // Loop through nodes.
    for (let node of force.nodes) {
      // Loop through actions.
      for (let action of node.actions) {
        // Loop through effects.
        for (let effect of action.effects) {
          // Check if this effect uses the old 'METIS' environment ID
          if (effect.environmentId === 'METIS') {
            // Update to lowercase 'metis'
            effect.environmentId = 'metis'
            missionModified = true
            envUpdateCount++
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

            missionModified = true
            targetUpdateCount++
          }
        }
      }
    }
  }

  if (missionModified) {
    // Update the mission with the new data.
    let updateFields = { forces: mission.forces }
    if (mission.effects) {
      updateFields.effects = mission.effects
    }
    db.missions.updateOne({ _id: mission._id }, { $set: updateFields })
    missionCount++
  }
}

print(
  `Migration complete: Updated ${envUpdateCount} environment ID(s) and ${targetUpdateCount} target ID(s) across ${missionCount} mission(s).`,
)

print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 53 } })
