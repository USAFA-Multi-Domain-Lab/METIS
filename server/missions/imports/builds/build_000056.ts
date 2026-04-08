import type { TMissionImportBuild } from '../MissionImport'

// -- BUILD 56 --
// Removes the seed field from mission data.

const build: TMissionImportBuild = async (missionData) => {
  delete missionData.seed
}

export default build
