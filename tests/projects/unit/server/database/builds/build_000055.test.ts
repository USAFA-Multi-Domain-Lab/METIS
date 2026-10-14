import { describe, expect, test } from '@jest/globals'
import {
  assertMigratedMission,
  createPreMigrationMission,
} from 'tests/helpers/projects/unit/migrations/build_000055.helpers'
import { runDatabaseBuild } from 'tests/helpers/projects/unit/migrations/database-build.helpers'

describe('build_000055 database migration', () => {
  test('migrates a pre-build-55 mission into the new multi-resource shape', () => {
    let mission = createCreditsMission('mission-1')
    let { missionUpdateOne, infosUpdateOne, missionResults } = runBuild(mission)

    expect(missionUpdateOne).toHaveBeenCalledTimes(1)

    let [firstMissionResult] = missionResults

    assertMigratedMission(
      firstMissionResult.migratedMission,
      firstMissionResult.originalMission,
    )
    expect(firstMissionResult.updatePayload.$unset).toEqual({
      resourceLabel: '',
    })
    expect(firstMissionResult.updatePayload.$set).not.toHaveProperty(
      'resourceLabel',
    )

    expect(infosUpdateOne).toHaveBeenCalledTimes(1)
    expect(infosUpdateOne).toHaveBeenCalledWith(
      {},
      { $set: { schemaBuildNumber: 55 } },
    )
  })

  test('creates isolated resource IDs for each migrated mission', () => {
    let missions = [
      createCreditsMission('mission-1'),
      createFuelMission('mission-2'),
    ]
    let { missionUpdateOne, missionResults } = runBuild(missions)

    expect(missionUpdateOne).toHaveBeenCalledTimes(2)

    let [firstMissionResult, secondMissionResult] = missionResults

    assertMigratedMission(
      firstMissionResult.migratedMission,
      firstMissionResult.originalMission,
    )
    assertMigratedMission(
      secondMissionResult.migratedMission,
      secondMissionResult.originalMission,
    )

    let resourceId = firstMissionResult.migratedMission.resources[0]._id

    expect(JSON.stringify(secondMissionResult.migratedMission)).not.toContain(
      resourceId,
    )
  })
})

function createCreditsMission(missionId: string): TPreMigrationMission {
  return createPreMigrationMission(missionId, 'Credits', [
    {
      initialResources: 25,
      allowNegativeResources: false,
      nodes: [
        [
          { resourceCost: 3, resourceCostHidden: false },
          { resourceCost: 7, resourceCostHidden: true },
        ],
      ],
    },
    {
      initialResources: 40,
      allowNegativeResources: true,
      nodes: [
        [
          { resourceCost: 11, resourceCostHidden: true },
          { resourceCost: 13, resourceCostHidden: false },
        ],
      ],
    },
  ])
}

function createFuelMission(missionId: string): TPreMigrationMission {
  return createPreMigrationMission(missionId, 'Fuel', [
    {
      initialResources: 60,
      allowNegativeResources: false,
      nodes: [
        [
          { resourceCost: 5, resourceCostHidden: false },
          { resourceCost: 9, resourceCostHidden: true },
        ],
      ],
    },
    {
      initialResources: 80,
      allowNegativeResources: true,
      nodes: [
        [
          { resourceCost: 15, resourceCostHidden: true },
          { resourceCost: 17, resourceCostHidden: false },
        ],
      ],
    },
  ])
}

function runBuild(missions: TPreMigrationMission | TPreMigrationMission[]) {
  if (!Array.isArray(missions)) {
    missions = [missions]
  }

  let originalMissions = structuredClone(missions)
  let { missionUpdateOne, infosUpdateOne } = runDatabaseBuild<
    TPreMigrationMission,
    TMissionUpdatePayload
  >(55, missions)

  let missionResults: TMissionMigrationResult[] =
    missionUpdateOne.mock.calls.map(([filter, updatePayload]) => {
      let originalMission = findOriginalMissionById(
        originalMissions,
        filter._id,
      )

      return {
        migratedMission: applyMissionUpdate(originalMission, updatePayload),
        originalMission,
        updatePayload,
      }
    })

  return {
    missionUpdateOne,
    infosUpdateOne,
    missionResults,
  }
}

function applyMissionUpdate(
  originalMission: TPreMigrationMission,
  updatePayload: TMissionUpdatePayload,
): TMigratedMissionResult {
  let migratedMission: Record<string, unknown> = {
    ...structuredClone(originalMission),
  }

  Object.assign(migratedMission, updatePayload.$set)

  for (let fieldName of Object.keys(updatePayload.$unset)) {
    Reflect.deleteProperty(migratedMission, fieldName)
  }

  return migratedMission as TMigratedMissionResult
}

function findOriginalMissionById(
  missions: TPreMigrationMission[],
  missionId: string,
): TPreMigrationMission {
  let originalMission = missions.find((mission) => mission._id === missionId)

  if (!originalMission) {
    throw new Error(
      `Expected original mission with _id "${missionId}" to exist in the test fixture.`,
    )
  }

  return originalMission
}

type TPreMigrationMission = ReturnType<typeof createPreMigrationMission>

interface TMissionMigrationResult {
  migratedMission: TMigratedMissionResult
  originalMission: TPreMigrationMission
  updatePayload: TMissionUpdatePayload
}

interface TMigratedMissionResult extends Record<string, unknown> {
  resources: Array<{ _id: string }>
}

interface TMissionUpdatePayload {
  $set: Record<string, unknown> & {
    resources: Array<{ _id: string }>
  }
  $unset: Record<string, string>
}
