import { expect } from '@jest/globals'

// Shared fixture and assertions for the build 58 effect-argument migration.
//
// Build 58 renames each effect's `args` record to an `arguments` array of
// { _id, parameterId, type, value } entries. The database build
// (server/database/builds/build_000058.js) and the import build
// (server/missions/imports/builds/build_000058.ts) are independently
// maintained copies of the same transform in two languages, so this helper
// owns one fixture and one set of assertions that both suites run, and the two
// copies cannot drift in what they verify. The database build reports
// unresolved references through mongosh `print` and the import build through
// `databaseLogger.warn`, so the report assertion takes the already-captured
// text and each suite supplies its own channel.

// The migration lists this many unresolved references individually before it
// truncates the rest; it must match UNRESOLVED_DETAIL_LIMIT in both builds.
const DETAIL_LIMIT = 50

// A block of identical dead-force references, large enough that the total
// unresolved count exceeds the detail cap and the truncation notice fires.
const MANY_DEAD_COUNT = 60

// The primary fixture's total unresolved references: two self references on a
// root effect, four failed localKey lookups, and the block of dead forces.
const EXPECTED_UNRESOLVED_COUNT = 2 + 4 + MANY_DEAD_COUNT

// References past the detail cap, summarized instead of itemized.
const EXPECTED_TRUNCATED_COUNT = EXPECTED_UNRESOLVED_COUNT - DETAIL_LIMIT

/* -- Legacy metadata values (the six mission-component shapes) -- */

// Concrete references that resolve against the fixture mission.
const FORCE_METADATA = { forceKey: 'f1', forceName: 'Alpha Force' }
const NODE_METADATA = {
  forceKey: 'f1',
  forceName: 'Alpha Force',
  nodeKey: 'n1',
  nodeName: 'Node One',
}
const ACTION_METADATA = {
  forceKey: 'f1',
  forceName: 'Alpha Force',
  nodeKey: 'n1',
  nodeName: 'Node One',
  actionKey: 'a1',
  actionName: 'Action One',
}
// A pool whose resource exists; its lastKnownName must come from the resource,
// not from this poolName.
const POOL_RESOLVED_METADATA = {
  forceKey: 'f1',
  forceName: 'Alpha Force',
  poolKey: 'p1',
  poolName: 'Ignored Pool Label',
}
// A pool whose resourceId matches no resource; lastKnownName falls back.
const POOL_UNKNOWN_RESOURCE_METADATA = {
  forceKey: 'f1',
  forceName: 'Alpha Force',
  poolKey: 'p2',
  poolName: 'Ignored Pool Label',
}
const RESOURCE_METADATA = {
  resourceId: 'resource-credits',
  resourceName: 'Credits',
}
const FILE_METADATA = { fileId: 'file-1', fileName: 'secret.txt' }

// Self references resolve to the owning component on an action effect and to
// nothing on a root effect.
const SELF_FORCE_METADATA = {
  forceKey: 'self',
  forceName: 'Ignored Force Name',
}
const SELF_NODE_METADATA = {
  forceKey: 'self',
  forceName: 'Ignored',
  nodeKey: 'self',
  nodeName: 'Ignored Node Name',
}
const SELF_ACTION_METADATA = {
  forceKey: 'self',
  forceName: 'Ignored',
  nodeKey: 'self',
  nodeName: 'Ignored',
  actionKey: 'self',
  actionName: 'Ignored Action Name',
}

// Failed lookups: each names a component that does not exist. The child-key
// cases carry live ancestor keys so a copy that fell through to an ancestor
// would emit a broader selection instead of an empty one.
const GHOST_FORCE_METADATA = {
  forceKey: 'ghost-force',
  forceName: 'Ghost Force',
}
const DEAD_NODE_METADATA = {
  forceKey: 'f1',
  forceName: 'Alpha Force',
  nodeKey: 'ghost-node',
  nodeName: 'Ghost Node',
}
const DEAD_ACTION_METADATA = {
  forceKey: 'f1',
  forceName: 'Alpha Force',
  nodeKey: 'n1',
  nodeName: 'Node One',
  actionKey: 'ghost-action',
  actionName: 'Ghost Action',
}
const DEAD_POOL_METADATA = {
  forceKey: 'f1',
  forceName: 'Alpha Force',
  poolKey: 'ghost-pool',
  poolName: 'Ghost Pool',
}

