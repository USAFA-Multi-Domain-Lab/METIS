// This migration script is responsible
// for generating a default action for
// any existing nodes that are executable
// and without an action.

use('mdl')

print('Migrating mission data to updated schema...')

let cursor_missions = db.missions.find({}, { missionID: 1, nodeData: 1 })

while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()
  let nodeData = mission.nodeData

  for (let nodeDatum of nodeData) {
    if (nodeDatum.executable && nodeDatum.actions.length === 0) {
      // Create default action.
      let action = {
        actionID: 'migration-generated-action',
        name: 'Execute',
        description: 'This will execute the node.',
        processTime: 1000,
        successChance: 0.5,
        resourceCost: 1,
        postExecutionSuccessText: 'Execute was performed successfully.',
        postExecutionFailureText: 'Execute was performed unsuccessfully.',
      }
      // Add new action to the node.
      nodeDatum.actions = [action]
    }
  }

  db.missions.updateOne({ missionID: mission.missionID }, { $set: mission })
}

print('Updating schema build number...')

db.infos.updateOne({ infoID: 'default' }, { $set: { schemaBuildNumber: 3 } })
