import { afterEach, beforeEach, describe, expect, test } from '@jest/globals'
import { Effect } from '@shared/missions/effects/Effect'
import { Mission } from '@shared/missions/Mission'
import { MissionPrototype } from '@shared/missions/nodes/MissionPrototype'
import type { TBooleanArg } from '@shared/target-environments/args/BooleanArg'
import type { TDropdownArg } from '@shared/target-environments/args/DropdownArg'
import type { TLargeStringArg } from '@shared/target-environments/args/LargeStringArg'
import { LargeStringArg } from '@shared/target-environments/args/LargeStringArg'
import type { TMissionComponentArg } from '@shared/target-environments/args/mission-component/MissionComponentArg'
import { MissionComponentArg } from '@shared/target-environments/args/mission-component/MissionComponentArg'
import type { TNumberArg } from '@shared/target-environments/args/NumberArg'
import type { TStringArg } from '@shared/target-environments/args/StringArg'
import { StringArg } from '@shared/target-environments/args/StringArg'
import { TargetEnvironment } from '@shared/target-environments/TargetEnvironment'
import { TargetEnvRegistry } from '@shared/target-environments/TargetEnvRegistry'
import { Target } from '@shared/target-environments/targets/Target'
import { TargetDependency } from '@shared/target-environments/targets/TargetDependency'
import type { TAnyObject } from '@shared/toolbox/objects/ObjectToolbox'

let ACTIVE_REGISTRY: TargetEnvRegistry

