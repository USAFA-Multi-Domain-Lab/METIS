// This migration script is responsible for adding the
// `localKey` property to all forces, nodes, actions, and
// effects within the missions in the database.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating mission data to updated schema...')

// Query for all missions.
let cursor_missions = db.missions.find({}, { _id: 1, forces: 1 })

/**
 * Assigns a local key to each component in the provided array.
 * @param components An array of components (forces, nodes, actions, effects).
 * @returns The array of components with assigned local keys.
 */
function assignLocalKeys(components) {
  return components.map((component, index) => {
    // If the component already has a localKey, return it.
    if (component.localKey !== undefined) return component

    // Assign a new localKey to the component.
    component.localKey = String(index + 1)
    return component
  })
}

// Loop through missions.
while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()

  // Generate local keys for forces.
  mission.forces = assignLocalKeys(mission.forces)

  for (let force of mission.forces) {
    force.nodes = assignLocalKeys(force.nodes)

    for (let node of force.nodes) {
      node.actions = assignLocalKeys(node.actions)

      for (let action of node.actions) {
        action.effects = assignLocalKeys(action.effects)
      }
    }
  }

  // Update the mission with the new force data.
  db.missions.updateOne({ _id: mission._id }, { $set: mission })
}

print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 42 } })
