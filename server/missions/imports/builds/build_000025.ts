import { TMissionImportBuild } from '..'

// -- BUILD 25 --
// This migration script is responsible
// for converting the "externalEffects" property
// to "effects" and removing the "internalEffects"
// property from the mission schema. This script
// also converts any properties with "<p><br></p>"
// to an empty string ("").

const build: TMissionImportBuild = (missionData) => {
  let mission = missionData

  // Loop through forces.
  for (let force of mission.forces) {
    // Loop through nodes.
    for (let node of force.nodes) {
      // If the description has "<p><br></p>",
      // set it to an empty string.
      if (node.description === '<p><br></p>') {
        node.description = ''
      }
      // If the preExecutionText has "<p><br></p>",
      // set it to an empty string.
      if (node.preExecutionText === '<p><br></p>') {
        node.preExecutionText = ''
      }

      // Loop through actions.
      for (let action of node.actions) {
        // If the description has "<p><br></p>",
        // set it to an empty string.
        if (action.description === '<p><br></p>') {
          action.description = ''
        }

        // If the action does have internalEffects,
        // delete internalEffects.
        if (action.internalEffects) {
          delete action.internalEffects
        }
        // If the action does have externalEffects,
        // set effects to externalEffects and delete
        // externalEffects.
        if (action.externalEffects) {
          action.effects = action.externalEffects
          delete action.externalEffects
        }

        // Loop through effects.
        for (let effect of action.effects) {
          // If the description has "<p><br></p>",
          // set it to an empty string.
          if (effect.description === '<p><br></p>') {
            effect.description = ''
          }
        }
      }
    }
  }
}

export default build
