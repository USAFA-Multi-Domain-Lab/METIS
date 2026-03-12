import PropertyBadge from '@client/components/content/general-layout/property-badges/PropertyBadge'
import PropertyBadges from '@client/components/content/general-layout/property-badges/PropertyBadges'
import { describe, expect, jest, test } from '@jest/globals'
import { render } from '@testing-library/react'

jest.mock('@client/toolbox/icons', () => ({
  getIconPath: (icon: string) => `https://example.com/${icon}.svg`,
}))

jest.mock('@client/components/content/communication/Tooltip', () => ({
  __esModule: true,
  default: () => null,
}))

describe('PropertyBadges', () => {
  test('renders the root div with class PropertyBadges', () => {
    let { container } = render(<PropertyBadges />)
    let root = container.querySelector('.PropertyBadges')

    expect(root).not.toBeNull()
  })

  test('renders all provided children', () => {
    let { container } = render(
      <PropertyBadges>
        <PropertyBadge
          icon='percent'
          value='50%'
          description='Success Chance'
        />
        <PropertyBadge icon='timer' value='10s' description='Process Time' />
        <PropertyBadge icon='coins' value='-100' description='Resource Cost' />
      </PropertyBadges>,
    )
    let badges = container.querySelectorAll('.PropertyBadge')

    expect(badges).toHaveLength(3)
  })

  test('renders without children without error', () => {
    expect(() => render(<PropertyBadges />)).not.toThrow()
  })
})
