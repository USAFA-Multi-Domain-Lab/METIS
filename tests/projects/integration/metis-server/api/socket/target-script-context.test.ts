import { afterEach, describe, expect, test } from '@jest/globals'
import { ServerEffect } from '@server/missions/effects/ServerEffect'
import type { ServerMission } from '@server/missions/ServerMission'
import { TargetScriptContext } from '@server/target-environments/context/TargetScriptContext'
import { ServerTarget } from '@server/target-environments/ServerTarget'
import { ServerTargetEnvironment } from '@server/target-environments/ServerTargetEnvironment'
import { TargetMigrationRegistry } from '@server/target-environments/TargetMigrationRegistry'
import type { TTargetArgumentJson } from '@shared/target-environments/arguments/TargetArgument'
import { TargetParameter } from '@shared/target-environments/parameters/TargetParameter'
import { TargetEnvRegistry } from '@shared/target-environments/TargetEnvRegistry'
import { TargetDependency } from '@shared/target-environments/targets/TargetDependency'
import { TestSession } from 'tests/helpers/TestSession'

/**
 * An isolated registry of target environments used only by this test file, so
 * an effect can resolve a self-contained gated target without registering
 * anything in the production `ServerTargetEnvironment.REGISTRY` singleton. It is
 * consulted by {@link TestGatedEffect.determineTarget}, exactly as the real
 * `ServerEffect` consults the production registry.
 */
let activeRegistry: TargetEnvRegistry<TMetisServerComponents>

/**
 * A `ServerTarget` whose constructor is exposed to the test. It carries the
 * gated parameters under test and a no-op script, because these tests reach
 * `getArguments` through the context directly rather than executing the script.
 */
class TestGatedTarget extends ServerTarget {
  public constructor(
    parameters: ServerTarget['parameters'],
    environment: ServerTargetEnvironment,
  ) {
    super(
      'test-target',
      'Test Target',
      'A self-contained target used to exercise argument resolution.',
      parameters,
      environment,
      // Never executed: the tests drive `getArguments` through the context.
      async () => {},
      'test-target-schema-path',
      // No migration versions, so the effect is never treated as outdated and
      // its arguments are never locked.
      new TargetMigrationRegistry(),
    )
  }
}

/**
 * A `ServerEffect` that resolves its target from the isolated
 * {@link activeRegistry} instead of the production singleton. Everything else —
 * argument parsing, dependency resolution, and value exposure — is the real
 * server behavior.
 */
class TestGatedEffect extends ServerEffect<'sessionTriggeredEffect'> {
  public constructor(
    mission: ServerMission,
    argumentsJson: TTargetArgumentJson[],
  ) {
    super(
      'test-effect',
      'Test Effect',
      'test-target',
      'test-env',
      '1.0.0',
      0,
      'A self-contained effect used to exercise argument resolution.',
      {
        type: 'sessionTriggeredEffect',
        trigger: 'session-start',
        get sourceAction() {
          return null
        },
        get sourceNode() {
          return null
        },
        get sourceForce() {
          return null
        },
        sourceMission: mission,
        get host() {
          return this.sourceMission
        },
      },
      argumentsJson,
      'test-effect-key',
    )
  }

  protected determineTarget(
    targetId: string,
    environmentId: string,
  ): ServerTarget | null {
    return activeRegistry.getTarget(targetId, environmentId) ?? null
  }
}

/**
 * Registers a self-contained target exposing a boolean `toggle` and a boolean
 * `detail` that depends on `toggle` being truthy, so `detail`'s dependency is
 * genuinely resolved rather than asserted by hand.
 */
function registerGatedTarget(): void {
  activeRegistry = new TargetEnvRegistry()
  let environment = new ServerTargetEnvironment(
    'test-env',
    'Test Env',
    'A self-contained test environment.',
    '1.0.0',
    [],
    [],
    'test-env-root',
  )
  let parameters = TargetParameter.fromJson([
    { _id: 'toggle', name: 'Toggle', groupingId: 'gate', type: 'boolean' },
    {
      _id: 'detail',
      name: 'Detail',
      groupingId: 'gate',
      type: 'boolean',
      dependencies: [TargetDependency.TRUTHY('toggle')],
    },
  ])
  let target = new TestGatedTarget(parameters, environment)
  environment.targets = [target]
  activeRegistry.register(environment)
}

describe('TargetScriptContext getArguments', () => {
  const SUITE_PREFIX = 'test_target_script_context'

  /**
   * Launches a started single-member session and returns the real realm the
   * member plays in, which is the realm the context is built against.
   */
  async function launchRealm() {
    let context = await TestSession.launch({
      namePrefix: SUITE_PREFIX,
      mission: {
        // Session-start effects only slow the start phase; this suite builds
        // its own effect, so the mission's are stripped.
        customize: (payload) => {
          payload.effects = []
        },
      },
      members: [{ force: 0 }],
      start: true,
    })
    let realm = context.members[0].member.subscribedRealm
    expect(realm).toBeTruthy()
    return realm
  }

  afterEach(() => {
    activeRegistry?.clear()
    TestSession.disposeAll()
  })

  test('resolves a met dependency to its value and a parameter with no argument to undefined', async () => {
    registerGatedTarget()
    let realm = await launchRealm()

    // `toggle` is on, so `detail`'s dependency is met.
    let effect = new TestGatedEffect(realm.mission, [
      {
        _id: 'arg-toggle',
        parameterId: 'toggle',
        type: 'boolean',
        value: true,
      },
      {
        _id: 'arg-detail',
        parameterId: 'detail',
        type: 'boolean',
        value: true,
      },
    ])
    let context = TargetScriptContext.forEffect({
      effectType: 'sessionTriggeredEffect',
      realm,
      effect,
    })

    let resolved: Record<string, unknown> = {}
    await context.run(async (exposed) => {
      resolved.toggle = exposed.getArguments('toggle')
      resolved.detail = exposed.getArguments('detail')
      resolved.missing = exposed.getArguments('absent-parameter')
    })

    expect(resolved.toggle).toBe(true)
    // Dependency met, so the value is exposed to the script.
    expect(resolved.detail).toBe(true)
    // No argument exists for this parameter id.
    expect(resolved.missing).toBeUndefined()
  }, 30000)

  test('resolves an argument whose dependency is unmet to undefined', async () => {
    registerGatedTarget()
    let realm = await launchRealm()

    // `toggle` is off, so `detail`'s dependency is unmet.
    let effect = new TestGatedEffect(realm.mission, [
      {
        _id: 'arg-toggle',
        parameterId: 'toggle',
        type: 'boolean',
        value: false,
      },
      {
        _id: 'arg-detail',
        parameterId: 'detail',
        type: 'boolean',
        value: true,
      },
    ])
    let context = TargetScriptContext.forEffect({
      effectType: 'sessionTriggeredEffect',
      realm,
      effect,
    })

    let resolved: Record<string, unknown> = {}
    await context.run(async (exposed) => {
      resolved.toggle = exposed.getArguments('toggle')
      resolved.detail = exposed.getArguments('detail')
    })

    // The ungated argument still resolves, showing the undefined below comes
    // from the unmet dependency and not the harness.
    expect(resolved.toggle).toBe(false)
    expect(resolved.detail).toBeUndefined()
  }, 30000)
})
