import type { TMissionImportBuild } from '../MissionImport'

// -- BUILD 9
// This migration script is responsible
// for adding the scripts property
// to the action level of the missions
// collection.

const build: TMissionImportBuild = (missionData) => {
  let nodeData = missionData.nodeData

  for (let nodeDatum of nodeData) {
    let actions: any[] = nodeDatum.actions

    for (let action of actions) {
      if (!('scripts' in action)) {
        action.scripts = []
      }
    }
  }
}

export default build
