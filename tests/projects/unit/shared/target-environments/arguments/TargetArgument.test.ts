import { afterEach, beforeEach, describe, expect, test } from '@jest/globals'
import { Effect } from '@shared/missions/effects/Effect'
import { Mission } from '@shared/missions/Mission'
import { MissionPrototype } from '@shared/missions/nodes/MissionPrototype'
import {
  TargetArgument,
  type TTargetArgumentJson,
} from '@shared/target-environments/arguments/TargetArgument'
import type { TBooleanTargetParameter } from '@shared/target-environments/parameters/BooleanTargetParameter'
import { DropdownTargetParameter } from '@shared/target-environments/parameters/DropdownTargetParameter'
import type { TStringTargetParameter } from '@shared/target-environments/parameters/StringTargetParameter'
import { TargetEnvironment } from '@shared/target-environments/TargetEnvironment'
import { TargetEnvRegistry } from '@shared/target-environments/TargetEnvRegistry'
import { Target } from '@shared/target-environments/targets/Target'
import { TargetDependency } from '@shared/target-environments/targets/TargetDependency'
import { JsonSerializableArray } from '@shared/toolbox/arrays/JsonSerializableArray'
import type { TAnyObject } from '@shared/toolbox/objects/ObjectToolbox'

let activeRegistry: TargetEnvRegistry

/**
 * Issue checkers are evaluated on a microtask queued by the
 * {@link MissionComponent} constructor. Awaiting a macrotask lets that queue
 * drain so the registry reflects the final issue set before assertions run.
 */
