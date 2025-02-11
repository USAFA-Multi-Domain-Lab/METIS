import { TMissionImportBuild } from '..'

// -- BUILD 28 --
// This migration script is responsible
// for moving the introMessage from the
// mission level to the force level.

const build: TMissionImportBuild = (missionData) => {
  let mission = missionData

  // Loop through forces.
  for (let force of mission.forces) {
    // If the force doesn't have introMessage,
    // set it to the mission's introMessage.
    if (!force.introMessage) {
      force.introMessage = mission.introMessage
    }
  }

  // Delete the introMessage property from the mission.
  delete mission.introMessage
}

export default build
