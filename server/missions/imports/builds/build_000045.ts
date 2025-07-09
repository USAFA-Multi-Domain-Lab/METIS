import { TMissionImportBuild } from '..'

// -- BUILD 44 --
// This migration script is responsible for populating
// the `createdBy` and `createdByUsername` fields in the
// mission data with the system user.

const patchlessVersionRegex = /^\d+\.\d+$/

const build: TMissionImportBuild = async (missionData) => {
  for (let force of missionData.forces) {
    // Loop through nodes.
    for (let node of force.nodes) {
      // Loop through actions.
      for (let action of node.actions) {
        // Loop through effects.
        for (let effect of action.effects) {
          if (patchlessVersionRegex.test(effect.targetEnvironmentVersion)) {
            // If the version is patchless (e.g., "1.0"),
            // append ".0" to make it "1.0.0".
            effect.targetEnvironmentVersion += '.0'
          }
        }
      }
    }
  }
}

export default build
