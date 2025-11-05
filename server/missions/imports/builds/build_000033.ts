import type { TMissionImportBuild } from '../MissionImport'

// -- BUILD 33 --
// This migration script is responsible
// for adding the `opensNode` property to
// all actions in every mission in the
// database.

const build: TMissionImportBuild = (missionData) => {
  missionData.forces.forEach((force: any) =>
    force.nodes.forEach((node: any) =>
      node.actions.forEach((action: any) => {
        if (action.opensNode === undefined) action.opensNode = true
      }),
    ),
  )
}

export default build
