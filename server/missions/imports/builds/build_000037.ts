import { TMissionImportBuild } from '..'

// -- BUILD 37 --
// This migration script is responsible for adding the
// `revealAllNodes` property to all forces in every
// mission in the database.

const build: TMissionImportBuild = (missionData) => {
  missionData.forces.forEach((force: any) => {
    force.revealAllNodes = false
  })
}

export default build
