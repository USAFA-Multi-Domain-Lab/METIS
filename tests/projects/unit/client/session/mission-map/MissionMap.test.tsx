import SessionPage from '@client/components/pages/sessions/SessionPage'
import { NodeAlert } from '@shared/missions/nodes/NodeAlert'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'

class FakeEventTarget {
  public listeners = new Map<string, Set<(...args: any[]) => void>>()

  public addEventListener(method: string, listener: (...args: any[]) => void) {
    let listeners = this.listeners.get(method) ?? new Set()
    listeners.add(listener)
    this.listeners.set(method, listeners)
  }

  public removeEventListener(
    method: string,
    listener: (...args: any[]) => void,
  ) {
    this.listeners.get(method)?.delete(listener)
  }

  public emit(method: string, ...args: any[]) {
    for (let listener of this.listeners.get(method) ?? []) {
      listener(...args)
    }
  }
}

class FakeNode extends FakeEventTarget {
  public _id = 'node-1'
  public name = 'Node 1'
  public blockStatus = 'unblocked'
  public openable = false
  public executable = false
  public readyToExecute = false
  public alerts: NodeAlert[] = []
  public centerRequestCount = 0

  public get nextPendingAlert(): NodeAlert | null {
    let pendingAlerts = this.alerts.filter((alert) => !alert.acknowledged)

    return (
      pendingAlerts.sort(
        (alertA, alertB) =>
          alertB.severityLevelNumber - alertA.severityLevelNumber,
      )[0] ?? null
    )
  }

  public onAlertAcknowledgement(alertId: string): void {
    let alert = this.alerts.find((currentAlert) => currentAlert._id === alertId)

    if (!alert) return

    alert.acknowledged = true
    this.emit('alert-updated')
  }

  public onAlertAcknowledgementError(alertId: string): void {
    let alert = this.alerts.find((currentAlert) => currentAlert._id === alertId)

    if (!alert) return

    alert.acknowledged = false
    this.emit('alert-updated')
  }

  public requestCenterOnMap(): void {
    this.centerRequestCount += 1
  }
}

class FakeForce {
  public _id = 'force-1'
  public name = 'Force 1'
  public color = '#ff0000'
  public resourcesRemaining = 3
  public nodes: FakeNode[]

  public constructor(nodes: FakeNode[]) {
    this.nodes = nodes
  }

  public get pendingAlerts(): NodeAlert[] {
    return this.nodes
      .flatMap((node) => node.alerts)
      .filter((alert) => !alert.acknowledged)
      .sort(
        (alertA, alertB) =>
          alertB.severityLevelNumber - alertA.severityLevelNumber,
      )
  }

  public get nextPendingAlert(): NodeAlert | null {
    return this.pendingAlerts[0] ?? null
  }

  public getNode(nodeId: string): FakeNode | undefined {
    return this.nodes.find((node) => node._id === nodeId)
  }
}

class FakeMission extends FakeEventTarget {
  public files: any[] = []
  public resourceLabel = 'Resources'
  public forces: FakeForce[]

  public constructor(forces: FakeForce[]) {
    super()
    this.forces = forces
  }

  public getForceById(forceId: string): FakeForce | undefined {
    return this.forces.find((force) => force._id === forceId)
  }
}

let mockServer: FakeEventTarget
let mockSession: any
let mockActions: any

let createMockButtonEngine = () => ({
  add: () => createMockButtonEngine(),
  hide: () => createMockButtonEngine(),
  disable: () => createMockButtonEngine(),
})

jest.mock('@client/context/global', () => ({
  useGlobalContext: () => ({
    server: [mockServer],
    login: [
      {
        user: {
          isAuthorized: () => true,
          authorize: () => {},
        },
      },
    ],
    actions: mockActions,
  }),
  useNavigationMiddleware: () => {},
}))

jest.mock('@client/toolbox/hooks', () => {
  let actual = jest.requireActual('@client/toolbox/hooks')

  return {
    ...actual,
    useRequireLogin: () => ({
      login: {
        user: {
          isAuthorized: () => true,
          authorize: () => {},
        },
      },
      user: {
        isAuthorized: () => true,
        authorize: () => {},
      },
      isAuthorized: () => true,
      authorize: () => {},
    }),
  }
})

