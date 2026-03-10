import NodeAlertBox from '@client/components/content/session/mission-map/ui/toasts/NodeAlertBox'
import { describe, expect, jest, test } from '@jest/globals'
import { NodeAlert } from '@shared/missions/nodes/NodeAlert'
import { fireEvent, render, screen } from '@testing-library/react'

jest.mock('@client/components/content/session/mission-map/MissionMap', () => ({
  useMapContext: () => ({}),
}))

jest.mock('@client/components/content/general-layout/Markdown', () => ({
  __esModule: true,
  MarkdownTheme: {
    ThemePrimary: 0,
    ThemeSecondary: 1,
    ThemeTertiary: 2,
  },
  default: ({ markdown }: { markdown: string }) => (
    <div data-testid='markdown'>{markdown}</div>
  ),
}))

describe('NodeAlertBox', () => {
  function renderNodeAlertBox(
    alert: NodeAlert | null,
    options: {
      areMorePendingAlerts?: boolean
      next?: () => void
      acknowledge?: () => void
    } = {},
  ) {
    let {
      areMorePendingAlerts = false,
      next = () => {},
      acknowledge = () => {},
    } = options

    return render(
      <NodeAlertBox
        alert={alert}
        areMorePendingAlerts={areMorePendingAlerts}
        next={next}
        acknowledge={acknowledge}
      />,
    )
  }

  test('renders null when alert is null', () => {
    let { container } = renderNodeAlertBox(null)

    expect(container.firstChild).toBeNull()
  })

  test('displays the correct severity level heading when an alert is provided', () => {
    let alert = NodeAlert.createNew('node-1', 'A warning message', 'warning')

    renderNodeAlertBox(alert)

    expect(screen.getByText('warning')).toBeInTheDocument()
  })

  test('renders the alert message content via the Markdown component', () => {
    let alert = NodeAlert.createNew(
      'node-1',
      '**Escalate immediately**',
      'danger',
    )

    renderNodeAlertBox(alert)

    expect(screen.getByTestId('markdown')).toHaveTextContent(
      '**Escalate immediately**',
    )
  })

  test('shows the Next alert button when areMorePendingAlerts is true', () => {
    let alert = NodeAlert.createNew('node-1', 'Queued alert', 'warning')

    renderNodeAlertBox(alert, { areMorePendingAlerts: true })

    expect(screen.getByText('Next alert')).toBeInTheDocument()
  })

  test('does not show the Next alert button when areMorePendingAlerts is false', () => {
    let alert = NodeAlert.createNew('node-1', 'Single alert', 'warning')

    renderNodeAlertBox(alert, { areMorePendingAlerts: false })

    expect(screen.queryByText('Next alert')).toBeNull()
  })

  test('calls the next callback when the Next alert button is clicked', () => {
    let next = jest.fn()
    let alert = NodeAlert.createNew('node-1', 'Queued alert', 'warning')

    renderNodeAlertBox(alert, {
      areMorePendingAlerts: true,
      next,
    })

    fireEvent.click(screen.getByText('Next alert'))

    expect(next).toHaveBeenCalledTimes(1)
  })

  test('calls the acknowledge callback when the Close button is clicked', () => {
    let acknowledge = jest.fn()
    let alert = NodeAlert.createNew('node-1', 'Closable alert', 'warning')

    renderNodeAlertBox(alert, { acknowledge })

    fireEvent.click(screen.getByText('Close'))

    expect(acknowledge).toHaveBeenCalledTimes(1)
  })
})
