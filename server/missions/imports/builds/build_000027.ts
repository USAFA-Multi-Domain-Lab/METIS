import { TMissionImportBuild } from '..'

// -- BUILD 27 --
// This migration script is responsible
// for moving initial resources from the
// mission level to the force level.

const build: TMissionImportBuild = (missionData) => {
  let mission = missionData

  // Loop through forces.
  for (let force of mission.forces) {
    // If the force doesn't have initialResources,
    // set it to the mission's initialResources.
    if (!force.initialResources) {
      force.initialResources = mission.initialResources
    }
  }

  // Delete the initialResources property from the mission.
  delete mission.initialResources
}

export default build