function flushIssues(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Registers a single in-memory target carrying the provided parameters, so an
 * effect pointing at `target-1` in `env-1` resolves to a valid, up-to-date
 * target. With no migration versions, the effect is never considered outdated
 * and its arguments are therefore never locked.
 * @param parameters The parameters the target should expose.
 */
function registerTarget(parameters: Target['parameters']): void {
  let environment = new TestTargetEnvironment(
    'env-1',
    'Env 1',
    'Test env',
    '1.0.0',
    [],
  )
  let target = new TestTarget(
    'target-1',
    'Target 1',
    'Test target',
    parameters,
    environment,
    [],
  )
  environment.targets = [target]
}

/**
 * Builds an effect bound to the registered test target with the provided
 * arguments.
 * @param args The serialized arguments to hydrate onto the effect.
 */
function buildEffect(args: TTargetArgumentJson[]): TestEffect {
  return new TestEffect(new TestMission(), {
    _id: 'effect-1',
    name: 'Effect 1',
    targetId: 'target-1',
    environmentId: 'env-1',
    targetEnvironmentVersion: '1.0.0',
    arguments: args,
  })
}

describe('TargetArgument issues', () => {
  beforeEach(() => {
    activeRegistry = new TargetEnvRegistry()
  })

  afterEach(() => {
    activeRegistry.clear()
  })

  test('suppresses the issue on an argument whose dependencies are unmet, even when its value is invalid', async () => {
    // `choice` only applies when `toggle` is on. Its value is invalid, but the
    // unmet dependency means the argument is inactive and reports no issue.
    let toggleParameter: TBooleanTargetParameter = {
      _id: 'toggle',
      name: 'Toggle',
      groupingId: 'group-1',
      type: 'boolean',
    }
    let choiceParameter = DropdownTargetParameter.fromJson({
      _id: 'choice',
      name: 'Choice',
      required: false,
      groupingId: 'group-1',
      type: 'dropdown',
      options: [
        { _id: 'opt-1', name: 'One', value: 1 },
        { _id: 'opt-2', name: 'Two', value: 2 },
      ],
      dependencies: [TargetDependency.TRUTHY('toggle')],
    })
    registerTarget([toggleParameter, choiceParameter])

    let effect = buildEffect([
      {
        _id: 'arg-toggle',
        parameterId: 'toggle',
        type: 'boolean',
        value: false,
      },
      {
        _id: 'arg-choice',
        parameterId: 'choice',
        type: 'dropdown',
        value: 'wrong-value-type',
      },
    ])
    await flushIssues()

    let choice = effect.getArgumentByParameterId('choice')
    expect(choice?.dependenciesMet).toBe(false)
    // The value really is invalid; only the unmet dependency hides the issue.
    expect(choice?.valueIsInvalidOption).toBe(true)
    expect(choice?.issues).toHaveLength(0)
  })

  test('surfaces a previously suppressed issue once the dependency is met and the check is re-run', async () => {
    let toggleParameter: TBooleanTargetParameter = {
      _id: 'toggle',
      name: 'Toggle',
      groupingId: 'group-1',
      type: 'boolean',
    }
    let choiceParameter = DropdownTargetParameter.fromJson({
      _id: 'choice',
      name: 'Choice',
      required: false,
      groupingId: 'group-1',
      type: 'dropdown',
      options: [
        { _id: 'opt-1', name: 'One', value: 1 },
        { _id: 'opt-2', name: 'Two', value: 2 },
      ],
      dependencies: [TargetDependency.TRUTHY('toggle')],
    })
    registerTarget([toggleParameter, choiceParameter])

    let effect = buildEffect([
      {
        _id: 'arg-toggle',
        parameterId: 'toggle',
        type: 'boolean',
        value: false,
      },
      {
        _id: 'arg-choice',
        parameterId: 'choice',
        type: 'dropdown',
        value: 'wrong-value-type',
      },
    ])
    await flushIssues()

    let toggle = effect.getArgumentByParameterId('toggle')
    let choice = effect.getArgumentByParameterId('choice')
    expect(choice?.issues).toHaveLength(0)

    // Meeting the dependency and re-running the check surfaces the invalid
    // value that was previously suppressed.
    toggle!.value = true
    choice?.triggerIssueCheck('dependency-met-update')

    expect(choice?.issues.map((issue) => issue.key)).toContain(
      TargetArgument.ISSUE_KEY_DROPDOWN_VALUE_MISMATCH,
    )
  })

  test('reports a dropdown-value-mismatch issue for a stale dropdown value', async () => {
    let choiceParameter = DropdownTargetParameter.fromJson({
      _id: 'choice',
      name: 'Choice',
      required: false,
      groupingId: 'group-1',
      type: 'dropdown',
      options: [
        { _id: 'opt-1', name: 'One', value: 1 },
        { _id: 'opt-2', name: 'Two', value: 2 },
      ],
    })
    registerTarget([choiceParameter])

    let effect = buildEffect([
      {
        _id: 'arg-choice',
        parameterId: 'choice',
        type: 'dropdown',
        value: 'wrong-value-type',
      },
    ])
    await flushIssues()

    let choice = effect.getArgumentByParameterId('choice')
    expect(choice?.issues.map((issue) => issue.key)).toContain(
      TargetArgument.ISSUE_KEY_DROPDOWN_VALUE_MISMATCH,
    )
  })

  test('reports a pattern-mismatch issue for a string value that violates the parameter pattern', async () => {
    let callsignParameter: TStringTargetParameter = {
      _id: 'callsign',
      name: 'Callsign',
      groupingId: 'group-1',
      type: 'string',
      required: true,
      default: 'ALPHA',
      pattern: /^[A-Z]+$/,
    }
    registerTarget([callsignParameter])

    let effect = buildEffect([
      {
        _id: 'arg-callsign',
        parameterId: 'callsign',
        type: 'string',
        value: 'not-valid-123',
      },
    ])
    await flushIssues()

    let callsign = effect.getArgumentByParameterId('callsign')
    expect(callsign?.issues.map((issue) => issue.key)).toContain(
      TargetArgument.ISSUE_KEY_PATTERN_MISMATCH,
    )
  })

  test('reports no issue for an argument with satisfied dependencies and a valid value', async () => {
    let choiceParameter = DropdownTargetParameter.fromJson({
      _id: 'choice',
      name: 'Choice',
      required: false,
      groupingId: 'group-1',
      type: 'dropdown',
      options: [
        { _id: 'opt-1', name: 'One', value: 1 },
        { _id: 'opt-2', name: 'Two', value: 2 },
      ],
    })
    registerTarget([choiceParameter])

    let effect = buildEffect([
      { _id: 'arg-choice', parameterId: 'choice', type: 'dropdown', value: 1 },
    ])
    await flushIssues()

    let choice = effect.getArgumentByParameterId('choice')
    expect(choice?.dependenciesMet).toBe(true)
    expect(choice?.valueIsInvalidOption).toBe(false)
    expect(choice?.issues).toHaveLength(0)
  })
})

/* -- TEST DOUBLES -- */

/**
 * Minimal test `TargetArgument` that hydrates from JSON the same way the
 * server/client implementations do.
 */
class TestTargetArgument extends TargetArgument {
  public static fromJson(
    json: TTargetArgumentJson,
    effect: Effect,
  ): TestTargetArgument {
    let parameter = effect.target?.getParameterById(json.parameterId)

    if (json.type === 'unknown' && parameter) {
      json = { ...json, type: parameter.type } as TTargetArgumentJson
    }

    TestTargetArgument.applyDefault(json, parameter)

    let context = TestTargetArgument.buildContext(json, effect.normalize())
    return new TestTargetArgument(
      effect.normalize(),
      json._id,
      json.parameterId,
      context,
    )
  }

  public toTargetEnvContext(): TAnyObject {
    return {}
  }
}

/**
 * Minimal test `TargetEnvironment` that holds targets in-memory.
 */
class TestTargetEnvironment extends TargetEnvironment {
  public constructor(
    _id: TargetEnvironment['_id'],
    name: TargetEnvironment['name'],
    description: TargetEnvironment['description'],
    version: TargetEnvironment['version'],
    targets: TestTarget[] = [],
  ) {
    super(_id, name, description, version, targets)

    this.register()
  }

  public register(): this {
    activeRegistry.register(this)
    return this
  }
}

/**
 * Minimal test `Target` with an explicit migration-version list.
 */
class TestTarget extends Target {
  private _migrationVersions: Target['migrationVersions']

  public get migrationVersions(): Target['migrationVersions'] {
    return this._migrationVersions
  }

  public constructor(
    _id: Target['_id'],
    name: Target['name'],
    description: Target['description'],
    parameters: Target['parameters'],
    environment: Target['environment'],
    migrationVersions: Target['migrationVersions'],
  ) {
    super(_id, name, description, parameters, environment)

    this._migrationVersions = migrationVersions
  }
}

/**
 * Minimal test `Effect` that hydrates its arguments via {@link TestTargetArgument}.
 */
class TestEffect extends Effect {
  public constructor(
    mission: TestMission,
    data: {
      _id: Effect['_id']
      name: Effect['name']
      targetId: Effect['targetId']
      environmentId: Effect['environmentId']
      targetEnvironmentVersion: Effect['targetEnvironmentVersion']
      arguments: TTargetArgumentJson[]
    },
  ) {
    let context: Effect['context'] = {
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
        return mission
      },
    } as unknown as Effect['context']

    super(
      data._id,
      data.name,
      data.targetId,
      data.environmentId,
      data.targetEnvironmentVersion,
      0,
      'Test effect description',
      context,
      data.arguments,
      'local-key-1',
    )
  }

  protected parseArguments(
    data: TTargetArgumentJson[],
  ): JsonSerializableArray<TestTargetArgument> {
    return JsonSerializableArray.fromJson(data, (datum: TTargetArgumentJson) =>
      TestTargetArgument.fromJson(datum, this),
    )
  }

  protected determineTarget(
    targetId: string,
    environmentId: string,
  ): TestTarget | null {
    if (!activeRegistry) return null

    if (environmentId === Effect.LEGACY_INFER_ENV_ID) {
      return (activeRegistry.inferTarget(targetId) as TestTarget | null) ?? null
    }

    let environment = activeRegistry.get(environmentId)
    if (!environment) return null

    return (environment.getTarget(targetId) as TestTarget | null) ?? null
  }
}

/**
 * Minimal test `MissionPrototype` implementation.
 */
class TestMissionPrototype extends MissionPrototype {
  // Intentionally empty.
}

/**
 * Minimal test `Mission` that wires up the issue registry via its superclass.
 */
class TestMission extends Mission {
  public constructor() {
    super(
      'mission-1',
      'Mission 1',
      1,
      null,
      null,
      null,
      null,
      null,
      {},
      [],
      [],
      [],
      [],
      [],
    )
  }

  protected initializeRoot(): TestMissionPrototype {
    return new TestMissionPrototype(this, { _id: 'ROOT' })
  }

  protected importPrototype(data?: any, options?: any): any {
    let prototype = new TestMissionPrototype(this, data, options)
    this.prototypes.push(prototype)
    return prototype
  }

  protected importResources(_data: any[]): void {}

  protected importForces(_data: any[]): void {}

  protected importFiles(_data: any[]): void {}

  protected importEffects(_data: any[]): void {}

  public createEffect(_target: any, _trigger: any): any {
    throw new Error('Not implemented in unit tests.')
  }
}
