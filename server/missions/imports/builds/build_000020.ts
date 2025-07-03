import { TMissionImportBuild } from '..'

// -- BUILD 20 --
// This migration script is responsible
// for removing the "live" property from
// all missions and removing the "missionID",
// "actionID", and "effect.id" properties from
// all missions, nodes, and actions. It also
// renames the "nodeID" property to "structureKey"
// in all nodes.

const build: TMissionImportBuild = (missionData) => {
  let mission = missionData

  // Remove the "live" property from the mission.
  if (mission.live !== undefined) {
    delete mission.live
  }

  // Remove the "missionID" property from the mission.
  if (mission.missionID) {
    delete mission.missionID
  }

  // Grab the nodeData.
  let nodeData = mission.nodeData

  // Loop through nodes.
  for (let nodeDatum of nodeData) {
    // Rename the "nodeID" property to "structureKey".
    if (nodeDatum.nodeID) {
      nodeDatum.structureKey = nodeDatum.nodeID
      delete nodeDatum.nodeID
    }

    // Grab all actions.
    let actions = nodeDatum.actions
    // Loop through actions.
    for (let action of actions) {
      // Remove the "actionID" property from the action.
      if (action.actionID) {
        delete action.actionID
      }

      // Remove the "effectID" property from the action.
      if (action.effects && action.effects.length > 0) {
        for (let effect of action.effects) {
          if (effect.id) {
            delete effect.id
          }
        }
      }
    }
  }
}

export default build
