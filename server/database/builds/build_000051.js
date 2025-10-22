// This migration script is responsible for updating
// the values of the `trigger` property to specify
// they're relation to an action execution, rather
// than the mission-level triggers which will soon
// be added also.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating mission data to updated schema...')

// Query for all missions.
let cursor_missions = db.missions.find({}, { _id: 1, forces: 1 })

// Loop through missions.
while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()

  // Loop through forces.
  for (let force of mission.forces) {
    // Loop through nodes.
    for (let node of force.nodes) {
      // Loop through actions.
      for (let action of node.actions) {
        // Tracks ordering on a per-trigger basis.
        let orderByTrigger = {
          'execution-initiation': 1,
          'execution-success': 1,
          'execution-failure': 1,
        }

        // Loop through effects.
        for (let effect of action.effects) {
          // Assign order based on trigger
          // and its position within the
          // array of effects.
          effect.order = orderByTrigger[effect.trigger]
          orderByTrigger[effect.trigger]++
        }
      }
    }
  }

  // Update the mission with the modified data.
  db.missions.updateOne({ _id: mission._id }, { $set: mission })
}

print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 51 } })
