import type { TMissionImportBuild } from '../MissionImport'

// -- BUILD 35 --
// This migration script is responsible for adding the
// `opensNodeHidden` property to all actions in every
// mission in the database.

const build: TMissionImportBuild = (missionData) => {
  missionData.forces.forEach((force: any) =>
    force.nodes.forEach((node: any) =>
      node.actions.forEach((action: any) => {
        if (action.opensNodeHidden === undefined) {
          action.opensNodeHidden = false
        }
      }),
    ),
  )
}

export default build
