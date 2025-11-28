import type { TMissionImportBuild } from '../MissionImport'

// -- BUILD 38 --
// This migration script is responsible for adding the
// `environmentId` property to all effects in every
// mission in the database.

const build: TMissionImportBuild = (missionData) => {
  missionData.forces.forEach((force: any) => {
    force.nodes.forEach((node: any) => {
      node.actions.forEach((action: any) => {
        action.effects.forEach((effect: any) => {
          if (!effect.environmentId) effect.environmentId = 'INFER'
        })
      })
    })
  })
}

export default build
