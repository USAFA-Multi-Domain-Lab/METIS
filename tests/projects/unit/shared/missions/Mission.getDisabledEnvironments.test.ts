import { beforeEach, describe, expect, test } from '@jest/globals'
import type { TEffectSessionTriggeredJson } from '@shared/missions/effects/Effect'
import type { TSessionConfig } from '@shared/sessions/MissionSession'
import { MissionSession } from '@shared/sessions/MissionSession'
import { TestMission } from 'tests/helpers/projects/unit/missions/TestMission.helpers'
import { TestTarget } from 'tests/helpers/projects/unit/target-environments/targets/TestTarget.helpers'
import { TestTargetEnvironment } from 'tests/helpers/projects/unit/target-environments/TestTargetEnvironment.helpers'

/**
 * The environment that opts into multi-realm support, so a standalone
 * session may keep it enabled.
 */
const MULTI_REALM_ENVIRONMENT_ID = 'test-multi-realm-environment'

/**
 * The environment that does not opt into multi-realm support, so a
 * standalone session must disable it.
 */
const SINGLE_REALM_ENVIRONMENT_ID = 'test-single-realm-environment'

/**
 * The target both test environments expose. It declares no parameters, so
 * the effects referencing it carry no arguments.
 */
const TARGET_ID = 'no-op'

describe('Mission disabled target environments', () => {
  beforeEach(() => {
    TestTargetEnvironment.createRegistry()
    registerEnvironment(MULTI_REALM_ENVIRONMENT_ID, true)
    registerEnvironment(SINGLE_REALM_ENVIRONMENT_ID, false)
  })

  test('a standalone session disables only the environments that cannot support multiple realms', () => {
    let mission = createMissionReferencingBothEnvironments()

    let disabled = mission.getDisabledEnvironments(
      createConfig({ mode: 'standalone' }),
    )

    expect(disabled).toContain(SINGLE_REALM_ENVIRONMENT_ID)
    expect(disabled).not.toContain(MULTI_REALM_ENVIRONMENT_ID)
  })

  test('a multiplayer session keeps both environments, since its realms never run in parallel', () => {
    let mission = createMissionReferencingBothEnvironments()

    let disabled = mission.getDisabledEnvironments(
      createConfig({ mode: 'multiplayer' }),
    )

    expect(disabled).toHaveLength(0)
  })

  test('a standalone session disables environments that cannot support multiple realms and environments that are explicitly disabled by the session manager', () => {
    let mission = createMissionReferencingBothEnvironments()

    let disabled = mission.getDisabledEnvironments(
      createConfig({
        mode: 'standalone',
        explicitlyDisabledEnvironments: [MULTI_REALM_ENVIRONMENT_ID],
      }),
    )

    expect(disabled).toContain(MULTI_REALM_ENVIRONMENT_ID)
    expect(disabled).toContain(SINGLE_REALM_ENVIRONMENT_ID)
  })

  test('a multiplayer session only disables environments that are explicitly disabled by the session manager', () => {
    let mission = createMissionReferencingBothEnvironments()

    let disabled = mission.getDisabledEnvironments(
      createConfig({
        mode: 'multiplayer',
        explicitlyDisabledEnvironments: [SINGLE_REALM_ENVIRONMENT_ID],
      }),
    )

    expect(disabled).toEqual([SINGLE_REALM_ENVIRONMENT_ID])
  })
})

/**
 * Registers an environment exposing the no-op target, so effects can
 * reference it.
 * @param _id The ID of the environment to register.
 * @param multiRealmSupport Whether the environment opts into running
 * against several realms at once.
 */
function registerEnvironment(_id: string, multiRealmSupport: boolean): void {
  let environment = new TestTargetEnvironment(
    _id,
    `Environment ${_id}`,
    'A fabricated environment used only by this test.',
    '1.0.0',
    [],
    multiRealmSupport,
  )
  let target = new TestTarget(
    TARGET_ID,
    'No-op target',
    'A target that takes no arguments.',
    [],
    environment,
    [],
  )
  environment.targets = [target]
}

/**
 * @param environmentId The ID of the environment the effect references.
 * @param order The position of the effect among the mission's effects.
 * @returns A session-triggered effect pointing at the no-op target in the
 * given environment.
 */
function createEffectJson(
  environmentId: string,
  order: number,
): TEffectSessionTriggeredJson {
  return {
    _id: `effect-${order + 1}`,
    targetId: TARGET_ID,
    environmentId,
    targetEnvironmentVersion: '1.0.0',
    trigger: 'session-teardown',
    order,
    name: `Reference to ${environmentId}`,
    description: `References the ${environmentId} environment.`,
    arguments: [],
    localKey: String(order + 1),
  }
}

/**
 * @returns A mission whose only effects reference one test environment
 * each, so its target environment list holds both.
 */
function createMissionReferencingBothEnvironments(): TestMission {
  let mission = new TestMission([
    createEffectJson(MULTI_REALM_ENVIRONMENT_ID, 0),
    createEffectJson(SINGLE_REALM_ENVIRONMENT_ID, 1),
  ])

  // Ensure the target environments were properly created,
  // registered, and exist within the mission.
  let environmentIds = mission.targetEnvironments.map(
    (environment) => environment._id,
  )
  expect(environmentIds).toContain(MULTI_REALM_ENVIRONMENT_ID)
  expect(environmentIds).toContain(SINGLE_REALM_ENVIRONMENT_ID)

  return mission
}

/**
 * @param overrides The config fields the test cares about.
 * @returns A session config carrying the defaults with the overrides
 * applied.
 */
function createConfig(overrides: Partial<TSessionConfig>): TSessionConfig {
  return { ...MissionSession.DEFAULT_CONFIG, ...overrides }
}