/* -- Non-metadata values (everything the migration types as `unknown`) -- */

const NUMBER_VALUE = 3
const STRING_VALUE = 'award'
const BOOLEAN_VALUE = true
const ARRAY_VALUE = [1, 2, 3]
const EMPTY_OBJECT_VALUE = {}
// Matches a metadata key set, but a non-string value disqualifies it.
const NON_STRING_VALUE_OBJECT = { forceKey: 'f1', forceName: 5 }
// A plain object whose keys belong to no metadata key set.
const UNRECOGNIZED_KEYS_OBJECT = { foo: 'bar' }

// The unresolved references that fall within the detail cap and can therefore
// be matched line-for-line in the report. Order follows the migration's
// traversal: root effects first, then action effects.
const KNOWN_UNRESOLVED_REFERENCES = [
  {
    effectId: 'root-self',
    parameterId: 'selfForceArg',
    metadata: SELF_FORCE_METADATA,
    outcome: 'expected force, nothing resolved',
  },
  {
    effectId: 'root-self',
    parameterId: 'selfActionArg',
    metadata: SELF_ACTION_METADATA,
    outcome: 'expected action, nothing resolved',
  },
  {
    effectId: 'action-dead-lookups',
    parameterId: 'deadForceArg',
    metadata: GHOST_FORCE_METADATA,
    outcome: 'expected force, nothing resolved',
  },
  {
    effectId: 'action-dead-lookups',
    parameterId: 'deadNodeArg',
    metadata: DEAD_NODE_METADATA,
    outcome: 'expected node, resolved force only',
  },
  {
    effectId: 'action-dead-lookups',
    parameterId: 'deadActionArg',
    metadata: DEAD_ACTION_METADATA,
    outcome: 'expected action, resolved node only',
  },
  {
    effectId: 'action-dead-lookups',
    parameterId: 'deadPoolArg',
    metadata: DEAD_POOL_METADATA,
    outcome: 'expected resourcePool, resolved force only',
  },
]

/**
 * Builds the primary pre-migration mission. A fresh copy is returned on each
 * call so a build can mutate it in place. Every argument case the migration
 * handles appears here: the six metadata shapes (resolved and failed), self
 * references on both a root and an action effect, non-metadata values, and a
 * block of dead forces large enough to trigger report truncation.
 */
