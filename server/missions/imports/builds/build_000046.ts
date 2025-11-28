import type { TMissionImportBuild } from '../MissionImport'

// -- BUILD 46 --
// This migration script is responsible for updating
// actions to include a type field, which by default
// is set to 'repeatable'.

const build: TMissionImportBuild = async (missionData) => {
  for (let force of missionData.forces) {
    // Loop through nodes.
    for (let node of force.nodes) {
      // Loop through actions.
      for (let action of node.actions) {
        // Set the action type to 'repeatable' if not set.
        if (!action.type) action.type = 'repeatable'
      }
    }
  }
}

export default build
