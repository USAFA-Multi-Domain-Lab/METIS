import type { TMissionImportBuild } from '../MissionImport'

// -- BUILD 51 --
// This migration script is responsible for adding
// the `order` property to each effect within an
// mission based on its current position within
// its array and its given trigger.

const build: TMissionImportBuild = (missionData) => {
  missionData.forces.forEach((force: any) =>
    force.nodes.forEach((node: any) =>
      node.actions.forEach((action: any) => {
        // Tracks ordering on a per-trigger basis.
        let orderByTrigger: any = {
          'execution-initiation': 1,
          'execution-success': 1,
          'execution-failure': 1,
        }

        action.effects.forEach((effect: any) => {
          // Assign order based on trigger
          // and its position within the
          // array of effects.
          effect.order = orderByTrigger[effect.trigger]
          orderByTrigger[effect.trigger]++
        })
      }),
    ),
  )
}

export default build
