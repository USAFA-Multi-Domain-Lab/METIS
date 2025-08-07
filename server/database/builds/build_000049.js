// This migration script is responsible for moving
// post-execution success and failure text from the
// action level to the effect level.

// Import the necessary modules.
const generateHash = require('uuid').v4

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating mission data to updated schema...')

// Query for all missions.
let cursor_missions = db.missions.find({}, { _id: 1, forces: 1 })

/**
 * Generates a new key for an effect.
 * @returns The new key for an effect.
 */
function generateEffectKey(action) {
  // Initialize
  let newKey = 0

  for (let effect of action.effects) {
    let effectKey = Number(effect.localKey)
    // If the effect has a key, and it is greater than the current
    // new key, set the new key to the effect's key.
    if (effectKey > newKey) newKey = Math.max(newKey, effectKey)
  }

  // Increment the new key by 1 and return it as a string.
  newKey++
  return String(newKey)
}

// Loop through missions.
while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()
  let missionModified = false

  // Loop through forces.
  for (let force of mission.forces) {
    // Loop through nodes.
    for (let node of force.nodes) {
      // Loop through actions.
      for (let action of node.actions) {
        if (
          action.postExecutionSuccessText ||
          action.postExecutionFailureText
        ) {
          missionModified = true
          if (!action.effects) {
            action.effects = []
          }

          if (action.postExecutionSuccessText) {
            action.effects.push({
              _id: generateHash(),
              name: 'Post-Execution Success Message',
              description: '',
              localKey: generateEffectKey(action),
              targetId: 'output',
              environmentId: 'METIS',
              targetEnvironmentVersion: '0.2.0',
              trigger: 'success',
              args: {
                message: action.postExecutionSuccessText,
                forceMetadata: { forceKey: 'self', forceName: 'self' },
              },
            })
            delete action.postExecutionSuccessText
          }

          if (action.postExecutionFailureText) {
            action.effects.push({
              _id: generateHash(),
              name: 'Post-Execution Failure Message',
              description: '',
              localKey: generateEffectKey(action),
              targetId: 'output',
              environmentId: 'METIS',
              targetEnvironmentVersion: '0.2.0',
              trigger: 'failure',
              args: {
                message: action.postExecutionFailureText,
                forceMetadata: { forceKey: 'self', forceName: 'self' },
              },
            })
            delete action.postExecutionFailureText
          }
        }
      }
    }
  }

  if (missionModified) {
    // Update the mission with the new data.
    db.missions.updateOne(
      { _id: mission._id },
      { $set: { forces: mission.forces } },
    )
  }
}

print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 49 } })
