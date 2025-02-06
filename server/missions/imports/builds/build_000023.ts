import { TMissionImportBuild } from '..'

// -- BUILD 23 --
// This migration script is responsible
// for adding the new "forces" property
// to the mission schema, moving the
// node data in the mission to a new default
// force, and removing the "nodeData" property
// from the mission.

const build: TMissionImportBuild = (missionData) => {
  let mission = missionData

  // Add the "forces" property to the mission.
  mission.forces = [
    {
      name: 'Friendly Force',
      color: '#52b1ff',
      nodes: mission.nodeData,
    },
  ]

  // Remove the "nodeData" property from the mission.
  delete mission.nodeData
}

export default build
