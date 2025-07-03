import { TMissionImportBuild } from '..'

// -- BUILD 44 --
// This migration script is responsible for populating
// the `createdBy` and `createdByUsername` fields in the
// mission data with the system user.

const build: TMissionImportBuild = async (missionData) => {
  if (!missionData.createdBy) {
    missionData.createdBy = '000000000000000000000000'
  }
  if (!missionData.createdByUsername) {
    missionData.createdByUsername = 'metis'
  }
}

export default build
