import { MapNode } from '@client/components/content/session/mission-map/objects/nodes'
import { describe, expect, jest, test } from '@jest/globals'
import { NodeAlert } from '@shared/missions/nodes/NodeAlert'
import { act, render } from '@testing-library/react'

jest.mock('@client/components/content/session/mission-map/MissionMap', () => ({
  useMapContext: () => ({
    centerOnMap: () => {},
    state: {
      nodeContentVisible: [true, () => {}],
    },
  }),
}))

jest.mock('@client/toolbox/icons', () => ({
  getIconPath: () => '',
}))

jest.mock('@client/components/content/communication/Tooltip', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock(
  '@client/components/content/user-controls/buttons/panels/ButtonSvgPanel',
  () => ({
    __esModule: true,
    default: () => null,
  }),
)

jest.mock(
  '@client/components/content/user-controls/buttons/panels/hooks',
  () => ({
    useButtonSvgEngine: () => ({}),
  }),
)

jest.mock('@client/missions/nodes/ClientMissionNode', () => ({
  ClientMissionNode: class {
    public static readonly LINE_HEIGHT = 1.2
    public static readonly FONT_SIZE = 1
    public static readonly WIDTH = 10
    public static readonly DEFAULT_NAME_NEEDED_HEIGHT = 2
    public static readonly VERTICAL_PADDING = 0.5
    public static readonly BUTTONS_HEIGHT = 1
    public static readonly NAME_WIDTH_RATIO = 0.7
  },
}))

type TNodeListener = () => void

class FakeMapNode {
  public _id = 'node-1'
  public name = 'Node 1'
  public mission = { nonRevealedDisplayMode: 'hide' }
  public color = '#ffffff'
  public position = { x: 1, y: 2 }
  public buttons: [] = []
  public selected = false
  public blockStatus = 'unblocked'
  public exclude = false
  public alerts: NodeAlert[] = []
  public latestExecution = null
  public executionState = { status: 'unexecuted' as const }
  public listeners = new Map<string, Set<TNodeListener>>()

  public get nameLineCount(): number {
    return 1
  }

  public get icon(): TMetisIcon {
    return '_blank'
  }

  public get pending(): boolean {
    return false
  }

  public get revealed(): boolean {
    return true
  }

  public get executing(): boolean {
    return false
  }

  public get hasPendingAlerts(): boolean {
    return this.nextPendingAlert !== null
  }

  public get nextPendingAlert(): NodeAlert | null {
    return this.alerts.find((alert) => !alert.acknowledged) ?? null
  }

  public requestCenterOnMap(): void {}

  public addEventListener(method: string, listener: TNodeListener): void {
    let listeners = this.listeners.get(method) ?? new Set<TNodeListener>()
    listeners.add(listener)
    this.listeners.set(method, listeners)
  }

  public removeEventListener(method: string, listener: TNodeListener): void {
    this.listeners.get(method)?.delete(listener)
  }

  public emit(method: string): void {
    for (let listener of this.listeners.get(method) ?? []) {
      listener()
    }
  }
}

function renderMapNode(node: FakeMapNode) {
  return render(
    <MapNode
      node={node as any}
      cameraZoom={{} as any}
      onSelect={() => {}}
      applyTooltip={() => ''}
    />,
  )
}

describe('MapNode alert surface', () => {
  test('applies the correct severity-level class when nextPendingAlert is set', () => {
    let node = new FakeMapNode()
    node.alerts = [NodeAlert.createNew(node._id, 'Danger alert', 'danger')]

    let { container } = renderMapNode(node)
    let root = container.querySelector('.MapNode') as HTMLElement

    expect(root).toHaveClass('Alert')
    expect(root).toHaveClass('SeverityLevel_danger')
  })

  test('does not apply alert classes when no pending alert exists', () => {
    let node = new FakeMapNode()

    let { container } = renderMapNode(node)
    let root = container.querySelector('.MapNode') as HTMLElement

    expect(root).not.toHaveClass('Alert')
    expect(root).not.toHaveClass('SeverityLevel_info')
    expect(root).not.toHaveClass('SeverityLevel_suspicious')
    expect(root).not.toHaveClass('SeverityLevel_warning')
    expect(root).not.toHaveClass('SeverityLevel_danger')
  })

  test('updates the rendered alert styling when a new alert arrives', () => {
    let node = new FakeMapNode()
    let { container } = renderMapNode(node)
    let root = container.querySelector('.MapNode') as HTMLElement

    expect(root).not.toHaveClass('Alert')

    act(() => {
      node.alerts = [NodeAlert.createNew(node._id, 'Warning alert', 'warning')]
      node.emit('new-alert')
    })

    expect(root).toHaveClass('Alert')
    expect(root).toHaveClass('SeverityLevel_warning')
  })

  test('updates the rendered alert styling when an alert is acknowledged', () => {
    let node = new FakeMapNode()
    let alert = NodeAlert.createNew(node._id, 'Warning alert', 'warning')
    node.alerts = [alert]

    let { container } = renderMapNode(node)
    let root = container.querySelector('.MapNode') as HTMLElement

    expect(root).toHaveClass('Alert')

    act(() => {
      alert.acknowledged = true
      node.emit('alert-updated')
    })

    expect(root).not.toHaveClass('Alert')
    expect(root).not.toHaveClass('SeverityLevel_warning')
  })
})
