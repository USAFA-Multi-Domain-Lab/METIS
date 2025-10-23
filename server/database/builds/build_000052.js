// This migration script is responsible for updating
// any effects related to opening a node so that they're
// compatible with the new node open/closed state target.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating mission data to updated schema...')

// Query for all missions.
let cursor_missions = db.missions.find({}, { _id: 1, forces: 1 })
let missionCount = 0
let effectCount = 0

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
        // Loop through effects.
        for (let effect of action.effects) {
          // Check if this effect needs migration from 'open-node' to 'open-state'
          if (
            effect.environmentId === 'METIS' &&
            effect.targetId === 'open-node'
          ) {
            // Update the effect to use the new target ID.
            effect.targetId = 'open-state'

            // Update the target environment version to the latest METIS version.
            effect.targetEnvironmentVersion = '0.2.1'

            // Update args if the old 'openNode' argument exists.
            if (effect.args && effect.args.openNode !== undefined) {
              effect.args.openState = effect.args.openNode
              delete effect.args.openNode
            }

            missionModified = true
            effectCount++
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
    missionCount++
  }
}

print(
  `Migration complete: Updated ${effectCount} effect(s) across ${missionCount} mission(s).`,
)

print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 52 } })
