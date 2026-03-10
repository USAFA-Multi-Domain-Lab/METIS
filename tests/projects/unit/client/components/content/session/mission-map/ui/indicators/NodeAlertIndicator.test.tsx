import NodeAlertIndicator from '@client/components/content/session/mission-map/ui/indicators/NodeAlertIndicator'
import { describe, expect, jest, test } from '@jest/globals'
import { NodeAlert } from '@shared/missions/nodes/NodeAlert'
import { fireEvent, render } from '@testing-library/react'

jest.mock('@client/components/content/session/mission-map/MissionMap', () => ({
  useMapContext: () => ({}),
}))

jest.mock('@client/components/content/communication/Tooltip', () => ({
  __esModule: true,
  default: () => null,
}))

describe('NodeAlertIndicator', () => {
  test('renders null when nextPendingAlert is null', () => {
    let { container } = render(<NodeAlertIndicator nextPendingAlert={null} />)

    expect(container.firstChild).toBeNull()
  })

  test('renders the indicator when a pending alert is provided', () => {
    let alert = NodeAlert.createNew('node-1', 'Danger message', 'danger')
    let { container } = render(<NodeAlertIndicator nextPendingAlert={alert} />)

    expect(container.querySelector('.NodeAlertIndicator')).not.toBeNull()
  })

  test('applies the severity-level class for the provided alert', () => {
    let alert = NodeAlert.createNew('node-1', 'Danger message', 'danger')
    let { container } = render(<NodeAlertIndicator nextPendingAlert={alert} />)
    let root = container.querySelector('.NodeAlertIndicator') as HTMLElement

    expect(root).toHaveClass('SeverityLevel_danger')
  })

  test('calls onClick when the indicator is clicked', () => {
    let onClick = jest.fn()
    let alert = NodeAlert.createNew('node-1', 'Warning message', 'warning')
    let { container } = render(
      <NodeAlertIndicator nextPendingAlert={alert} onClick={onClick} />,
    )
    let root = container.querySelector('.NodeAlertIndicator') as HTMLElement

    fireEvent.click(root)

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
