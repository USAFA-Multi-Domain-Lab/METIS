import type { TMissionImportBuild } from '../ImportMigrationBuilder'

// -- BUILD 58 --
// Renames args → arguments on all effect objects
// (session-triggered root effects and execution-triggered action effects).

const build: TMissionImportBuild = async (missionData) => {
  for (const effect of missionData.effects ?? []) {
    effect.arguments = effect.args
    delete effect.args
  }

  for (const force of missionData.forces) {
    for (const node of force.nodes) {
      for (const action of node.actions) {
        for (const effect of action.effects) {
          effect.arguments = effect.args
          delete effect.args
        }
      }
    }
  }
}

export default build
