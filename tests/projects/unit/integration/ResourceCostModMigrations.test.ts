import { migrations } from '@integration/metis/targets/action/resource-cost-mod/migrations'
import { describe, expect, test } from '@jest/globals'
import type { TMigratableEffect } from '@server/target-environments/TargetMigration'

type TResource = { _id: string; name: string; order: number }

function buildEffect(
  args: Record<string, unknown>,
  options: {
    resources?: TResource[]
  } = {},
): TMigratableEffect {
  return {
    args,
    versionCursor: '2.3.0',
    mission: {
      resources: options.resources ?? [],
    },
  } as unknown as TMigratableEffect
}

describe('resource-cost-mod migration 2.4.0', () => {
  test('Adds resourceMetadata from the single mission resource', () => {
    let effect = buildEffect(
      {
        actionMetadata: {
          forceKey: 'self',
          nodeKey: 'node-1',
          actionKey: 'action-1',
        },
        resourceCost: 10,
      },
      { resources: [{ _id: 'res-1', name: 'Gold', order: 1 }] },
    )

    migrations.migrate(effect)

    expect(effect.args.resourceMetadata).toEqual({
      resourceId: 'res-1',
      resourceName: 'Gold',
    })
  })

  test('Selects the resource with the lowest order when multiple resources exist', () => {
    let effect = buildEffect(
      {
        actionMetadata: {
          forceKey: 'self',
          nodeKey: 'node-1',
          actionKey: 'action-1',
        },
        resourceCost: 10,
      },
      {
        resources: [
          { _id: 'res-b', name: 'Silver', order: 2 },
          { _id: 'res-a', name: 'Gold', order: 1 },
        ],
      },
    )

    migrations.migrate(effect)

    expect(effect.args.resourceMetadata).toEqual({
      resourceId: 'res-a',
      resourceName: 'Gold',
    })
  })
})
