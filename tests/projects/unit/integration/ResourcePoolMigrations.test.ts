import { migrations } from '@integration/metis/targets/force/resource-pool/migrations'
import { describe, expect, test } from '@jest/globals'
import type { TMigratableEffect } from '@server/target-environments/TargetMigration'
import type { TTargetArgumentJson } from '@shared/target-environments/arguments/TargetArgument'

type TPool = { _id: string; name: string; resource: { order: number } }
type TForce = { _id: string; name: string; resourcePools: TPool[] }

function buildEffect(
  argumentList: TTargetArgumentJson[],
  options: { forces?: TForce[] } = {},
): TMigratableEffect {
  return {
    arguments: argumentList,
    versionCursor: '2.3.0',
    mission: {
      forces: options.forces ?? [],
    },
  } as unknown as TMigratableEffect
}

function forceMetadataArgument(
  forceId: string,
  forceName: string,
): TTargetArgumentJson {
  return {
    _id: 'argument-force',
    parameterId: 'forceMetadata',
    type: 'mission-component',
    value: [{ componentType: 'force', lastKnownName: forceName, ids: [forceId] }],
  }
}

describe('resource-pool migration', () => {
  test('replaces the force selection with the lowest-order pool of the matching force', () => {
    let effect = buildEffect([forceMetadataArgument('force-1', 'Red Force')], {
      forces: [
        {
          _id: 'force-1',
          name: 'Red Force',
          resourcePools: [{ _id: 'pool-1', name: 'Gold', resource: { order: 1 } }],
        },
      ],
    })

    migrations.migrate(effect)

    // 2.4.0 swaps forceMetadata -> poolMetadata; 2.5.0 renames poolMetadata -> applyTo.
    let argument = effect.arguments.find(
      (candidate) => candidate.parameterId === 'applyTo',
    )
    expect(argument).toMatchObject({
      type: 'mission-component',
      value: [
        {
          componentType: 'resourcePool',
          lastKnownName: 'Gold',
          ids: ['force-1', 'pool-1'],
        },
      ],
    })
    expect(
      effect.arguments.find(
        (candidate) => candidate.parameterId === 'forceMetadata',
      ),
    ).toBeUndefined()
  })

  test('selects the pool with the lowest resource order when multiple pools exist', () => {
    let effect = buildEffect([forceMetadataArgument('force-1', 'Red Force')], {
      forces: [
        {
          _id: 'force-1',
          name: 'Red Force',
          resourcePools: [
            { _id: 'pool-b', name: 'Silver', resource: { order: 2 } },
            { _id: 'pool-a', name: 'Gold', resource: { order: 1 } },
          ],
        },
      ],
    })

    migrations.migrate(effect)

    let argument = effect.arguments.find(
      (candidate) => candidate.parameterId === 'applyTo',
    )
    expect(argument).toMatchObject({
      value: [
        {
          componentType: 'resourcePool',
          lastKnownName: 'Gold',
          ids: ['force-1', 'pool-a'],
        },
      ],
    })
  })
})
