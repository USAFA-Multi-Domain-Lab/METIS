import type { TMissionImportBuild } from '../ImportMigrationBuilder'

// -- BUILD 58 --
// Renames args → arguments on all effect objects
// (session effects and execution effects) in mission data.

const build: TMissionImportBuild = async (missionData) => {
  for (const force of missionData.forces) {
    for (const node of force.nodes) {
      for (const action of node.actions) {
        for (const effect of action.sessionEffects) {
          if ('args' in effect) {
            ;(effect as any)['arguments'] = (effect as any).args
            delete (effect as any).args
          }
        }
        for (const effect of action.executionEffects) {
          if ('args' in effect) {
            ;(effect as any)['arguments'] = (effect as any).args
            delete (effect as any).args
          }
        }
      }
    }
  }
}

export default build
