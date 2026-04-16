import type { ClientMissionAction } from '@client/missions/actions/ClientMissionAction'
import { ClientMission } from '@client/missions/ClientMission'
import type { ClientMissionForce } from '@client/missions/forces/ClientMissionForce'
import { describe, expect, test } from '@jest/globals'
import type { ActionResourceCost } from '@shared/missions/actions/ActionResourceCost'
import type { ResourcePool } from '@shared/missions/forces/ResourcePool'
import type { TMissionExistingJson } from '@shared/missions/Mission'
import { User } from '@shared/users/User'
import {
  createMissionPayload,
  type TMissionCreatePayload,
} from 'tests/helpers/projects/integration/rest-api/missions/payload'
import { TestToolbox } from 'tests/helpers/TestToolbox'

describe('Mission resource serialization', () => {
  function createMissionSavePayload(
    customize?: (payload: TMissionCreatePayload) => void,
  ): TMissionExistingJson {
    let payload = createMissionPayload(
      `test_mission_serialization_${TestToolbox.generateRandomId()}`,
    )

    payload.files = []
    payload.effects = []
    payload.forces[0].nodes[1].actions[0] = {
      ...payload.forces[0].nodes[1].actions[0],
      effects: [],
    }

    customize?.(payload)

    return {
      _id: `mission_${TestToolbox.generateRandomId()}`,
      name: payload.name,
      versionNumber: payload.versionNumber,
      seed: payload.seed,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      launchedAt: null,
      createdBy: User.SYSTEM_ID,
      createdByUsername: User.SYSTEM_USERNAME,
      resources: payload.resources,
      structure: payload.structure,
      forces: payload.forces,
      files: payload.files,
      prototypes: payload.prototypes,
      effects: payload.effects,
    }
  }

  function createMission(
    customize?: (payload: TMissionCreatePayload) => void,
  ): ClientMission {
    return ClientMission.fromExistingJson(createMissionSavePayload(customize))
  }

  test('omits pool balances unless session data is exposed', () => {
    let mission: ClientMission = createMission()
    let pool: ResourcePool = mission.forces[0].resourcePools[0]

    pool.balance = 77
    let serialized = pool.serialize()
    let serializedWithExposure = pool.serialize({
      sessionDataExposure: { expose: 'all' },
    })

    expect(serialized).not.toHaveProperty('balance')
    expect(serializedWithExposure.balance).toBe(77)
  })

  test('masks hidden resource costs only when session data is exposed', () => {
    let mission: ClientMission = createMission()
    let action: ClientMissionAction = mission.allActions[0]
    let visibleCost: ActionResourceCost = action.resourceCosts[0]
    let hiddenCost: ActionResourceCost = action.resourceCosts[1]

    expect(visibleCost.hidden).toBe(false)
    expect(hiddenCost.hidden).toBe(true)
    expect(visibleCost.serialize().baseAmount).toBe(15)
    expect(hiddenCost.serialize().baseAmount).toBe(5)
    expect(
      visibleCost.serialize({
        sessionDataExposure: { expose: 'all' },
      }).baseAmount,
    ).toBe(15)
    expect(
      hiddenCost.serialize({
        sessionDataExposure: { expose: 'all' },
      }).baseAmount,
    ).toBe(-1)
  })

  test('preserves resources, pool flags, and action costs through a save-json round trip', () => {
    let original: ClientMission = createMission((payload) => {
      payload.forces[0].resourcePools[0].allowNegative = true
      payload.forces[0].resourcePools[1].excluded = true
      payload.forces[0].nodes[1].actions[0].resourceCosts[0].baseAmount = 22
    })
    let roundTripped: ClientMission = ClientMission.fromExistingJson(
      original.toSaveJson() as TMissionExistingJson,
    )
    let originalForce: ClientMissionForce = original.forces[0]
    let roundTrippedForce: ClientMissionForce = roundTripped.forces[0]
    let originalAction: ClientMissionAction = original.allActions[0]
    let roundTrippedAction: ClientMissionAction = roundTripped.allActions[0]

    expect(roundTripped.resources.map((resource) => resource._id)).toEqual(
      original.resources.map((resource) => resource._id),
    )
    expect(
      roundTrippedForce.resourcePools.map((pool: ResourcePool) => ({
        resourceId: pool.resourceId,
        initialBalance: pool.initialBalance,
        allowNegative: pool.allowNegative,
        excluded: pool.excluded,
      })),
    ).toEqual(
      originalForce.resourcePools.map((pool: ResourcePool) => ({
        resourceId: pool.resourceId,
        initialBalance: pool.initialBalance,
        allowNegative: pool.allowNegative,
        excluded: pool.excluded,
      })),
    )
    expect(
      roundTrippedAction.resourceCosts.map((cost: ActionResourceCost) => ({
        resourceId: cost.resourceId,
        baseAmount: cost.baseAmount,
        hidden: cost.hidden,
      })),
    ).toEqual(
      originalAction.resourceCosts.map((cost: ActionResourceCost) => ({
        resourceId: cost.resourceId,
        baseAmount: cost.baseAmount,
        hidden: cost.hidden,
      })),
    )
  })
})
