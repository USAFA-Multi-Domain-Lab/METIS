import { migrations } from '@integration/metis/targets/force/resource-pool/migrations'
import { describe, expect, test } from '@jest/globals'
import type { TMigratableEffect } from '@server/target-environments/TargetMigration'

type TPool = { localKey: string; name: string; resource: { order: number } }
type TForce = { localKey: string; resourcePools: TPool[] }
type TSourceForce = { resourcePools: TPool[] } | null

function buildEffect(
  args: Record<string, unknown>,
  opts: {
    sourceForce?: TSourceForce
    forces?: TForce[]
  } = {},
): TMigratableEffect {
  return {
    args,
    versionCursor: '2.3.0',
    sourceForce: opts.sourceForce ?? null,
    mission: {
      forces: opts.forces ?? [],
    },
  } as unknown as TMigratableEffect
}

describe('resource-pool migration 2.4.0', () => {
  test('Sets poolMetadata from sourceForce when forceKey is "self"', () => {
    let effect = buildEffect(
      { forceMetadata: { forceKey: 'self', forceName: 'Red Force' } },
      {
        sourceForce: {
          resourcePools: [
            { localKey: 'pool-1', name: 'Gold', resource: { order: 1 } },
          ],
        },
      },
    )

    migrations.migrate(effect)

    expect(effect.args.poolMetadata).toEqual({
      forceKey: 'self',
      forceName: 'Red Force',
      poolKey: 'pool-1',
      poolName: 'Gold',
    })
    expect(effect.args.forceMetadata).toBeUndefined()
  })

  test('Sets poolMetadata from the matching force in mission.forces when forceKey is not "self"', () => {
    let effect = buildEffect(
      { forceMetadata: { forceKey: 'blue', forceName: 'Blue Force' } },
      {
        sourceForce: {
          resourcePools: [
            { localKey: 'pool-red', name: 'Red Gold', resource: { order: 1 } },
          ],
        },
        forces: [
          {
            localKey: 'blue',
            resourcePools: [
              {
                localKey: 'pool-blue',
                name: 'Blue Gold',
                resource: { order: 1 },
              },
            ],
          },
        ],
      },
    )

    migrations.migrate(effect)

    expect(effect.args.poolMetadata).toMatchObject({
      forceKey: 'blue',
      forceName: 'Blue Force',
      poolKey: 'pool-blue',
      poolName: 'Blue Gold',
    })
    expect(effect.args.forceMetadata).toBeUndefined()
  })

  test('Selects the pool with the lowest resource order when multiple pools exist', () => {
    let effect = buildEffect(
      { forceMetadata: { forceKey: 'self', forceName: 'Red Force' } },
      {
        sourceForce: {
          resourcePools: [
            { localKey: 'pool-b', name: 'Silver', resource: { order: 2 } },
            { localKey: 'pool-a', name: 'Gold', resource: { order: 1 } },
          ],
        },
      },
    )

    migrations.migrate(effect)

    expect(effect.args.poolMetadata).toMatchObject({
      poolKey: 'pool-a',
      poolName: 'Gold',
    })
  })
})