describe('Effect.additionalIssues()', () => {
  beforeEach(() => {
    ACTIVE_REGISTRY = new TargetEnvRegistry()
  })

  afterEach(() => {
    ACTIVE_REGISTRY.clear()
  })

  test('returns a general issue when the target environment or target cannot be found', () => {
    // Register this environment without any targets.
    new TestTargetEnvironment('env-1', 'Env 1', 'Test env', '1.0.0', [])

    let effect = new TestEffect(new TestMission(), {
      _id: 'effect-1',
      name: 'Effect 1',
      targetId: 'missing-target',
      environmentId: 'env-1',
      targetEnvironmentVersion: '1.0.0',
      args: {},
    })

    expect(effect.issues).toHaveLength(1)
    expect(effect.issues[0].type).toBe('general')
    expect(effect.issues[0].message).toContain(
      "has a target or a target environment that couldn't be found",
    )
  })

  test('returns an outdated issue when the effect target-environment version is earlier than the latest migratable version', () => {
    let environment = new TestTargetEnvironment(
      'env-1',
      'Env 1',
      'Test env',
      '1.0.1',
      [],
    )

    let target = new TestTarget(
      'target-1',
      'Target 1',
      'Test target',
      [],
      environment,
      ['1.0.1'],
    )

    environment.targets = [target]

    let effect = new TestEffect(new TestMission(), {
      _id: 'effect-1',
      name: 'Effect 1',
      targetId: 'target-1',
      environmentId: 'env-1',
      targetEnvironmentVersion: '1.0.0',
      args: {},
    })

    expect(effect.issues).toHaveLength(1)
    expect(effect.issues[0].type).toBe('outdated')
    expect(effect.issues[0].message).toContain('with an incompatible version')
  })

  test("returns a general issue when the effect has an argument the target doesn't recognize", () => {
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
      args: {
        unknownArgId: 'some value',
      },
    })

    expect(effect.issues).toHaveLength(1)
    expect(effect.issues[0].message).toContain(
      'has an argument, "unknownArgId", that couldn\'t be found',
    )
  })

  test('returns a general issue when a required argument exists but has no value', () => {
    let requiredArg: TStringArg = {
      _id: 'arg-1',
      name: 'Arg 1',
      required: true,
      groupingId: 'group-1',
      type: 'string',
      default: 'default',
    }

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
      [requiredArg],
      environment,
      [],
    )

    environment.targets = [target]

    let args: TAnyObject = {
      'arg-1': undefined,
    }

    let effect = new TestEffect(new TestMission(), {
      _id: 'effect-1',
      name: 'Effect 1',
      targetId: 'target-1',
      environmentId: 'env-1',
      targetEnvironmentVersion: '1.0.0',
      args,
    })

    expect(effect.issues).toHaveLength(1)
    expect(effect.issues[0].message).toContain('is required, yet has no value')
  })

  test('returns a general issue when a boolean argument exists but has no value', () => {
    let toggleArg: TBooleanArg = {
      _id: 'toggle',
      name: 'Toggle',
      groupingId: 'group-1',
      type: 'boolean',
    }

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
      [toggleArg],
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
      args: {
        toggle: undefined,
      },
    })

    expect(effect.issues).toHaveLength(1)
    expect(effect.issues[0].type).toBe('general')
    expect(effect.issues[0].message).toContain('toggle switch')
  })

  test('returns a general issue when a boolean argument is missing from effect args', () => {
    let toggleArg: TBooleanArg = {
      _id: 'toggle',
      name: 'Toggle',
      groupingId: 'group-1',
      type: 'boolean',
    }

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
      [toggleArg],
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
      args: {},
    })

    expect(effect.issues).toHaveLength(1)
    expect(effect.issues[0].type).toBe('general')
    expect(effect.issues[0].message).toContain('is missing')
    expect(effect.issues[0].message).toContain('_id: "toggle"')
  })

  test('returns a general issue when a required target argument is missing from effect args', () => {
    let requiredArg: TStringArg = {
      _id: 'arg-1',
      name: 'Arg 1',
      required: true,
      groupingId: 'group-1',
      type: 'string',
      default: 'default',
    }

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
      [requiredArg],
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
      args: {},
    })

    expect(effect.issues).toHaveLength(1)
    expect(effect.issues[0].message).toContain('is missing')
  })

  test('returns a general issue when the effect references a target but not a target environment (legacy infer env id)', () => {
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
      environmentId: (Effect as any).LEGACY_INFER_ENV_ID,
      targetEnvironmentVersion: '1.0.0',
      args: {},
    })

    expect(effect.issues).toHaveLength(1)
    expect(effect.issues[0].type).toBe('general')
    expect(effect.issues[0].message).toContain(
      'has a reference to a target, but not to a target environment',
    )
  })

  test('returns a general issue when legacy target inference is ambiguous (same target id in multiple environments)', () => {
    let environment1 = new TestTargetEnvironment(
      'env-1',
      'Env 1',
      'Test env 1',
      '1.0.0',
      [],
    )

    let environment2 = new TestTargetEnvironment(
      'env-2',
      'Env 2',
      'Test env 2',
      '1.0.0',
      [],
    )

    let target1 = new TestTarget(
      'target-1',
      'Target 1 (Env 1)',
      'Test target',
      [],
      environment1,
      [],
    )

    let target2 = new TestTarget(
      'target-1',
      'Target 1 (Env 2)',
      'Test target',
      [],
      environment2,
      [],
    )

    environment1.targets = [target1]
    environment2.targets = [target2]

    let effect = new TestEffect(new TestMission(), {
      _id: 'effect-1',
      name: 'Effect 1',
      targetId: 'target-1',
      environmentId: Effect.LEGACY_INFER_ENV_ID,
      targetEnvironmentVersion: '1.0.0',
      args: {},
    })

    expect(effect.issues).toHaveLength(1)
    expect(effect.issues[0].type).toBe('general')
    expect(effect.issues[0].message).toContain(
      "has a target or a target environment that couldn't be found",
    )
  })

  test('returns a general issue when the effect targets a force that cannot be found', () => {
    let forceArg: TMissionComponentArg = MissionComponentArg.fromJson({
      _id: 'forceRef',
      name: 'Force',
      groupingId: 'group-1',
      type: 'force',
      required: true,
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
      [forceArg],
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
      args: {
        forceRef: {
          forceKey: 'force-1',
          forceName: 'Force 1',
        },
      },
    })

    expect(effect.issues).toHaveLength(1)
    expect(effect.issues[0].type).toBe('general')
    expect(effect.issues[0].message).toContain(
      'is targeting a force, "Force 1", which cannot be found',
    )
  })

  test("returns a general issue when a required force argument is 'self' but the effect has no source force", () => {
    let forceArg: TMissionComponentArg = MissionComponentArg.fromJson({
      _id: 'forceRef',
      name: 'Force',
      groupingId: 'group-1',
      type: 'force',
      required: true,
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
      [forceArg],
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
      args: {
        forceRef: {
          forceKey: 'self',
          forceName: '(self)',
        },
      },
    })

    expect(effect.issues).toHaveLength(1)
    expect(effect.issues[0].type).toBe('general')
    expect(effect.issues[0].message).toContain(
      'is targeting a force which cannot be found',
    )
  })

  test("does not return an issue when a required force argument is 'self' and the effect has a source force", () => {
    let forceArg: TMissionComponentArg = MissionComponentArg.fromJson({
      _id: 'forceRef',
      name: 'Force',
      groupingId: 'group-1',
      type: 'force',
      required: true,
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
      [forceArg],
      environment,
      [],
    )

    environment.targets = [target]

    let mission = new TestMission()

    let sourceForce = { localKey: 'force-1', name: 'Force 1' }
    let sourceNode = { localKey: 'node-1', name: 'Node 1' }
    let sourceAction = {
      localKey: 'action-1',
      name: 'Action 1',
      force: sourceForce,
      node: sourceNode,
    }

    let context: Effect['context'] = {
      type: 'executionTriggeredEffect',
      trigger: 'execution-success',
      sourceAction,
      get sourceNode() {
        return sourceNode
      },
      get sourceForce() {
        return sourceForce
      },
      get sourceMission() {
        return mission
      },
      get host() {
        return sourceAction
      },
    }

    let effect = new TestEffect(
      mission,
      {
        _id: 'effect-1',
        name: 'Effect 1',
        targetId: 'target-1',
        environmentId: 'env-1',
        targetEnvironmentVersion: '1.0.0',
        args: {
          forceRef: {
            forceKey: 'self',
            forceName: '(self)',
          },
        },
      },
      { context },
    )

    expect(effect.issues).toHaveLength(0)
  })

  test('returns a general issue when the effect targets a node that cannot be found', () => {
    let nodeArg: TMissionComponentArg = MissionComponentArg.fromJson({
      _id: 'nodeRef',
      name: 'Node',
      groupingId: 'group-1',
      type: 'node',
      required: true,
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
      [nodeArg],
      environment,
      [],
    )

    environment.targets = [target]

    let mission = new TestMission({
      forcesByLocalKey: {
        'force-1': { localKey: 'force-1', name: 'Force 1' },
      },
    })

    let effect = new TestEffect(mission, {
      _id: 'effect-1',
      name: 'Effect 1',
      targetId: 'target-1',
      environmentId: 'env-1',
      targetEnvironmentVersion: '1.0.0',
      args: {
        nodeRef: {
          forceKey: 'force-1',
          forceName: 'Force 1',
          nodeKey: 'node-1',
          nodeName: 'Node 1',
        },
      },
    })

    expect(effect.issues).toHaveLength(1)
    expect(effect.issues[0].type).toBe('general')
    expect(effect.issues[0].message).toContain(
      'targets a node, "Node 1", which cannot be found',
    )
  })

  test("does not return an issue when a required node argument is 'self' and the effect has a source force and node", () => {
    let nodeArg: TMissionComponentArg = MissionComponentArg.fromJson({
      _id: 'nodeRef',
      name: 'Node',
      groupingId: 'group-1',
      type: 'node',
      required: true,
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
      [nodeArg],
      environment,
      [],
    )

    environment.targets = [target]

    let mission = new TestMission()

    let sourceForce = { localKey: 'force-1', name: 'Force 1' }
    let sourceNode = { localKey: 'node-1', name: 'Node 1' }
    let sourceAction = {
      localKey: 'action-1',
      name: 'Action 1',
      force: sourceForce,
      node: sourceNode,
    }

    let context: Effect['context'] = {
      type: 'executionTriggeredEffect',
      trigger: 'execution-success',
      sourceAction,
      get sourceNode() {
        return sourceNode
      },
      get sourceForce() {
        return sourceForce
      },
      get sourceMission() {
        return mission
      },
      get host() {
        return sourceAction
      },
    }

    let effect = new TestEffect(
      mission,
      {
        _id: 'effect-1',
        name: 'Effect 1',
        targetId: 'target-1',
        environmentId: 'env-1',
        targetEnvironmentVersion: '1.0.0',
        args: {
          nodeRef: {
            forceKey: 'self',
            forceName: '(self)',
            nodeKey: 'self',
            nodeName: '(self)',
          },
        },
      },
      { context },
    )

    expect(effect.issues).toHaveLength(0)
  })

  test("returns a general issue when a required node argument is 'self' but the effect has no source node", () => {
    let nodeArg: TMissionComponentArg = MissionComponentArg.fromJson({
      _id: 'nodeRef',
      name: 'Node',
      groupingId: 'group-1',
      type: 'node',
      required: true,
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
      [nodeArg],
      environment,
      [],
    )

    environment.targets = [target]

    let mission = new TestMission()

    let sourceForce = { localKey: 'force-1', name: 'Force 1' }
    let sourceAction = {
      localKey: 'action-1',
      name: 'Action 1',
      force: sourceForce,
      node: null,
    }

    let context: Effect['context'] = {
      type: 'executionTriggeredEffect',
      trigger: 'execution-success',
      sourceAction,
      get sourceNode() {
        return null
      },
      get sourceForce() {
        return sourceForce
      },
      get sourceMission() {
        return mission
      },
      get host() {
        return sourceAction
      },
    }

    let effect = new TestEffect(
      mission,
      {
        _id: 'effect-1',
        name: 'Effect 1',
        targetId: 'target-1',
        environmentId: 'env-1',
        targetEnvironmentVersion: '1.0.0',
        args: {
          nodeRef: {
            forceKey: 'self',
            forceName: '(self)',
            nodeKey: 'self',
            nodeName: '(self)',
          },
        },
      },
      { context },
    )

    expect(effect.issues).toHaveLength(1)
    expect(effect.issues[0].type).toBe('general')
    expect(effect.issues[0].message).toContain(
      'targets a node which cannot be found',
    )
  })

  test('returns a general issue when the effect targets an action that cannot be found', () => {
    let actionArg: TMissionComponentArg = MissionComponentArg.fromJson({
      _id: 'actionRef',
      name: 'Action',
      type: 'action',
      required: true,
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
      [actionArg],
      environment,
      [],
    )

    environment.targets = [target]

    let mission = new TestMission({
      forcesByLocalKey: {
        'force-1': { localKey: 'force-1', name: 'Force 1' },
      },
      nodesByLocalKey: {
        'force-1:node-1': { localKey: 'node-1', name: 'Node 1' },
      },
    })

    let effect = new TestEffect(mission, {
      _id: 'effect-1',
      name: 'Effect 1',
      targetId: 'target-1',
      environmentId: 'env-1',
      targetEnvironmentVersion: '1.0.0',
      args: {
        actionRef: {
          forceKey: 'force-1',
          forceName: 'Force 1',
          nodeKey: 'node-1',
          nodeName: 'Node 1',
          actionKey: 'action-1',
          actionName: 'Action 1',
        },
      },
    })

    expect(effect.issues).toHaveLength(1)
    expect(effect.issues[0].type).toBe('general')
    expect(effect.issues[0].message).toContain(
      'targets an action, "Action 1", which cannot be found',
    )
  })

  test("does not return an issue when a required action argument is 'self' and the effect has a source force, node, and action", () => {
    let actionArg: TMissionComponentArg = MissionComponentArg.fromJson({
      _id: 'actionRef',
      name: 'Action',
      type: 'action',
      required: true,
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
      [actionArg],
      environment,
      [],
    )

    environment.targets = [target]

    let mission = new TestMission()

    let sourceForce = { localKey: 'force-1', name: 'Force 1' }
    let sourceNode = { localKey: 'node-1', name: 'Node 1' }
    let sourceAction = {
      localKey: 'action-1',
      name: 'Action 1',
      force: sourceForce,
      node: sourceNode,
    }

    let context: Effect['context'] = {
      type: 'executionTriggeredEffect',
      trigger: 'execution-success',
      sourceAction,
      get sourceNode() {
        return sourceNode
      },
      get sourceForce() {
        return sourceForce
      },
      get sourceMission() {
        return mission
      },
      get host() {
        return sourceAction
      },
    }

    let effect = new TestEffect(
      mission,
      {
        _id: 'effect-1',
        name: 'Effect 1',
        targetId: 'target-1',
        environmentId: 'env-1',
        targetEnvironmentVersion: '1.0.0',
        args: {
          actionRef: {
            forceKey: 'self',
            forceName: '(self)',
            nodeKey: 'self',
            nodeName: '(self)',
            actionKey: 'self',
            actionName: '(self)',
          },
        },
      },
      { context },
    )

    expect(effect.issues).toHaveLength(0)
  })

  test("returns a general issue when a required action argument is 'self' but the effect has no source action", () => {
    let actionArg: TMissionComponentArg = MissionComponentArg.fromJson({
      _id: 'actionRef',
      name: 'Action',
      type: 'action',
      required: true,
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
      [actionArg],
      environment,
      [],
    )

    environment.targets = [target]

    let mission = new TestMission({
      forcesByLocalKey: {
        'force-1': { localKey: 'force-1', name: 'Force 1' },
      },
      nodesByLocalKey: {
        'force-1:node-1': { localKey: 'node-1', name: 'Node 1' },
      },
    })

    let context: Effect['context'] = {
      type: 'executionTriggeredEffect',
      trigger: 'execution-success',
      sourceAction: null,
      get sourceNode() {
        return null
      },
      get sourceForce() {
        return null
      },
      get sourceMission() {
        return mission
      },
      get host() {
        return mission
      },
    }

    let effect = new TestEffect(
      mission,
      {
        _id: 'effect-1',
        name: 'Effect 1',
        targetId: 'target-1',
        environmentId: 'env-1',
        targetEnvironmentVersion: '1.0.0',
        args: {
          actionRef: {
            forceKey: 'force-1',
            forceName: 'Force 1',
            nodeKey: 'node-1',
            nodeName: 'Node 1',
            actionKey: 'self',
            actionName: '(self)',
          },
        },
      },
      { context },
    )

    expect(effect.issues).toHaveLength(1)
    expect(effect.issues[0].type).toBe('general')
    expect(effect.issues[0].message).toContain(
      'targets an action which cannot be found',
    )
  })

  test('returns a general issue when the effect targets a file that cannot be found', () => {
    let fileArg: TMissionComponentArg = MissionComponentArg.fromJson({
      _id: 'fileRef',
      name: 'File',
      groupingId: 'group-1',
      type: 'file',
      required: true,
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
      [fileArg],
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
      args: {
        fileRef: {
          fileId: 'file-1',
          fileName: 'File 1',
        },
      },
    })

    expect(effect.issues).toHaveLength(1)
    expect(effect.issues[0].type).toBe('general')
    expect(effect.issues[0].message).toContain(
      'targets a file, "File 1", which cannot be found',
    )
  })

  test('does not return an issue when the effect targets a file that exists', () => {
    let fileArg: TMissionComponentArg = MissionComponentArg.fromJson({
      _id: 'fileRef',
      name: 'File',
      groupingId: 'group-1',
      type: 'file',
      required: true,
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
      [fileArg],
      environment,
      [],
    )

    environment.targets = [target]

    let mission = new TestMission({
      filesById: {
        'file-1': { _id: 'file-1', name: 'File 1' },
      },
    })

    let effect = new TestEffect(mission, {
      _id: 'effect-1',
      name: 'Effect 1',
      targetId: 'target-1',
      environmentId: 'env-1',
      targetEnvironmentVersion: '1.0.0',
      args: {
        fileRef: {
          fileId: 'file-1',
          fileName: 'File 1',
        },
      },
    })

    expect(effect.issues).toHaveLength(0)
  })

  test('does not return an issue when dependencies are not met and a dependent required argument is missing from effect args', () => {
    let toggleArg: TBooleanArg = {
      _id: 'toggle',
      name: 'Toggle',
      groupingId: 'group-1',
      type: 'boolean',
    }

    let dependentArg: TStringArg = {
      ...StringArg.fromJson({
        _id: 'dependent',
        name: 'Dependent',
        required: true,
        groupingId: 'group-1',
        type: 'string',
        default: 'default',
        dependencies: [TargetDependency.TRUTHY('toggle')],
      }),
    }

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
      [toggleArg, dependentArg],
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
      args: {
        toggle: false,
      },
    })

    expect(effect.issues).toHaveLength(0)
  })

  test('returns a general issue when dependencies are met and a dependent required argument is missing from effect args', () => {
    let toggleArg: TBooleanArg = {
      _id: 'toggle',
      name: 'Toggle',
      groupingId: 'group-1',
      type: 'boolean',
    }

    let dependentArg: TStringArg = {
      ...StringArg.fromJson({
        _id: 'dependent',
        name: 'Dependent',
        required: true,
        groupingId: 'group-1',
        type: 'string',
        default: 'default',
        dependencies: [TargetDependency.TRUTHY('toggle')],
      }),
    }

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
      [toggleArg, dependentArg],
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
      args: {
        toggle: true,
      },
    })

    expect(effect.issues).toHaveLength(1)
    expect(effect.issues[0].type).toBe('general')
    expect(effect.issues[0].message).toContain('is missing')
    expect(effect.issues[0].message).toContain('_id: "dependent"')
  })

  test("returns a general issue when an argument's dependencies are not met but the argument has a value", () => {
    let toggleArg: TBooleanArg = {
      _id: 'toggle',
      name: 'Toggle',
      groupingId: 'group-1',
      type: 'boolean',
    }

    let dependentArg: TStringArg = {
      ...StringArg.fromJson({
        _id: 'dependent',
        name: 'Dependent',
        required: true,
        groupingId: 'group-1',
        type: 'string',
        default: 'default',
        dependencies: [TargetDependency.TRUTHY('toggle')],
      }),
    }

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
      [toggleArg, dependentArg],
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
      args: {
        toggle: false,
        dependent: 'value that should not exist',
      },
    })

    expect(effect.issues).toHaveLength(1)
    expect(effect.issues[0].message).toContain("doesn't belong")
  })

  test('returns a general issue when a dropdown selection is not one of the target options', () => {
    let dropdownArg: TDropdownArg = {
      _id: 'choice',
      name: 'Choice',
      required: false,
      groupingId: 'group-1',
      type: 'dropdown',
      options: [
        {
          _id: 'opt-1',
          name: 'One',
          value: 1,
        },
        {
          _id: 'opt-2',
          name: 'Two',
          value: 2,
        },
      ],
    }

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
      [dropdownArg],
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
      args: {
        choice: 3,
      },
    })

    expect(effect.issues).toHaveLength(1)
    expect(effect.issues[0].message).toContain('invalid option selected')
  })

  test('does not return a required-arg issue when dependencies are not met and the arg has no value', () => {
    let toggleArg: TBooleanArg = {
      _id: 'toggle',
      name: 'Toggle',
      groupingId: 'group-1',
      type: 'boolean',
    }

    let dependentArg: TStringArg = {
      ...StringArg.fromJson({
        _id: 'dependent',
        name: 'Dependent',
        required: true,
        groupingId: 'group-1',
        type: 'string',
        default: 'default',
        dependencies: [TargetDependency.TRUTHY('toggle')],
      }),
    }

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
      [toggleArg, dependentArg],
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
      args: {
        toggle: false,
        dependent: undefined,
      },
    })

    expect(effect.issues).toHaveLength(0)
  })

  test("returns a general issue when a number argument's value is not a number", () => {
    let numberArg: TNumberArg = {
      _id: 'numArg',
      name: 'Number Arg',
      groupingId: 'group-1',
      type: 'number',
      required: true,
      default: 0,
    }

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
      [numberArg],
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
      args: {
        numArg: 'not-a-number',
      },
    })

    expect(effect.issues).toHaveLength(1)
    expect(effect.issues[0].message).toContain(
      'is expected to be of type, "number"',
    )
  })

  test("does not return an issue when a number argument's value matches the expected number type", () => {
    let numberArg: TNumberArg = {
      _id: 'numArg',
      name: 'Number Arg',
      groupingId: 'group-1',
      type: 'number',
      required: true,
      default: 0,
    }

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
      [numberArg],
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
      args: {
        numArg: 42,
      },
    })

    expect(effect.issues).toHaveLength(0)
  })

  test("returns a general issue when a boolean argument's value is not a boolean", () => {
    let booleanArg: TBooleanArg = {
      _id: 'boolArg',
      name: 'Boolean Arg',
      groupingId: 'group-1',
      type: 'boolean',
    }

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
      [booleanArg],
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
      args: {
        boolArg: 'not-a-boolean',
      },
    })

    expect(effect.issues).toHaveLength(1)
    expect(effect.issues[0].message).toContain(
      'is expected to be of type, "boolean"',
    )
  })

  test("does not return an issue when a boolean argument's value matches the expected boolean type", () => {
    let booleanArg: TBooleanArg = {
      _id: 'boolArg',
      name: 'Boolean Arg',
      groupingId: 'group-1',
      type: 'boolean',
    }

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
      [booleanArg],
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
      args: {
        boolArg: true,
      },
    })

    expect(effect.issues).toHaveLength(0)
  })

  test("returns a general issue when a string argument's value is not a string", () => {
    let stringArg: TStringArg = {
      ...StringArg.fromJson({
        _id: 'strArg',
        name: 'String Arg',
        groupingId: 'group-1',
        type: 'string',
        required: true,
        default: '',
      }),
    }

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
      [stringArg],
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
      args: {
        strArg: 12345,
      },
    })

    expect(effect.issues).toHaveLength(1)
    expect(effect.issues[0].message).toContain(
      'is expected to be of type, "string"',
    )
  })

  test("does not return an issue when a string argument's value matches the expected string type", () => {
    let stringArg: TStringArg = {
      ...StringArg.fromJson({
        _id: 'strArg',
        name: 'String Arg',
        groupingId: 'group-1',
        type: 'string',
        required: true,
        default: '',
      }),
    }

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
      [stringArg],
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
      args: {
        strArg: 'This is a string',
      },
    })

    expect(effect.issues).toHaveLength(0)
  })

  test("returns a general issue when a large-string argument's value is not a string", () => {
    let largeStringArg: TLargeStringArg = {
      ...LargeStringArg.fromJson({
        _id: 'largeStrArg',
        name: 'Large String Arg',
        groupingId: 'group-1',
        type: 'large-string',
        required: true,
        default: '',
      }),
    }

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
      [largeStringArg],
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
      args: {
        largeStrArg: 12345,
      },
    })

    expect(effect.issues).toHaveLength(1)
    expect(effect.issues[0].message).toContain(
      'is expected to be of type, "string"',
    )
  })

  test("does not return an issue when a large-string argument's value matches the expected string type", () => {
    let largeStringArg: TLargeStringArg = {
      ...LargeStringArg.fromJson({
        _id: 'largeStrArg',
        name: 'Large String Arg',
        groupingId: 'group-1',
        type: 'large-string',
        required: true,
        default: '',
      }),
    }

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
      [largeStringArg],
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
      args: {
        largeStrArg: 'This is a large string',
      },
    })

    expect(effect.issues).toHaveLength(0)
  })
})

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
    ACTIVE_REGISTRY.register(this)
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
    args: Target['args'],
    environment: Target['environment'],
    migrationVersions: Target['migrationVersions'],
  ) {
    super(_id, name, description, args, environment)

    this._migrationVersions = migrationVersions
  }
}

