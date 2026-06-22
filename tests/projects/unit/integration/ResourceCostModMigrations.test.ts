import { migrations } from '@integration/metis/targets/action/resource-cost-mod/migrations'
import { describe, expect, test } from '@jest/globals'
import type { TMigratableEffect } from '@server/target-environments/TargetMigration'
import type { TTargetArgumentJson } from '@shared/target-environments/arguments/TargetArgument'

type TResource = { _id: string; name: string; order: number }

function buildEffect(
  argumentList: TTargetArgumentJson[],
  options: { resources?: TResource[] } = {},
): TMigratableEffect {
  return {
    arguments: argumentList,
    versionCursor: '2.3.0',
    mission: {
      resources: options.resources ?? [],
    },
  } as unknown as TMigratableEffect
}

// The 2.5.0 migration renames actionMetadata -> applyTo and resourceCost ->
// amount, so both must already be present for the migration chain to succeed.
function baseArguments(): TTargetArgumentJson[] {
  return [
    {
      _id: 'argument-action',
      parameterId: 'actionMetadata',
      type: 'mission-component',
      value: [
        {
          componentType: 'action',
          lastKnownName: 'Action 1',
          ids: ['force-1', 'node-1', 'action-1'],
        },
      ],
    },
    {
      _id: 'argument-cost',
      parameterId: 'resourceCost',
      type: 'number',
      value: 10,
    },
  ]
}

describe('resource-cost-mod migration', () => {
  test('adds a resources selection from the single mission resource', () => {
    let effect = buildEffect(baseArguments(), {
      resources: [{ _id: 'resource-1', name: 'Gold', order: 1 }],
    })

    migrations.migrate(effect)

    // 2.4.0 pushes resourceMetadata; 2.5.0 renames it to resources.
    let argument = effect.arguments.find(
      (candidate) => candidate.parameterId === 'resources',
    )
    expect(argument).toMatchObject({
      type: 'mission-component',
      value: [
        { componentType: 'resource', lastKnownName: 'Gold', ids: ['resource-1'] },
      ],
    })
  })

  test('selects the resource with the lowest order when multiple resources exist', () => {
    let effect = buildEffect(baseArguments(), {
      resources: [
        { _id: 'resource-b', name: 'Silver', order: 2 },
        { _id: 'resource-a', name: 'Gold', order: 1 },
      ],
    })

    migrations.migrate(effect)

    let argument = effect.arguments.find(
      (candidate) => candidate.parameterId === 'resources',
    )
    expect(argument).toMatchObject({
      value: [
        { componentType: 'resource', lastKnownName: 'Gold', ids: ['resource-a'] },
      ],
    })
  })
})
