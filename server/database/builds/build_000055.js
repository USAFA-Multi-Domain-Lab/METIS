// This migration script replaces single-resource scalar fields with multi-pool
// arrays on missions, forces, and actions.
//
// Mission level:
//   resourceLabel (String) → resources ([{ _id, name, order }])
//
// Force level (nested in missions.forces[]):
//   initialResources (Number) + allowNegativeResources (Boolean)
//     → resourcePools ([{ _id, resourceId, initialAmount, allowNegative }])
//       where resourceId references the _id generated for the mission resource.
//
// Action level (nested in missions.forces[].nodes[].actions[]):
//   resourceCost (Number) + resourceCostHidden (Boolean)
//     → resourceCosts ([{ _id, resourceId, baseAmount, hidden }])
//       where resourceId references the same _id.

const generateHash = require('uuid').v4

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating single-resource fields to multi-pool arrays on missions...')

let cursorMissions = db.missions.find({})

while (cursorMissions.hasNext()) {
  let mission = cursorMissions.next()
  // Generate a stable resource ID for this mission's single resource.
  let resourceId = generateHash()

  // Build the new top-level resources array from the old resourceLabel.
  let resources = [
    {
      _id: resourceId,
      name: mission.resourceLabel,
      icon: 'resources/coins',
      order: 0,
    },
  ]

  // Transform each force's scalar fields into resourcePools.
  for (let force of mission.forces) {
    force.resourcePools = [
      {
        _id: generateHash(),
        localKey: '1',
        resourceId: resourceId,
        initialAmount: force.initialResources,
        allowNegative: force.allowNegativeResources,
        excluded: false,
      },
    ]
    delete force.initialResources
    delete force.allowNegativeResources

    // Transform each action's scalar cost fields into resourceCosts.
    for (let node of force.nodes) {
      for (let action of node.actions) {
        action.resourceCosts = [
          {
            _id: generateHash(),
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

  db.missions.updateOne(
    { _id: mission._id },
    {
      $set: {
        resources: resources,
        forces: mission.forces,
      },
      $unset: { resourceLabel: '' },
    },
  )
}

print('Migration complete.')
print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 55 } })
