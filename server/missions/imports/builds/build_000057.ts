import type { TMissionImportBuild } from '../ImportMigrationBuilder'

// -- BUILD 57 --
// Renames processTime → baseProcessTime and successChance → baseSuccessChance
// on all action objects in mission data.

const build: TMissionImportBuild = async (missionData) => {
  for (const force of missionData.forces) {
    for (const node of force.nodes) {
      for (const action of node.actions) {
        action.baseProcessTime = action.processTime
        action.baseSuccessChance = action.successChance
        delete action.processTime
        delete action.successChance
      }
    }
  }
}

export default build
