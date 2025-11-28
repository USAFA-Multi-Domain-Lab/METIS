import type { TMissionImportBuild } from '../MissionImport'

// -- BUILD 52 --
// This migration script is responsible for updating
// any effects related to opening a node so that they're
// compatible with the new node open/closed state target.

const build: TMissionImportBuild = async (missionData) => {
  for (const force of missionData.forces) {
    // Loop through nodes.
    for (const node of force.nodes) {
      // Loop through actions.
      for (const action of node.actions) {
        // Loop through effects.
        if (action.effects) {
          for (const effect of action.effects) {
            // Check if this effect needs migration from 'open-node' to 'open-state'
            if (
              effect.environmentId === 'METIS' &&
              effect.targetId === 'open-node'
            ) {
              // Update the effect to use the new target ID.
              effect.targetId = 'open-state'

              // Update the target environment version to the latest METIS version.
              effect.targetEnvironmentVersion = '0.2.1'

              // Update args if the old 'openNode' argument exists.
              if (effect.args && effect.args.openNode !== undefined) {
                effect.args.openState = effect.args.openNode
                delete effect.args.openNode
              }
            }
          }
        }
      }
    }
  }
}

export default build
