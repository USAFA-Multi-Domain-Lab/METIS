import { expect } from '@jest/globals'

/**
 * Creates a pre-build-60 mission fixture, whose resources have no
 * description yet. Shared by the database and import build tests so
 * both migrate the same data.
 * @param missionId The mission ID, also used to prefix nested IDs.
 * @param overrides Values to set on the mission, such as `deleted`.
 * @returns A mission in the shape expected before build 60 runs.
 */
export function createPreMigrationMission(
  missionId: string = 'mission-1',
  overrides: Partial<TPreMigrationMission> = {},
): TPreMigrationMission {
  return {
    _id: missionId,
    resources: [
      {
        _id: `${missionId}-resource-1`,
        name: 'Fuel',
        icon: 'resources/drops',
        order: 1,
      },
      {
        _id: `${missionId}-resource-2`,
        name: 'Budget',
        icon: 'resources/dollar',
        order: 2,
      },
    ],
    forces: [
      {
        _id: `${missionId}-force-1`,
        resourcePools: [
          {
            _id: `${missionId}-pool-1`,
            resourceId: `${missionId}-resource-1`,
            initialBalance: 50,
          },
        ],
        nodes: [],
      },
    ],
    effects: [],
    ...overrides,
  }
}

/**
 * Asserts that build 60 gave every resource an empty description
 * and left the rest of each resource as it was.
 * @param resources The resources after the build ran.
 * @param original The pre-build-60 mission the resources came from.
 */
export function assertMigratedResources(
  resources: object[],
  original: TPreMigrationMission,
): void {
  let expectedResources = original.resources.map((resource) => ({
    ...resource,
    description: '',
  }))

  expect(resources).toEqual(expectedResources)
}

/* -- TYPES -- */

/**
 * A resource as stored before build 60.
 */
export interface TPreMigrationResource {
  _id: string
  name: string
  icon: string
  order: number
}

/**
 * A resource as stored after build 60.
 */
export interface TMigratedResource extends TPreMigrationResource {
  description: string
}

/**
 * A mission as stored before build 60. Forces and effects are
 * carried only to check that the build leaves them alone.
 */
export interface TPreMigrationMission {
  _id: string
  deleted?: boolean
  resources: TPreMigrationResource[]
  forces: object[]
  effects: object[]
}
