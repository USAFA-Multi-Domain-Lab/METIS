import { TMissionImportBuild } from '..'

// -- BUILD 36 --
// This migration script is responsible for adding the
// `trigger` property to all effects in every
// mission in the database.

const build: TMissionImportBuild = (missionData) => {
  missionData.forces.forEach((force: any) =>
    force.nodes.forEach((node: any) =>
      node.actions.forEach((action: any) => {
        action.effects.forEach((effect: any) => {
          if (!effect.trigger) effect.trigger = 'success'
        })
      }),
    ),
  )
}

export default build
