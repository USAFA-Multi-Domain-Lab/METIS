import { describe, expect, test } from '@jest/globals'
import build_000055 from '@server/missions/imports/builds/build_000055'
import {
  assertMigratedMission,
  createPreMigrationMission,
} from 'tests/helpers/projects/unit/migrations/build_000055.helpers'

describe('build_000055 import migration', () => {
  test('migrates imported mission data into the new multi-resource shape', async () => {
    let missionData = createImportMission()

    // Clone the mission before the import build mutates it.
    let originalMission = structuredClone(missionData)

    await build_000055(missionData)

    assertMigratedMission(missionData, originalMission)
    expect(missionData.resourceLabel).toBeUndefined()
  })
})

function createImportMission() {
  return createPreMigrationMission('mission-1', 'Supplies', [
    {
      initialResources: 50,
      allowNegativeResources: false,
      nodes: [
        [
          { resourceCost: 4, resourceCostHidden: false },
          { resourceCost: 8, resourceCostHidden: true },
        ],
      ],
    },
    {
      initialResources: 90,
      allowNegativeResources: true,
      nodes: [
        [
          { resourceCost: 12, resourceCostHidden: true },
          { resourceCost: 16, resourceCostHidden: false },
        ],
        [{ resourceCost: 21, resourceCostHidden: false }],
      ],
    },
  ])
}
