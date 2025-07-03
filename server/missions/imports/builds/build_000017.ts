import { TMissionImportBuild } from '..'

// -- BUILD 17 --
// This migration script is responsible
// for removing scripts from actions stored
// in a mission and adding a new property
// to actions called "effects."

const build: TMissionImportBuild = (missionData) => {
  // Grab the nodeData.
  let nodeData = missionData.nodeData

  // Loop through nodeData.
  for (let nodeDatum of nodeData) {
    // Grab the actions.
    let actions: any[] = nodeDatum.actions

    // Loop through actions.
    for (let action of actions) {
      // If the action doesn't have effects,
      // set it to an empty array.
      if (!('effects' in action)) {
        action.effects = []
      }
      // Remove the scripts from the action.
      delete action.scripts
    }
  }
}

export default build
