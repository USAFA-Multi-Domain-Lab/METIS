import { expect } from '@jest/globals'

/**
 * Creates a pre-build-55 mission fixture.
 * @param missionId The mission ID.
 * @param resourceLabel The legacy resource label.
 * @param forceSpecs The legacy force, node, and action data.
 * @returns A mission in the shape expected before build 55 runs.
 */
export function createPreMigrationMission(
  missionId: string,
  resourceLabel: string,
  forceSpecs: TOriginalForceSpec[],
): TOriginalMission {
  return {
    _id: missionId,
    resourceLabel,
    forces: forceSpecs.map((forceSpec, forceIndex) => ({
      _id: `${missionId}-force-${forceIndex + 1}`,
      initialResources: forceSpec.initialResources,
      allowNegativeResources: forceSpec.allowNegativeResources,
      nodes: forceSpec.nodes.map((actionSpecs, nodeIndex) => ({
        _id: `${missionId}-force-${forceIndex + 1}-node-${nodeIndex + 1}`,
        actions: actionSpecs.map((actionSpec, actionIndex) => ({
          _id:
            `${missionId}-force-${forceIndex + 1}-node-${nodeIndex + 1}` +
            `-action-${actionIndex + 1}`,
          resourceCost: actionSpec.resourceCost,
          resourceCostHidden: actionSpec.resourceCostHidden,
        })),
      })),
    })),
  }
}

/**
 * Asserts that a migrated mission matches the build 55 shape.
 * @param result The migrated mission data.
 * @param original The original pre-build-55 mission snapshot.
 */
export function assertMigratedMission(
  result: object,
  original: TOriginalMission,
): void {
  let migratedMission = result as TMigratedMission & Record<string, unknown>

  expect(migratedMission.resources).toHaveLength(1)
  expect(migratedMission.forces).toHaveLength(original.forces.length)
  expect(migratedMission).not.toHaveProperty('resourceLabel')

  // Build 55 converts the old "resourceLabel" string into a resource object.
  let [resource] = migratedMission.resources
  assertMigratedResource(resource, original)

  for (let migratedForce of migratedMission.forces) {
    let originalForce = findRequiredById(
      original.forces,
      migratedForce._id,
      'force',
    )
    assertMigratedForce(migratedForce, originalForce, resource._id)
  }
}

function assertMigratedResource(
  resource: TMigratedResource,
  originalMission: TOriginalMission,
): void {
  assertNonEmptyString(resource._id)
  expect(resource.icon).toBe('resources/coins')
  expect(resource.order).toBe(0)
  expect(resource.name).toBe(originalMission.resourceLabel)
}

function assertMigratedForce(
  force: TMigratedForce,
  originalForce: TOriginalForce,
  resourceId: string,
): void {
  expect(force.resourcePools).toHaveLength(1)
  expect(force.nodes).toHaveLength(originalForce.nodes.length)
  expect(force).not.toHaveProperty('initialResources')
  expect(force).not.toHaveProperty('allowNegativeResources')

  let [pool] = force.resourcePools
  assertNonEmptyString(pool._id)
  assertNonEmptyString(pool.resourceId)
  expect(pool.localKey).toBe('1')
  expect(typeof pool.initialBalance).toBe('number')
  expect(typeof pool.allowNegative).toBe('boolean')
  expect(pool.initialBalance).toBe(originalForce.initialResources)
  expect(pool.allowNegative).toBe(originalForce.allowNegativeResources)
  expect(pool.excluded).toBe(false)
  expect(pool.resourceId).toBe(resourceId)

  for (let migratedNode of force.nodes) {
    let originalNode = findRequiredById(
      originalForce.nodes,
      migratedNode._id,
      'node',
    )

    expect(migratedNode.actions).toHaveLength(originalNode.actions.length)

    for (let migratedAction of migratedNode.actions) {
      let originalAction = findRequiredById(
        originalNode.actions,
        migratedAction._id,
        'action',
      )
      assertMigratedAction(migratedAction, originalAction, resourceId)
    }
  }
}

function assertMigratedAction(
  action: TMigratedAction,
  originalAction: TOriginalAction,
  resourceId: string,
): void {
  expect(action.resourceCosts).toHaveLength(1)
  expect(action).not.toHaveProperty('resourceCost')
  expect(action).not.toHaveProperty('resourceCostHidden')

  let [resourceCost] = action.resourceCosts
  assertNonEmptyString(resourceCost._id)
  assertNonEmptyString(resourceCost.resourceId)
  expect(typeof resourceCost.baseAmount).toBe('number')
  expect(typeof resourceCost.hidden).toBe('boolean')
  expect(resourceCost.baseAmount).toBe(originalAction.resourceCost)
  expect(resourceCost.hidden).toBe(originalAction.resourceCostHidden)
  expect(resourceCost.resourceId).toBe(resourceId)
}

function assertNonEmptyString(value: string): void {
  expect(typeof value).toBe('string')
  expect(value.length).toBeGreaterThan(0)
}

function findRequiredById<TItem extends { _id: string }>(
  items: TItem[],
  id: string,
  itemLabel: string,
): TItem {
  let item = items.find((currentItem) => currentItem._id === id)

  if (!item) {
    throw new Error(
      `Expected original ${itemLabel} with _id "${id}" to exist in the fixture.`,
    )
  }

  return item
}

interface TOriginalAction {
  _id: string
  resourceCost: number
  resourceCostHidden: boolean
}

interface TOriginalNode {
  _id: string
  actions: TOriginalAction[]
}

interface TOriginalForce {
  _id: string
  initialResources: number
  allowNegativeResources: boolean
  nodes: TOriginalNode[]
}

interface TOriginalMission {
  _id: string
  resourceLabel: string
  forces: TOriginalForce[]
}

interface TOriginalActionSpec {
  resourceCost: number
  resourceCostHidden: boolean
}

interface TOriginalForceSpec {
  initialResources: number
  allowNegativeResources: boolean
  nodes: TOriginalActionSpec[][]
}

interface TMigratedResource {
  _id: string
  name: string
  icon: string
  order: number
}

interface TMigratedResourceCost {
  _id: string
  resourceId: string
  baseAmount: number
  hidden: boolean
}

interface TMigratedAction {
  _id: string
  resourceCosts: TMigratedResourceCost[]
}

interface TMigratedNode {
  _id: string
  actions: TMigratedAction[]
}

interface TMigratedResourcePool {
  _id: string
  localKey: string
  resourceId: string
  initialBalance: number
  allowNegative: boolean
  excluded: boolean
}

interface TMigratedForce {
  _id: string
  resourcePools: TMigratedResourcePool[]
  nodes: TMigratedNode[]
}

interface TMigratedMission {
  resources: TMigratedResource[]
  forces: TMigratedForce[]
}
