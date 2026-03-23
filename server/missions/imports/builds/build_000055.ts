import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import type { TMissionImportBuild } from '../MissionImport'

// -- BUILD 55 --
// Replaces single-resource scalar fields with multi-pool arrays.
//
// Mission level:
//   resourceLabel (string) → resources ([{ _id, name, order }])
//
// Force level:
//   initialResources (number) + allowNegativeResources (boolean)
//     → resourcePools ([{ _id, resourceId, initialAmount, allowNegative }])
//
// Action level:
//   resourceCost (number) + resourceCostHidden (boolean)
//     → resourceCosts ([{ _id, resourceId, baseAmount, hidden }])
//
// A single resourceId is generated per mission and referenced consistently
// across all three levels.

const build: TMissionImportBuild = async (missionData) => {
  // Generate a stable resource ID to reference across forces and actions.
  let resourceId = StringToolbox.generateRandomId()

  // Build the new top-level resources array from the old resourceLabel.
  missionData.resources = [
    {
      _id: resourceId,
      name: missionData.resourceLabel,
      icon: 'resources/coins',
      order: 0,
    },
  ]
  delete missionData.resourceLabel

  for (const force of missionData.forces) {
    force.resourcePools = [
      {
        _id: StringToolbox.generateRandomId(),
        localKey: '1',
        resourceId: resourceId,
        initialAmount: force.initialResources,
        allowNegative: force.allowNegativeResources,
      },
    ]
    delete force.initialResources
    delete force.allowNegativeResources

    for (const node of force.nodes) {
      for (const action of node.actions) {
        action.resourceCosts = [
          {
            _id: StringToolbox.generateRandomId(),
            resourceId: resourceId,
            baseAmount: action.resourceCost,
            hidden: action.resourceCostHidden,
          },
        ]
        delete action.resourceCost
        delete action.resourceCostHidden
      }
    }
  }
}

export default build
