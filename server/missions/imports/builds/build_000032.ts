import { TMissionImportBuild } from '..'

// -- BUILD 32 --
// // This migration script is responsible for adding
// the "resourceLabel" fields to the "Missions"
// collection, if any documents do  not already have
// these fields populated.

const build: TMissionImportBuild = (missionData) => {
  if (!missionData.resourceLabel) missionData.resourceLabel = 'Resources'
}

export default build
