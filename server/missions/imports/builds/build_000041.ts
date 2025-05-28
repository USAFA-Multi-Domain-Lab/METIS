import { TMissionImportBuild } from '..'

// -- BUILD 41 --
// This migration script is responsible for adding the
// `allowNegativeResources` property to all forces within
// the missions in the database.
const build: TMissionImportBuild = (missionData) => {
  missionData.forces.forEach((force: any) => {
    if (force.allowNegativeResources === undefined) {
      force.allowNegativeResources = false
    }
  })
}

export default build
