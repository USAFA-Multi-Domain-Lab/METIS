import type { TMissionImportBuild } from '../ImportMigrationBuilder'

// -- BUILD 60 --
// Adds an empty description to every resource defined on the mission.

const build: TMissionImportBuild = async (missionData) => {
  for (const resource of missionData.resources) {
    resource.description = ''
  }
}

export default build