/**
 * Minimal test `Effect` implementation that relies on `additionalIssues`.
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
      args: Effect['args']
    },
    options: {
      context?: Effect['context']
    } = {},
  ) {
    let context: Effect['context'] = options.context ?? {
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
    }

    super(
      data._id,
      data.name,
      data.targetId,
      data.environmentId,
      data.targetEnvironmentVersion,
      0,
      'Test effect description',
      context,
      data.args,
      'local-key-1',
    )
  }

  protected determineTarget(
    targetId: string,
    environmentId: string,
  ): TestTarget | null {
    if (!ACTIVE_REGISTRY) return null

    if (environmentId === Effect.LEGACY_INFER_ENV_ID) {
      return ACTIVE_REGISTRY.inferTarget(targetId) ?? null
    }

    let environment = ACTIVE_REGISTRY.get(environmentId)
    if (!environment) return null

    return environment.getTarget(targetId) ?? null
  }
}

/**
 * Minimal test `MissionPrototype` implementation.
 */
class TestMissionPrototype extends MissionPrototype {
  // Intentionally empty.
}

/**
 * Minimal test `Mission` implementation.
 */
class TestMission extends Mission {
  protected forcesByLocalKey: Record<string, { localKey: string; name: string }>
  protected nodesByLocalKey: Record<string, { localKey: string; name: string }>
  protected filesById: Record<string, any>

