import type { TMissionImportBuild } from '../MissionImport'

// -- BUILD 47 --
// This migration script is responsible for updating
// nodes to include an initiallyBlocked field, which by default
// is set to false.

const build: TMissionImportBuild = async (missionData) => {
  for (let force of missionData.forces) {
    // Loop through nodes.
    for (let node of force.nodes) {
      // Set the initiallyBlocked field to false if not set.
      if (node.initiallyBlocked === undefined) {
        node.initiallyBlocked = false
      }
    }
  }
}

export default build
