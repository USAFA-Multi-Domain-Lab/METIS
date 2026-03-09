import { describe, expect, test } from '@jest/globals'
import {
  MissionNode,
  type TMissionNodeJson,
} from '@shared/missions/nodes/MissionNode'
import type { TNodeAlertJson } from '@shared/missions/nodes/NodeAlert'

function buildAlertJson(
  overrides: Partial<TNodeAlertJson> = {},
): TNodeAlertJson {
  return {
    _id: 'alert-1',
    nodeId: 'node-1',
    message: 'Test alert',
    severityLevel: 'warning',
    acknowledged: false,
    ...overrides,
  }
}

class TestMissionNode extends MissionNode {
  public get exclude(): boolean {
    return this._exclude
  }

  public set exclude(value: boolean) {
    this._exclude = value
  }

  protected importActions(_data: TMissionNodeJson['actions']): void {}

  protected importExecutions(_data: TMissionNodeJson['executions']): void {}

  public modifySuccessChance(_successChanceOperand: number): void {}

  public modifyProcessTime(_processTimeOperand: number): void {}

  public modifyResourceCost(_resourceCostOperand: number): void {}
}

function createNode(alerts: TNodeAlertJson[] = []): TestMissionNode {
  let prototype = { _id: 'prototype-1' }
  let force = {
    _id: 'force-1',
    mission: {
      getPrototype: (prototypeId: string) => {
        if (prototypeId === prototype._id) {
          return prototype
        }
        return undefined
      },
    },
    generateNodeKey: () => '1',
    revealAllNodes: false,
    getNodeFromPrototype: () => undefined,
  } as any

  return new TestMissionNode(force, {
    _id: 'node-1',
    prototypeId: prototype._id,
    localKey: '1',
    alerts,
  })
}

describe('MissionNode alert surface', () => {
  test('pendingAlerts returns only alerts that are not acknowledged', () => {
    let node = createNode([
      buildAlertJson({ _id: 'alert-1', acknowledged: false }),
      buildAlertJson({ _id: 'alert-2', acknowledged: true }),
      buildAlertJson({ _id: 'alert-3', acknowledged: false }),
    ])

    expect(node.pendingAlerts.map((alert) => alert._id)).toEqual([
      'alert-1',
      'alert-3',
    ])
  })

  test('hasPendingAlerts returns true when at least one alert is unacknowledged', () => {
    let node = createNode([
      buildAlertJson({ _id: 'alert-1', acknowledged: true }),
      buildAlertJson({ _id: 'alert-2', acknowledged: false }),
    ])

    expect(node.hasPendingAlerts).toBe(true)
  })

  test('hasPendingAlerts returns false when all alerts are acknowledged', () => {
    let node = createNode([
      buildAlertJson({ _id: 'alert-1', acknowledged: true }),
      buildAlertJson({ _id: 'alert-2', acknowledged: true }),
    ])

    expect(node.hasPendingAlerts).toBe(false)
  })

  test('getAlert returns the correct alert when the ID exists', () => {
    let node = createNode([
      buildAlertJson({ _id: 'alert-1' }),
      buildAlertJson({ _id: 'alert-2' }),
    ])

    let alert = node.getAlert('alert-2')

    expect(alert?._id).toBe('alert-2')
    expect(alert?.nodeId).toBe('node-1')
  })

  test('getAlert returns undefined when the ID does not exist', () => {
    let node = createNode([buildAlertJson({ _id: 'alert-1' })])

    expect(node.getAlert('missing-alert')).toBeUndefined()
  })
})