export function createPreMigrationMission(): TPreMigrationMission {
  return {
    _id: 'mission-1',
    resources: [{ _id: 'resource-credits', name: 'Credits' }],
    effects: [
      {
        _id: 'root-mixed',
        args: {
          forceArg: FORCE_METADATA,
          numberArg: NUMBER_VALUE,
          stringArg: STRING_VALUE,
          booleanArg: BOOLEAN_VALUE,
          arrayArg: ARRAY_VALUE,
          emptyObjectArg: EMPTY_OBJECT_VALUE,
          nonStringValueObjectArg: NON_STRING_VALUE_OBJECT,
          unrecognizedKeysObjectArg: UNRECOGNIZED_KEYS_OBJECT,
        },
      },
      {
        _id: 'root-self',
        args: {
          selfForceArg: SELF_FORCE_METADATA,
          selfActionArg: SELF_ACTION_METADATA,
        },
      },
    ],
    forces: [
      {
        _id: 'force-alpha',
        localKey: 'f1',
        name: 'Alpha Force',
        resourcePools: [
          {
            _id: 'pool-alpha-1',
            localKey: 'p1',
            resourceId: 'resource-credits',
          },
          {
            _id: 'pool-alpha-2',
            localKey: 'p2',
            resourceId: 'resource-missing',
          },
        ],
        nodes: [
          {
            _id: 'node-alpha-1',
            localKey: 'n1',
            name: 'Node One',
            actions: [
              {
                _id: 'action-alpha-1',
                localKey: 'a1',
                name: 'Action One',
                effects: [
                  {
                    _id: 'action-self',
                    args: {
                      selfForceArg: SELF_FORCE_METADATA,
                      selfNodeArg: SELF_NODE_METADATA,
                      selfActionArg: SELF_ACTION_METADATA,
                    },
                  },
                  {
                    _id: 'action-concrete',
                    args: {
                      forceArg: FORCE_METADATA,
                      nodeArg: NODE_METADATA,
                      actionArg: ACTION_METADATA,
                      poolResolvedArg: POOL_RESOLVED_METADATA,
                      poolUnknownResourceArg: POOL_UNKNOWN_RESOURCE_METADATA,
                      resourceArg: RESOURCE_METADATA,
                      fileArg: FILE_METADATA,
                    },
                  },
                  {
                    _id: 'action-dead-lookups',
                    args: {
                      deadForceArg: GHOST_FORCE_METADATA,
                      deadNodeArg: DEAD_NODE_METADATA,
                      deadActionArg: DEAD_ACTION_METADATA,
                      deadPoolArg: DEAD_POOL_METADATA,
                    },
                  },
                  {
                    _id: 'action-many-dead',
                    args: createManyDeadArgs(),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  }
}

/**
 * Builds a small pre-migration mission whose every reference resolves, so the
 * migration produces no unresolved-reference report.
 */
export function createFullyResolvedMission(): TPreMigrationMission {
  return {
    _id: 'mission-resolved',
    resources: [{ _id: 'resource-credits', name: 'Credits' }],
    effects: [
      {
        _id: 'resolved-root',
        args: { forceArg: FORCE_METADATA, plainArg: STRING_VALUE },
      },
    ],
    forces: [
      {
        _id: 'force-alpha',
        localKey: 'f1',
        name: 'Alpha Force',
        resourcePools: [
          {
            _id: 'pool-alpha-1',
            localKey: 'p1',
            resourceId: 'resource-credits',
          },
        ],
        nodes: [
          {
            _id: 'node-alpha-1',
            localKey: 'n1',
            name: 'Node One',
            actions: [
              {
                _id: 'action-alpha-1',
                localKey: 'a1',
                name: 'Action One',
                effects: [
                  {
                    _id: 'resolved-action',
                    args: {
                      selfActionArg: SELF_ACTION_METADATA,
                      poolArg: POOL_RESOLVED_METADATA,
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  }
}

/**
 * Asserts the migrated mission matches the build 58 shape: every effect's
 * `args` record is replaced by a well-formed `arguments` array, each value is
 * typed and resolved correctly, failed lookups are emptied rather than
 * retargeted, and generated ids are unique.
 * @param mission The migrated mission (root effects and forces).
 */
export function assertMigratedArguments(mission: TMigratedMissionView): void {
  let allEffects = collectEffects(mission)

  // Every effect is converted: args removed, arguments present and well-formed.
  for (let effect of allEffects) {
    expect(effect).not.toHaveProperty('args')
    expect(Array.isArray(effect.arguments)).toBe(true)

    for (let argument of effect.arguments ?? []) {
      assertNonEmptyString(argument._id)
      assertNonEmptyString(argument.parameterId)
      assertNonEmptyString(argument.type)
      expect(argument).toHaveProperty('value')
    }
  }

  // Non-metadata values type as unknown and carry over unchanged.
  assertUnknownArgument(mission, 'root-mixed', 'numberArg', NUMBER_VALUE)
  assertUnknownArgument(mission, 'root-mixed', 'stringArg', STRING_VALUE)
  assertUnknownArgument(mission, 'root-mixed', 'booleanArg', BOOLEAN_VALUE)
  assertUnknownArgument(mission, 'root-mixed', 'arrayArg', ARRAY_VALUE)
  assertUnknownArgument(
    mission,
    'root-mixed',
    'emptyObjectArg',
    EMPTY_OBJECT_VALUE,
  )
  assertUnknownArgument(
    mission,
    'root-mixed',
    'nonStringValueObjectArg',
    NON_STRING_VALUE_OBJECT,
  )
  assertUnknownArgument(
    mission,
    'root-mixed',
    'unrecognizedKeysObjectArg',
    UNRECOGNIZED_KEYS_OBJECT,
  )

  // Each of the six metadata shapes converts to the correct selection.
  assertComponentArgument(mission, 'root-mixed', 'forceArg', {
    componentType: 'force',
    lastKnownName: 'Alpha Force',
    ids: ['force-alpha'],
  })
  assertComponentArgument(mission, 'action-concrete', 'nodeArg', {
    componentType: 'node',
    lastKnownName: 'Node One',
    ids: ['force-alpha', 'node-alpha-1'],
  })
  assertComponentArgument(mission, 'action-concrete', 'actionArg', {
    componentType: 'action',
    lastKnownName: 'Action One',
    ids: ['force-alpha', 'node-alpha-1', 'action-alpha-1'],
  })
  // The pool's lastKnownName comes from its resource, not from its poolName.
  assertComponentArgument(mission, 'action-concrete', 'poolResolvedArg', {
    componentType: 'resourcePool',
    lastKnownName: 'Credits',
    ids: ['force-alpha', 'pool-alpha-1'],
  })
  // ...falling back to Unknown Resource when no resource matches.
  assertComponentArgument(
    mission,
    'action-concrete',
    'poolUnknownResourceArg',
    {
      componentType: 'resourcePool',
      lastKnownName: 'Unknown Resource',
      ids: ['force-alpha', 'pool-alpha-2'],
    },
  )
  assertComponentArgument(mission, 'action-concrete', 'resourceArg', {
    componentType: 'resource',
    lastKnownName: 'Credits',
    ids: ['resource-credits'],
  })
  assertComponentArgument(mission, 'action-concrete', 'fileArg', {
    componentType: 'missionFile',
    lastKnownName: 'secret.txt',
    ids: ['file-1'],
  })

  // Self references on an action effect resolve to the owning components.
  assertComponentArgument(mission, 'action-self', 'selfForceArg', {
    componentType: 'force',
    lastKnownName: 'Alpha Force',
    ids: ['force-alpha'],
  })
  assertComponentArgument(mission, 'action-self', 'selfNodeArg', {
    componentType: 'node',
    lastKnownName: 'Node One',
    ids: ['force-alpha', 'node-alpha-1'],
  })
  assertComponentArgument(mission, 'action-self', 'selfActionArg', {
    componentType: 'action',
    lastKnownName: 'Action One',
    ids: ['force-alpha', 'node-alpha-1', 'action-alpha-1'],
  })

  // The same self metadata on a root effect has no source context, so it
  // resolves to an empty value rather than throwing.
  assertEmptyComponentArgument(mission, 'root-self', 'selfForceArg')
  assertEmptyComponentArgument(mission, 'root-self', 'selfActionArg')

  // Failed localKey lookups empty the value and never fall through to an
  // ancestor the metadata also named.
  assertEmptyComponentArgument(mission, 'action-dead-lookups', 'deadForceArg')
  assertEmptyComponentArgument(mission, 'action-dead-lookups', 'deadNodeArg')
  assertEmptyComponentArgument(mission, 'action-dead-lookups', 'deadActionArg')
  assertEmptyComponentArgument(mission, 'action-dead-lookups', 'deadPoolArg')

  // Generated argument ids are unique across every effect in the mission.
  let argumentIds = allEffects.flatMap((effect) =>
    (effect.arguments ?? []).map((argument) => argument._id),
  )
  expect(argumentIds.length).toBeGreaterThan(0)
  expect(new Set(argumentIds).size).toBe(argumentIds.length)
}

/**
 * Asserts the unresolved-reference report from the primary fixture: the
 * summary counts every reference, each known reference is itemized with its
 * effect id, parameter id, original metadata, and how far the lookup got, and
 * the detail list stops at the cap with a truncation notice for the rest.
 * @param reportText The report emitted by the build, as a single string.
 */
export function assertUnresolvedReport(reportText: string): void {
  // The summary count reflects every unresolved reference, capped or not.
  let summaryMatch = reportText.match(/(\d+) mission component reference\(s\)/)
  expect(summaryMatch).not.toBeNull()
  expect(Number(summaryMatch?.[1])).toBe(EXPECTED_UNRESOLVED_COUNT)

  // Each known reference is itemized with its metadata and outcome.
  for (let reference of KNOWN_UNRESOLVED_REFERENCES) {
    let detail =
      `effect ${reference.effectId} / parameter "${reference.parameterId}"` +
      ` - ${JSON.stringify(reference.metadata)} - ${reference.outcome}`
    expect(reportText).toContain(detail)
  }

  // The itemized detail stops at the cap; the remainder is summarized.
  let detailLineCount = (reportText.match(/ \/ parameter "/g) ?? []).length
  expect(detailLineCount).toBe(DETAIL_LIMIT)
  expect(reportText).toContain(
    `...and ${EXPECTED_TRUNCATED_COUNT} more (truncated).`,
  )
}

/**
 * Asserts that no unresolved-reference report was emitted.
 * @param reportText The text captured from the build's report channel.
 */
export function assertNoUnresolvedReport(reportText: string): void {
  expect(reportText).not.toContain('mission component reference(s)')
}

function assertComponentArgument(
  mission: TMigratedMissionView,
  effectId: string,
  parameterId: string,
  selection: TSerializedSelection,
): void {
  let argument = getArgument(mission, effectId, parameterId)
  expect(argument.type).toBe('mission-component')
  expect(argument.value).toEqual([selection])
}

function assertEmptyComponentArgument(
  mission: TMigratedMissionView,
  effectId: string,
  parameterId: string,
): void {
  let argument = getArgument(mission, effectId, parameterId)
  expect(argument.type).toBe('mission-component')
  expect(argument.value).toEqual([])
}

function assertUnknownArgument(
  mission: TMigratedMissionView,
  effectId: string,
  parameterId: string,
  value: unknown,
): void {
  let argument = getArgument(mission, effectId, parameterId)
  expect(argument.type).toBe('unknown')
  expect(argument.value).toEqual(value)
}

function getArgument(
  mission: TMigratedMissionView,
  effectId: string,
  parameterId: string,
): TMigratedArgument {
  let effect = collectEffects(mission).find(
    (candidate) => candidate._id === effectId,
  )

  if (!effect) {
    throw new Error(`Expected migrated effect "${effectId}" to exist.`)
  }

  let argument = (effect.arguments ?? []).find(
    (candidate) => candidate.parameterId === parameterId,
  )

  if (!argument) {
    throw new Error(
      `Expected effect "${effectId}" to have argument "${parameterId}".`,
    )
  }

  return argument
}

function collectEffects(mission: TMigratedMissionView): TEffect[] {
  let effects = [...mission.effects]

  for (let force of mission.forces) {
    for (let node of force.nodes) {
      for (let action of node.actions) {
        effects.push(...action.effects)
      }
    }
  }

  return effects
}

function createManyDeadArgs(): Record<string, unknown> {
  let args: Record<string, unknown> = {}

  for (let index = 1; index <= MANY_DEAD_COUNT; index++) {
    args[`dead${index}`] = GHOST_FORCE_METADATA
  }

  return args
}

function assertNonEmptyString(value: string): void {
  expect(typeof value).toBe('string')
  expect(value.length).toBeGreaterThan(0)
}

/* -- TYPES -- */

export interface TMigratedArgument {
  _id: string
  parameterId: string
  type: string
  value: unknown
}

interface TSerializedSelection {
  componentType: string
  lastKnownName: string
  ids: string[]
}

interface TEffect {
  _id: string
  args?: Record<string, unknown>
  arguments?: TMigratedArgument[]
}

interface TAction {
  _id: string
  localKey: string
  name: string
  effects: TEffect[]
}

interface TNode {
  _id: string
  localKey: string
  name: string
  actions: TAction[]
}

interface TResourcePool {
  _id: string
  localKey: string
  resourceId: string
}

interface TForce {
  _id: string
  localKey: string
  name: string
  resourcePools: TResourcePool[]
  nodes: TNode[]
}

interface TResource {
  _id: string
  name: string
}

export interface TPreMigrationMission {
  _id: string
  resources: TResource[]
  forces: TForce[]
  effects: TEffect[]
}

export type TMigratedMissionView = Pick<
  TPreMigrationMission,
  'effects' | 'forces'
>
