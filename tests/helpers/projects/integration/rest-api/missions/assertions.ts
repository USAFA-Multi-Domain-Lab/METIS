import { expect } from '@jest/globals'
import type { TMissionJson } from '@shared/missions/Mission'
import type { TMissionCreatePayload } from './payload'

/**
 * Asserts that a mission returned by the API matches the expected saved data.
 * @param actual The actual mission returned by the API.
 * @param expected The expected mission shape.
 */
export function assertMissionMatchesExpectedData(
  actual: TMissionJson,
  expected: Partial<TMissionJson> | TMissionCreatePayload,
): void {
  assertMissionCrossReferences(actual)
  expect(normalizeMission(actual)).toEqual(normalizeMission(expected))
}

function assertMissionCrossReferences(mission: Partial<TMissionJson>): void {
  let resourceIds = new Set(
    (mission.resources ?? []).map((resource) => resource._id),
  )
  let prototypeIds = new Set(
    (mission.prototypes ?? []).map((prototype) => prototype._id),
  )

  expect(resourceIds.size).toBeGreaterThan(0)
  expect(prototypeIds.size).toBeGreaterThan(0)

  for (let force of mission.forces ?? []) {
    for (let pool of force.resourcePools ?? []) {
      expect(resourceIds.has(pool.resourceId)).toBe(true)
    }

    for (let node of force.nodes ?? []) {
      expect(prototypeIds.has(node.prototypeId)).toBe(true)

      for (let action of node.actions ?? []) {
        for (let cost of action.resourceCosts ?? []) {
          expect(resourceIds.has(cost.resourceId)).toBe(true)
        }
      }
    }
  }
}

function normalizeMission(
  mission: Partial<TMissionJson> | TMissionCreatePayload,
) {
  let normalized = {
    name: mission.name,
    versionNumber: mission.versionNumber,
    resources: sortByKey(
      mission.resources ?? [],
      (resource) => resource.order,
    ).map(normalizeResource),
    structure: cloneJson(mission.structure ?? {}),
    prototypes: sortByKey(
      mission.prototypes ?? [],
      (prototype) => prototype.structureKey,
    ).map(normalizePrototype),
    files: sortByKey(mission.files ?? [], (file) => file._id).map(
      normalizeFile,
    ),
    effects: sortByKey(mission.effects ?? [], (effect) => effect.localKey).map(
      normalizeEffect,
    ),
    forces: sortByKey(mission.forces ?? [], (force) => force.localKey).map(
      normalizeForce,
    ),
  } as {
    name: string | undefined
    versionNumber: number | undefined
    resources: ReturnType<typeof normalizeResource>[]
    structure: Record<string, unknown>
    prototypes: ReturnType<typeof normalizePrototype>[]
    files: ReturnType<typeof normalizeFile>[]
    effects: ReturnType<typeof normalizeEffect>[]
    forces: ReturnType<typeof normalizeForce>[]
  }

  return normalized
}

function normalizeResource(resource: TMissionJson['resources'][number]) {
  return {
    _id: resource._id,
    name: resource.name,
    icon: resource.icon,
    order: resource.order,
  }
}

function normalizePrototype(prototype: TMissionJson['prototypes'][number]) {
  return {
    _id: prototype._id,
    structureKey: prototype.structureKey,
    depthPadding: prototype.depthPadding,
  }
}

function normalizeFile(file: TMissionJson['files'][number]) {
  return {
    _id: file._id,
    alias: file.alias,
    lastKnownName: file.lastKnownName,
    initialAccess: cloneJson(file.initialAccess),
    reference:
      typeof file.reference === 'string' ? file.reference : file.reference._id,
  }
}

function normalizeEffect(
  effect:
    | TMissionJson['effects'][number]
    | TMissionJson['forces'][number]['nodes'][number]['actions'][number]['effects'][number],
) {
  return {
    _id: effect._id,
    targetId: effect.targetId,
    environmentId: effect.environmentId,
    targetEnvironmentVersion: effect.targetEnvironmentVersion,
    name: effect.name,
    trigger: effect.trigger,
    order: effect.order,
    description: effect.description,
    args: cloneJson(effect.args),
    localKey: effect.localKey,
  }
}

function normalizeForce(force: TMissionJson['forces'][number]) {
  return {
    _id: force._id,
    introMessage: force.introMessage,
    name: force.name,
    color: force.color,
    revealAllNodes: force.revealAllNodes,
    localKey: force.localKey,
    resourcePools: sortByKey(
      force.resourcePools ?? [],
      (pool) => pool.localKey,
    ).map(normalizeResourcePool),
    nodes: sortByKey(force.nodes ?? [], (node) => node.localKey).map(
      normalizeNode,
    ),
  }
}

function normalizeResourcePool(
  pool: TMissionJson['forces'][number]['resourcePools'][number],
) {
  return {
    _id: pool._id,
    localKey: pool.localKey,
    resourceId: pool.resourceId,
    initialBalance: pool.initialBalance,
    allowNegative: pool.allowNegative,
    excluded: pool.excluded,
  }
}

function normalizeNode(node: TMissionJson['forces'][number]['nodes'][number]) {
  return {
    _id: node._id,
    localKey: node.localKey,
    prototypeId: node.prototypeId,
    name: node.name,
    color: node.color,
    description: node.description,
    preExecutionText: node.preExecutionText,
    executable: node.executable,
    device: node.device,
    exclude: node.exclude,
    initiallyBlocked: node.initiallyBlocked,
    actions: sortByKey(node.actions ?? [], (action) => action.localKey).map(
      normalizeAction,
    ),
  }
}

function normalizeAction(
  action: TMissionJson['forces'][number]['nodes'][number]['actions'][number],
) {
  return {
    _id: action._id,
    name: action.name,
    description: action.description,
    type: action.type,
    baseProcessTime: action.baseProcessTime,
    processTimeHidden: action.processTimeHidden,
    baseSuccessChance: action.baseSuccessChance,
    successChanceHidden: action.successChanceHidden,
    opensNode: action.opensNode,
    opensNodeHidden: action.opensNodeHidden,
    localKey: action.localKey,
    effects: sortByKey(action.effects ?? [], (effect) => effect.localKey).map(
      normalizeEffect,
    ),
    resourceCosts: sortByKey(
      action.resourceCosts ?? [],
      (cost) => cost.resourceId,
    ).map(normalizeResourceCost),
  }
}

function normalizeResourceCost(
  cost: TMissionJson['forces'][number]['nodes'][number]['actions'][number]['resourceCosts'][number],
) {
  return {
    _id: cost._id,
    resourceId: cost.resourceId,
    baseAmount: cost.baseAmount,
    hidden: cost.hidden,
  }
}

function cloneJson<T>(value: T): T {
  return structuredClone(value)
}

function sortByKey<T>(items: T[], getKey: (item: T) => string | number): T[] {
  return [...items].sort((left, right) =>
    String(getKey(left)).localeCompare(String(getKey(right)), undefined, {
      numeric: true,
    }),
  )
}
