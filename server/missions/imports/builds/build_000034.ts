import { TCommonMissionJson } from 'metis/missions'
import { TMissionImportBuild } from '..'

// -- BUILD 34 --
// This migration script is responsible for adding the
// cost obfuscation properties to all actions in every
// mission in the database, specifically the
// `processTimeHidden`, `successChanceHidden`, and
// `resourceCostHidden` values.

const build: TMissionImportBuild = (missionData) => {
  missionData.forces.forEach((force: any) =>
    force.nodes.forEach((node: any) =>
      node.actions.forEach((action: any) => {
        if (action.processTimeHidden === undefined) {
          action.processTimeHidden = false
        }
        if (action.successChanceHidden === undefined) {
          action.successChanceHidden = false
        }
        if (action.resourceCostHidden === undefined) {
          action.resourceCostHidden = false
        }
      }),
    ),
  )
}

export default build
