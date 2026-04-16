import { describe, expect, test } from '@jest/globals'
import {
  NodeAlert,
  type TNodeAlertJson,
} from '@shared/missions/nodes/NodeAlert'
import { ClassList } from '@shared/toolbox/html/ClassList'

function buildAlertJson(
  overrides: Partial<TNodeAlertJson & { _id: string }> = {},
): TNodeAlertJson {
  return {
    _id: 'alert-1',
    nodeId: 'node-1',
    message: 'Suspicious behavior detected.',
    severityLevel: 'warning',
    acknowledged: false,
    ...overrides,
  }
}

describe('NodeAlert', () => {
  test('createNew returns a NodeAlert with the provided values and acknowledged set to false', () => {
    let alert = NodeAlert.createNew('node-123', 'Test message', 'danger')

    expect(typeof alert._id).toBe('string')
    expect(alert._id.length).toBeGreaterThan(0)
    expect(alert.nodeId).toBe('node-123')
    expect(alert.message).toBe('Test message')
    expect(alert.severityLevel).toBe('danger')
    expect(alert.acknowledged).toBe(false)
  })

  test('fromJson returns a NodeAlert with matching properties for a single object', () => {
    let json = buildAlertJson({
      _id: 'alert-2',
      nodeId: 'node-2',
      message: 'Info message',
      severityLevel: 'info',
      acknowledged: true,
    })

    let alert = NodeAlert.fromJson(json)

    expect(alert).toBeInstanceOf(NodeAlert)
    expect(alert._id).toBe(json._id)
    expect(alert.nodeId).toBe(json.nodeId)
    expect(alert.message).toBe(json.message)
    expect(alert.severityLevel).toBe(json.severityLevel)
    expect(alert.acknowledged).toBe(json.acknowledged)
  })

  test('fromJson returns a JsonSerializableArray of NodeAlert objects for an array input', () => {
    let json = [
      buildAlertJson({ _id: 'alert-1', severityLevel: 'info' }),
      buildAlertJson({ _id: 'alert-2', severityLevel: 'danger' }),
    ]

    let alerts = NodeAlert.fromJson(json)

    expect(alerts).toHaveLength(2)
    expect(alerts[0]).toBeInstanceOf(NodeAlert)
    expect(alerts[1]).toBeInstanceOf(NodeAlert)
    expect(alerts[0]._id).toBe('alert-1')
    expect(alerts[1]._id).toBe('alert-2')
    expect(alerts[0].severityLevel).toBe('info')
    expect(alerts[1].severityLevel).toBe('danger')
  })

  test('SEVERITY_LEVELS is ordered from least to most severe', () => {
    expect(NodeAlert.SEVERITY_LEVELS).toEqual([
      'info',
      'suspicious',
      'warning',
      'danger',
    ])
  })

  test('severityLevelNumber returns the correct index for each severity level', () => {
    for (let [index, severityLevel] of NodeAlert.SEVERITY_LEVELS.entries()) {
      let alert = NodeAlert.fromJson(
        buildAlertJson({
          _id: `alert-${severityLevel}`,
          severityLevel,
        }),
      )

      expect(alert.severityLevelNumber).toBe(index)
    }
  })

  test('toJson returns all serialized alert fields', () => {
    let alert = NodeAlert.fromJson(
      buildAlertJson({
        _id: 'alert-json',
        nodeId: 'node-json',
        message: 'Serialized message',
        severityLevel: 'suspicious',
        acknowledged: true,
      }),
    )

    expect(alert.json).toEqual({
      _id: 'alert-json',
      nodeId: 'node-json',
      message: 'Serialized message',
      severityLevel: 'suspicious',
      acknowledged: true,
    })
  })

  test('addSeverityLevelClasses adds the expected class for each severity level', () => {
    let expectedClasses = {
      info: 'SeverityLevel_info',
      suspicious: 'SeverityLevel_suspicious',
      warning: 'SeverityLevel_warning',
      danger: 'SeverityLevel_danger',
    } as const

    for (let severityLevel of NodeAlert.SEVERITY_LEVELS) {
      let classList = new ClassList('Root')
      let alert = NodeAlert.fromJson(
        buildAlertJson({
          _id: `alert-${severityLevel}`,
          severityLevel,
        }),
      )

      alert.addSeverityLevelClasses(classList)

      expect(classList.value).toContain(expectedClasses[severityLevel])
    }
  })
})
