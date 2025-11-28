import type { TMissionImportBuild } from '../MissionImport'

// -- BUILD 39 --
// This migration script is responsible for adding the
// `exclude` property to all nodes in every
// mission in the database.

const build: TMissionImportBuild = (missionData) => {
  missionData.forces.forEach((force: any) => {
    force.nodes.forEach((node: any) => {
      if (node.exclude === undefined) {
        node.exclude = false
      }
    })
  })
}

export default build