  public constructor(
    options: {
      forcesByLocalKey?: Record<string, { localKey: string; name: string }>
      nodesByLocalKey?: Record<string, { localKey: string; name: string }>
      filesById?: Record<string, any>
    } = {},
  ) {
    super(
      'mission-1',
      'Mission 1',
      1,
      'seed-1',
      'Resources',
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
    )

    this.forcesByLocalKey = options.forcesByLocalKey ?? {}
    this.nodesByLocalKey = options.nodesByLocalKey ?? {}
    this.filesById = options.filesById ?? {}
  }

  protected initializeRoot(): TestMissionPrototype {
    return new TestMissionPrototype(this, { _id: 'ROOT' })
  }

  protected importPrototype(data?: any, options?: any): any {
    let prototype = new TestMissionPrototype(this, data, options)
    this.prototypes.push(prototype)
    return prototype
  }

  protected importForces(_data: any[]): void {}

  protected importFiles(_data: any[]): void {}

  protected importEffects(_data: any[]): void {}

  public createEffect(_target: any, _trigger: any): any {
    throw new Error('Not implemented in unit tests.')
  }

  public override getForceByLocalKey(forceKey: any): any {
    if (!forceKey) return undefined
    return this.forcesByLocalKey[String(forceKey)]
  }

  public override getNodeByLocalKey(_forceKey: any, _nodeKey: any): any {
    let forceKey = String(_forceKey)
    let nodeKey = String(_nodeKey)
    return this.nodesByLocalKey[`${forceKey}:${nodeKey}`]
  }

  public override getActionByLocalKey(
    _forceKey: any,
    _nodeKey: any,
    _actionKey: any,
  ): any {
    return undefined
  }

  public override getFileById(_fileId: any): any {
    if (!_fileId) return undefined
    return this.filesById[String(_fileId)]
  }
}
