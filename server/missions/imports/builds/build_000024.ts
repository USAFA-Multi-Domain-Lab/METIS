import { TMissionImportBuild } from '..'

// -- BUILD 24 --
// This migration script is responsible
// for converting the "effects" property
// to "externalEffects" and adding the
// "internalEffects" property to the mission schema.

const build: TMissionImportBuild = (missionData) => {
  let mission = missionData

  // Loop through all forces.
  for (let force of mission.forces) {
    // Loop through all nodes.
    for (let node of force.nodes) {
      // Loop through all actions.
      for (let action of node.actions) {
        // If the action doesn't have internalEffects,
        // set it to an empty array.
        if (!('internalEffects' in action)) {
          action.internalEffects = []
        }

        // Rename the "effects" property to "externalEffects".
        if (action.effects) {
          action.externalEffects = action.effects
          delete action.effects
        }
      }
    }
  }
}

export default build
