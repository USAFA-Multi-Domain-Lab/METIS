import ActionProperties from '@client/components/content/session/mission-map/ui/overlay/modals/action-execution/ActionProperties'
import type { ClientMissionAction } from '@client/missions/actions/ClientMissionAction'
import { describe, expect, jest, test } from '@jest/globals'
import type { TExecutionCheats } from '@shared/missions/actions/ActionExecution'
import {
  MissionSession,
  type TSessionConfig,
} from '@shared/sessions/MissionSession'
import { render } from '@testing-library/react'

jest.mock(
  '@client/components/content/general-layout/property-badges/PropertyBadge',
  () => ({
    __esModule: true,
    default: ({
      active = true,
      icon,
      description,
      strikethrough = false,
      strikethroughReason = '',
    }: {
      active?: boolean
      icon: string
      description: string
      strikethrough?: boolean
      strikethroughReason?: string
    }) => (
      <div
        data-testid='property-badge'
        data-icon={icon}
        data-description={description}
        data-active={String(active)}
        data-strikethrough={String(strikethrough)}
        data-strikethrough-reason={strikethroughReason}
      />
    ),
  }),
)

jest.mock(
  '@client/components/content/general-layout/property-badges/PropertyBadges',
  () => ({
    __esModule: true,
    default: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid='property-badges'>{children}</div>
    ),
  }),
)

jest.mock(
  '@client/components/content/general-layout/rich-text/RichText',
  () => ({
    __esModule: true,
    default: () => <div data-testid='rich-text' />,
  }),
)

/**
 * Creates a minimal mock of a ClientMissionAction with sensible defaults.
 */
function createMockAction(
  overrides: Partial<{
    successChanceFormatted: string
    processTimeFormatted: string
    resourceCost: number
    opensNode: boolean
    type: string
    description: string
    mission: { resourceLabel: string }
  }> = {},
): ClientMissionAction {
  return {
    successChanceFormatted: '75%',
    processTimeFormatted: '30s',
    resourceCost: 100,
    opensNode: true,
    type: 'standard',
    description: 'Test action description',
    mission: { resourceLabel: 'Points' },
    ...overrides,
  } as unknown as ClientMissionAction
}

/**
 * Returns the PropertyBadge mock element matching the given icon attribute.
 */
function getBadge(container: HTMLElement, icon: string): HTMLElement | null {
  return container.querySelector(
    `[data-testid="property-badge"][data-icon="${icon}"]`,
  ) as HTMLElement | null
}

describe('ActionProperties', () => {
  /* -- RENDERS ALL FIVE BADGES -- */

  test('renders all five property badges for a standard action', () => {
    let action = createMockAction()
    let { container } = render(<ActionProperties action={action} />)
    let badges = container.querySelectorAll('[data-testid="property-badge"]')

    expect(badges).toHaveLength(5)
    expect(getBadge(container, 'percent')).not.toBeNull()
    expect(getBadge(container, 'timer')).not.toBeNull()
    expect(getBadge(container, 'coins')).not.toBeNull()
    expect(getBadge(container, 'door')).not.toBeNull()
    expect(getBadge(container, 'repeat')).not.toBeNull()
  })

  /* -- CHEAT STRIKETHROUGHS -- */

  describe('Cheat strikethroughs', () => {
    test('applies a strikethrough with reason "Cheats Applied" to the success chance badge when guaranteedSuccess is true', () => {
      let action = createMockAction()
      let cheats: TExecutionCheats = {
        ...MissionSession.NO_CHEATS,
        guaranteedSuccess: true,
      }
      let { container } = render(
        <ActionProperties action={action} cheats={cheats} />,
      )
      let badge = getBadge(container, 'percent') as HTMLElement

      expect(badge.dataset.strikethrough).toBe('true')
      expect(badge.dataset.strikethroughReason).toBe('Cheats Applied')
    })

    test('applies a strikethrough with reason "Cheats Applied" to the process time badge when instantaneous is true', () => {
      let action = createMockAction()
      let cheats: TExecutionCheats = {
        ...MissionSession.NO_CHEATS,
        instantaneous: true,
      }
      let { container } = render(
        <ActionProperties action={action} cheats={cheats} />,
      )
      let badge = getBadge(container, 'timer') as HTMLElement

      expect(badge.dataset.strikethrough).toBe('true')
      expect(badge.dataset.strikethroughReason).toBe('Cheats Applied')
    })

    test('applies a strikethrough with reason "Cheats Applied" to the resource cost badge when zeroCost is true', () => {
      let action = createMockAction()
      let cheats: TExecutionCheats = {
        ...MissionSession.NO_CHEATS,
        zeroCost: true,
      }
      let { container } = render(
        <ActionProperties action={action} cheats={cheats} />,
      )
      let badge = getBadge(container, 'coins') as HTMLElement

      expect(badge.dataset.strikethrough).toBe('true')
      expect(badge.dataset.strikethroughReason).toBe('Cheats Applied')
    })
  })

  /* -- CONFIG STRIKETHROUGHS -- */

  describe('Config strikethroughs', () => {
    test('applies a strikethrough with reason "Infinite Resources Enabled" to the resource cost badge when infiniteResources is true', () => {
      let action = createMockAction()
      let config: TSessionConfig = {
        ...MissionSession.DEFAULT_CONFIG,
        infiniteResources: true,
      }
      let { container } = render(
        <ActionProperties action={action} config={config} />,
      )
      let badge = getBadge(container, 'coins') as HTMLElement

      expect(badge.dataset.strikethrough).toBe('true')
      expect(badge.dataset.strikethroughReason).toBe(
        'Infinite Resources Enabled',
      )
    })
  })

  /* -- CONDITIONAL BADGES -- */

  describe('Conditional badges', () => {
    test('renders the opens-node badge as inactive when action.opensNode is false', () => {
      let action = createMockAction({ opensNode: false })
      let { container } = render(<ActionProperties action={action} />)
      let badge = getBadge(container, 'door') as HTMLElement

      expect(badge.dataset.active).toBe('false')
    })

    test('renders the repeatable badge as inactive when action.type is not repeatable', () => {
      let action = createMockAction({ type: 'standard' })
      let { container } = render(<ActionProperties action={action} />)
      let badge = getBadge(container, 'repeat') as HTMLElement

      expect(badge.dataset.active).toBe('false')
    })

    test('renders the repeatable badge as active when action.type is repeatable', () => {
      let action = createMockAction({ type: 'repeatable' })
      let { container } = render(<ActionProperties action={action} />)
      let badge = getBadge(container, 'repeat') as HTMLElement

      expect(badge.dataset.active).toBe('true')
    })
  })

  /* -- DESCRIPTION -- */

  describe('Description', () => {
    test('does not render the action description when showDescription is false', () => {
      let action = createMockAction()
      let { container } = render(
        <ActionProperties action={action} showDescription={false} />,
      )

      expect(container.querySelector('.ActionDescription')).toBeNull()
    })

    test('renders the action description element when showDescription is true', () => {
      let action = createMockAction()
      let { container } = render(
        <ActionProperties action={action} showDescription={true} />,
      )

      expect(container.querySelector('.ActionDescription')).not.toBeNull()
    })
  })
})
