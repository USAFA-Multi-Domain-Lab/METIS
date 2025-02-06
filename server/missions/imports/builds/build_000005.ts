import { TMissionImportBuild } from '..'

// -- BUILD 5 --
// This migration script is responsible
// for adding the description property
// to the node level of the missions
// collection.

const build: TMissionImportBuild = (missionData) => {
  let nodeData = missionData.nodeData

  for (let nodeDatum of nodeData) {
    if (!('description' in nodeDatum)) {
      nodeDatum.description = 'Description not set...'
    }
  }
}

export default build
