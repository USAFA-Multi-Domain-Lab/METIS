import type { TMissionImportBuild } from '../ImportMigrationBuilder'

// -- BUILD 40 --
// This migration script is responsible for adding the
// `files` property to all missions in the database.

const build: TMissionImportBuild = (missionData) => {
  missionData.files = []
}

export default build