jest.mock('@client/toolbox/hooks/sessions', () => ({
  useSessionRedirects: () => ({
    verifyNavigation: { current: () => {} },
    navigateToReturnPage: () => {},
  }),
}))

jest.mock('@client/components/pages', () => ({
  DefaultPageLayout: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid='default-page-layout'>{children}</div>
  ),
}))

jest.mock('@client/components/content/general-layout/panels/Panel', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

jest.mock(
  '@client/components/content/general-layout/panels/PanelLayout',
  () => ({
    __esModule: true,
    default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  }),
)

jest.mock('@client/components/content/general-layout/panels/PanelView', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@client/components/content/communication/PendingPageModal', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@client/components/content/communication/Prompt', () => ({
  __esModule: true,
  default: {
    ConfirmationChoices: [],
    YesNoChoices: [],
  },
}))

jest.mock(
  '@client/components/content/data/lists/implementations/MissionFileList',
  () => ({
    __esModule: true,
    default: () => null,
  }),
)

jest.mock(
  '@client/components/content/session/members/SessionMembersPanel',
  () => ({
    __esModule: true,
    default: () => null,
  }),
)

jest.mock(
  '@client/components/content/session/mission-map/ui/overlay/modals/action-execution/ActionExecModal',
  () => ({
    __esModule: true,
    default: () => null,
  }),
)

jest.mock('@client/components/content/session/output/', () => ({
  OutputPanel: () => null,
}))

jest.mock('@client/components/content/session/StatusBar', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@client/components/content/communication/Tooltip', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@client/components/content/general-layout/Markdown', () => ({
  __esModule: true,
  MarkdownTheme: {
    ThemePrimary: 0,
    ThemeSecondary: 1,
    ThemeTertiary: 2,
  },
  default: ({ markdown }: { markdown: string }) => <div>{markdown}</div>,
}))

jest.mock('@client/components/content/session/mission-map/MissionMap', () => {
  let React = require('react')

  return {
    __esModule: true,
    useMapContext: () => ({}),
    default: ({
      mission,
      selectedForce,
      onNodeSelect,
      children,
    }: {
      mission: FakeMission
      selectedForce: [FakeForce | null, (force: FakeForce | null) => void]
      onNodeSelect: ((node: FakeNode) => void) | null
      children?: React.ReactNode
    }) => {
      React.useEffect(() => {
        if (!selectedForce[0] && mission.forces[0]) {
          selectedForce[1](mission.forces[0])
        }
      }, [mission, selectedForce])

      let force = selectedForce[0]
      let node = force?.nodes[0] ?? null

      return (
        <div data-testid='mission-map'>
          <button
            onClick={() => {
              if (node && onNodeSelect) {
                onNodeSelect(node)
              }
            }}
            type='button'
          >
            select-node
          </button>
          <div data-testid='map-node-alert'>
            {node?.nextPendingAlert?.severityLevel ?? 'none'}
          </div>
          {children}
        </div>
      )
    },
  }
})

jest.mock(
  '@client/components/content/user-controls/buttons/panels/hooks',
  () => ({
    useButtonSvgEngine: () => createMockButtonEngine(),
  }),
)

jest.mock('@client/toolbox/icons', () => ({
  getIconPath: () => '',
}))

function createSessionPageHarness(alerts: NodeAlert[] = []) {
  let node = new FakeNode()
  node.alerts = alerts
  let force = new FakeForce([node])
  let mission = new FakeMission([force])
  mockServer = new FakeEventTarget()

  let acknowledgeAlertResolve: (() => void) | null = null
  let acknowledgeAlertPromise = new Promise<void>((resolve) => {
    acknowledgeAlertResolve = resolve
  })

  mockSession = {
    mission,
    state: 'started',
    setupFailed: false,
    teardownFailed: false,
    name: 'Test Session',
    config: {
      accessibility: 'default',
      infiniteResources: false,
    },
    member: {
      isAuthorized: () => true,
    },
    sendPreExecutionMessage: () => {},
    openNode: () => {},
    $quit: async () => {},
    $end: async () => {},
    $reset: async () => {},
    $acknowledgeNodeAlert: jest.fn(() => acknowledgeAlertPromise),
  }

  mockActions = {
    navigateTo: () => {},
    finishLoading: () => {},
    notify: () => {},
    prompt: async () => ({ choice: 'Cancel' }),
    handleError: () => {},
    beginLoading: () => {},
  }

  let renderResult = render(
    <SessionPage session={mockSession} returnPage='HomePage' />,
  )

  return {
    ...renderResult,
    mission,
    force,
    node,
    session: mockSession,
    server: mockServer,
    resolveAcknowledgeAlert: () => acknowledgeAlertResolve?.(),
  }
}

describe('Mission Map + Alert System', () => {
  test('shows the global alert indicator when a new alert is received and reflects its severity', async () => {
    let { container, node, server } = createSessionPageHarness()

    await waitFor(() => {
      expect(screen.getByTestId('map-node-alert')).toHaveTextContent('none')
    })

    act(() => {
      node.alerts.push(
        NodeAlert.createNew(node._id, 'Warning alert', 'warning'),
      )
      server.emit('modifier-enacted')
    })

    await waitFor(() => {
      let indicator = container.querySelector(
        '.NodeAlertIndicator',
      ) as HTMLElement

      expect(indicator).not.toBeNull()
      expect(indicator).toHaveClass('SeverityLevel_warning')
    })
  })

  test('removes the global alert indicator when all pending alerts have been acknowledged', async () => {
    let alert = NodeAlert.createNew('node-1', 'Warning alert', 'warning')
    let { container, node, server } = createSessionPageHarness([alert])

    await waitFor(() => {
      let indicator = container.querySelector('.NodeAlertIndicator')

      expect(indicator).not.toBeNull()
    })

    act(() => {
      node.onAlertAcknowledgement(alert._id)
      server.emit('node-alert-acknowledged')
    })

    await waitFor(() => {
      expect(container.querySelector('.NodeAlertIndicator')).toBeNull()
    })
  })

  test('reflects the most severe pending alert in the global alert indicator', async () => {
    let infoAlert = NodeAlert.createNew('node-1', 'Info alert', 'info')
    let dangerAlert = NodeAlert.createNew('node-1', 'Danger alert', 'danger')
    let { container } = createSessionPageHarness([infoAlert, dangerAlert])

    await waitFor(() => {
      let indicator = container.querySelector(
        '.NodeAlertIndicator',
      ) as HTMLElement

      expect(indicator).not.toBeNull()
      expect(indicator).toHaveClass('SeverityLevel_danger')
    })
  })

  test('acknowledging an alert via the alert box calls $acknowledgeNodeAlert and clears the node indicator when no alerts remain', async () => {
    let alert = NodeAlert.createNew('node-1', 'Warning alert', 'warning')
    let { container, node, server, session, resolveAcknowledgeAlert } =
      createSessionPageHarness([alert])

    await waitFor(() => {
      expect(screen.getByTestId('map-node-alert')).toHaveTextContent('warning')
    })

    fireEvent.click(screen.getByText('select-node'))

    await waitFor(() => {
      let alertTitle = container.querySelector(
        '.NodeAlertBox:not(.Hidden) .AlertTitle',
      ) as HTMLElement

      expect(alertTitle.textContent).toBe('warning')
    })

    fireEvent.click(screen.getByText('Close'))

    expect(session.$acknowledgeNodeAlert).toHaveBeenCalledWith(
      alert._id,
      node._id,
    )

    await act(async () => {
      resolveAcknowledgeAlert()
      server.emit('node-alert-acknowledged')
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(screen.getByTestId('map-node-alert')).toHaveTextContent('none')
    })
  })

  test("updates the first member's mission map in real time when another same-force member acknowledges an alert", async () => {
    let alert = NodeAlert.createNew('node-1', 'Warning alert', 'warning')
    let { container, node, server } = createSessionPageHarness([alert])

    await waitFor(() => {
      let indicator = container.querySelector('.NodeAlertIndicator')

      expect(indicator).not.toBeNull()
      expect(screen.getByTestId('map-node-alert')).toHaveTextContent('warning')
    })

    act(() => {
      node.onAlertAcknowledgement(alert._id)
      server.emit('node-alert-acknowledged')
    })

    await waitFor(() => {
      expect(container.querySelector('.NodeAlertIndicator')).toBeNull()
      expect(screen.getByTestId('map-node-alert')).toHaveTextContent('none')
    })
  })
})
