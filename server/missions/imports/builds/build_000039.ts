import { TMissionImportBuild } from '..'

// -- BUILD 39 --
// This migration script is responsible for adding the
// `files` property to all missions in the database.

const build: TMissionImportBuild = (missionData) => {
  missionData.files = []
}

export default build
