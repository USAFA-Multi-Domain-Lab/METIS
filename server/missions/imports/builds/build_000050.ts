import type { TMissionImportBuild } from '../MissionImport'

// -- BUILD 50 --
// This migration script is responsible for updating
// the values of the `trigger` property to specify
// they're relation to an action execution, rather
// than the mission-level triggers which will soon
// be added also.

const build: TMissionImportBuild = (missionData) => {
  missionData.forces.forEach((force: any) =>
    force.nodes.forEach((node: any) =>
      node.actions.forEach((action: any) => {
        action.effects.forEach((effect: any) => {
          switch (effect.trigger) {
            // Update the trigger value based
            // on its current value.
            case 'immediate':
              effect.trigger = 'execution-initiation'
              break
            case 'success':
              effect.trigger = 'execution-success'
              break
            case 'failure':
              effect.trigger = 'execution-failure'
              break
          }
        })
      }),
    ),
  )
}

export default build
