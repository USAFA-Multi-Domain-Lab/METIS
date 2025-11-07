import type { TMissionImportBuild } from '../MissionImport'

// -- BUILD 11 --
// This migration script is responsible
// for adding the introduction message
// property at the mission level of the
// missions collection.

const build: TMissionImportBuild = (missionData) => {
  if (!('introMessage' in missionData)) {
    missionData.introMessage = 'Enter your overview message here.'
  }
}

export default build
