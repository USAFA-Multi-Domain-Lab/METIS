import { beforeEach, describe, expect, test } from '@jest/globals'
import { Effect } from '@shared/missions/effects/Effect'
import { TargetArgument } from '@shared/target-environments/arguments/TargetArgument'
import type { TBooleanTargetParameter } from '@shared/target-environments/parameters/BooleanTargetParameter'
import { DropdownTargetParameter } from '@shared/target-environments/parameters/DropdownTargetParameter'
import { TargetDependency } from '@shared/target-environments/targets/TargetDependency'
import { TestEffect } from 'tests/helpers/projects/unit/missions/effects/TestEffect.helpers'
import { TestMission } from 'tests/helpers/projects/unit/missions/TestMission.helpers'
import { TestTarget } from 'tests/helpers/projects/unit/target-environments/targets/TestTarget.helpers'
import { TestTargetEnvironment } from 'tests/helpers/projects/unit/target-environments/TestTargetEnvironment.helpers'

/**
 * Issue checkers are evaluated on a microtask queued by the
 * {@link MissionComponent} constructor. Awaiting a macrotask lets that queue
 * drain so the registry reflects the final issue set before assertions run.
 */
function flushIssues(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  TestTargetEnvironment.createRegistry()
})

describe('Effect issues', () => {
  test('reports a missing-target issue when the target environment cannot be found', async () => {
    // No environment is registered, so the environment cannot be resolved.
    let effect = new TestEffect(new TestMission(), {
      _id: 'effect-1',
      name: 'Effect 1',
      targetId: 'target-1',
      environmentId: 'env-1',
      targetEnvironmentVersion: '1.0.0',
      arguments: [],
    })

    await flushIssues()

    expect(effect.issues.map((issue) => issue.key)).toContain(
      Effect.ISSUE_KEY_MISSING_TARGET,
    )
  })

  test('reports a missing-target issue when the target cannot be found in its environment', async () => {
    // The environment exists, but it has no matching target.
    new TestTargetEnvironment('env-1', 'Env 1', 'Test env', '1.0.0', [])

    let effect = new TestEffect(new TestMission(), {
      _id: 'effect-1',
      name: 'Effect 1',
      targetId: 'missing-target',
      environmentId: 'env-1',
      targetEnvironmentVersion: '1.0.0',
      arguments: [],
    })

    await flushIssues()

    expect(effect.issues.map((issue) => issue.key)).toContain(
      Effect.ISSUE_KEY_MISSING_TARGET,
    )
  })

  test('reports a legacy-infer issue when the effect relies on legacy environment inference', async () => {
    // The effect predates environment-id tracking: its environment id is the
    // legacy sentinel, but its target is still inferable from the registry.
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
      [],
      environment,
      [],
    )
    environment.targets = [target]

    let effect = new TestEffect(new TestMission(), {
      _id: 'effect-1',
      name: 'Effect 1',
      targetId: 'target-1',
      environmentId: Effect.LEGACY_INFER_ENV_ID,
      targetEnvironmentVersion: '1.0.0',
      arguments: [],
    })

    await flushIssues()

    expect(effect.issues.map((issue) => issue.key)).toContain(
      Effect.ISSUE_KEY_LEGACY_INFER,
    )
  })

  test('flags an outdated effect when its version precedes the latest migratable version', async () => {
    let environment = new TestTargetEnvironment(
      'env-1',
      'Env 1',
      'Test env',
      '2.0.0',
      [],
    )
    let target = new TestTarget(
      'target-1',
      'Target 1',
      'Test target',
      [],
      environment,
      ['2.0.0'],
    )
    environment.targets = [target]

    let effect = new TestEffect(new TestMission(), {
      _id: 'effect-1',
      name: 'Effect 1',
      targetId: 'target-1',
      environmentId: 'env-1',
      targetEnvironmentVersion: '1.0.0',
      arguments: [],
    })

    await flushIssues()

    expect(effect.issues.map((issue) => issue.key)).toContain(
      Effect.ISSUE_KEY_OUTDATED,
    )
  })

  test('reports no issues for an up-to-date effect with a resolvable environment and target', async () => {
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
      [],
      environment,
      [],
    )
    environment.targets = [target]

    let effect = new TestEffect(new TestMission(), {
      _id: 'effect-1',
      name: 'Effect 1',
      targetId: 'target-1',
      environmentId: 'env-1',
      targetEnvironmentVersion: '1.0.0',
      arguments: [],
    })

    await flushIssues()

    expect(effect.issues).toHaveLength(0)
  })

  test('cascades dependent argument issues so only the most relevant failure is reported', async () => {
    // `choice` only applies when `toggle` is on. Its value is invalid either
    // way, but the issue should only surface once its dependency is met.
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
      [toggleParameter, choiceParameter],
      environment,
      [],
    )
    environment.targets = [target]

    function buildEffect(toggleValue: boolean): TestEffect {
      return new TestEffect(new TestMission(), {
        _id: 'effect-1',
        name: 'Effect 1',
        targetId: 'target-1',
        environmentId: 'env-1',
        targetEnvironmentVersion: '1.0.0',
        arguments: [
          {
            _id: 'arg-toggle',
            parameterId: 'toggle',
            type: 'boolean',
            value: toggleValue,
          },
          {
            _id: 'arg-choice',
            parameterId: 'choice',
            type: 'dropdown',
            value: 999,
          },
        ],
      })
    }

    // Dependency unmet: the invalid dropdown value is suppressed.
    let suppressedEffect = buildEffect(false)
    await flushIssues()
    let suppressedChoice = suppressedEffect.arguments.find(
      (argument) => argument.parameterId === 'choice',
    )
    expect(suppressedChoice?.issues).toHaveLength(0)

    // Dependency met: the invalid dropdown value now surfaces as an issue.
    let activeEffect = buildEffect(true)
    await flushIssues()
    let activeChoice = activeEffect.arguments.find(
      (argument) => argument.parameterId === 'choice',
    )
    expect(activeChoice?.issues.map((issue) => issue.key)).toContain(
      TargetArgument.ISSUE_KEY_DROPDOWN_VALUE_MISMATCH,
    )
  })
})
