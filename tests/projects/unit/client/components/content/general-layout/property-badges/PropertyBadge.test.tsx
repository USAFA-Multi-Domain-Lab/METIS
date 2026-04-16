import PropertyBadge from '@client/components/content/general-layout/property-badges/PropertyBadge'
import { describe, expect, jest, test } from '@jest/globals'
import { render } from '@testing-library/react'

jest.mock('@client/toolbox/icons', () => ({
  getIconPath: (icon: string) => `https://example.com/${icon}.svg`,
}))

jest.mock('@client/components/content/communication/Tooltip', () => ({
  __esModule: true,
  default: ({ description }: { description: string }) => (
    <div data-testid='tooltip' data-description={description} />
  ),
}))

describe('PropertyBadge', () => {
  /* -- VISIBILITY -- */

  describe('Visibility', () => {
    test('does not apply the Hidden class to the root element when active is true', () => {
      let { container } = render(
        <PropertyBadge
          icon='percent'
          value='50%'
          description='Success Chance'
          active={true}
        />,
      )
      let root = container.querySelector('.PropertyBadge') as HTMLElement

      expect(root).not.toHaveClass('Hidden')
    })

    test('applies the Hidden class to the root element when active is false', () => {
      let { container } = render(
        <PropertyBadge
          icon='percent'
          value='50%'
          description='Success Chance'
          active={false}
        />,
      )
      let root = container.querySelector('.PropertyBadge') as HTMLElement

      expect(root).toHaveClass('Hidden')
    })
  })

  /* -- ICON -- */

  describe('Icon', () => {
    test('sets a url() background image on the icon element when a named icon is provided', () => {
      let { container } = render(
        <PropertyBadge
          icon='percent'
          value='50%'
          description='Success Chance'
        />,
      )
      let icon = container.querySelector('.PropertyIcon') as HTMLElement

      expect(icon.style.backgroundImage).toContain('url(')
    })

    test('does not set a url() background image when icon is _blank', () => {
      let { container } = render(
        <PropertyBadge icon='_blank' value='50%' description='Blank icon' />,
      )
      let icon = container.querySelector('.PropertyIcon') as HTMLElement

      expect(icon.style.backgroundImage).not.toContain('url(')
    })
  })

  /* -- VALUE -- */

  describe('Value', () => {
    test('renders the value content inside the value element when value is provided', () => {
      let { container } = render(
        <PropertyBadge
          icon='percent'
          value='75%'
          description='Success Chance'
        />,
      )
      let valueElement = container.querySelector(
        '.PropertyValue',
      ) as HTMLElement

      expect(valueElement).toHaveTextContent('75%')
    })

    test('applies the Hidden class to the value element when value is null', () => {
      let { container } = render(
        <PropertyBadge icon='door' value={null} description='Opens Node' />,
      )
      let valueElement = container.querySelector(
        '.PropertyValue',
      ) as HTMLElement

      expect(valueElement).toHaveClass('Hidden')
    })
  })

  /* -- STRIKETHROUGH -- */

  describe('Strikethrough', () => {
    test('applies the Strikethrough class to the root element when strikethrough is true', () => {
      let { container } = render(
        <PropertyBadge
          icon='percent'
          value='50%'
          description='Success Chance'
          strikethrough={true}
        />,
      )
      let root = container.querySelector('.PropertyBadge') as HTMLElement

      expect(root).toHaveClass('Strikethrough')
    })

    test('does not apply the Strikethrough class to the root element when strikethrough is false', () => {
      let { container } = render(
        <PropertyBadge
          icon='percent'
          value='50%'
          description='Success Chance'
          strikethrough={false}
        />,
      )
      let root = container.querySelector('.PropertyBadge') as HTMLElement

      expect(root).not.toHaveClass('Strikethrough')
    })

    test('renders the strikethrough reason element without the Hidden class when strikethrough is true and a reason is provided', () => {
      let { container } = render(
        <PropertyBadge
          icon='percent'
          value='50%'
          description='Success Chance'
          strikethrough={true}
          strikethroughReason='Cheats Applied'
        />,
      )
      let reason = container.querySelector(
        '.StrikethroughReason',
      ) as HTMLElement

      expect(reason).not.toHaveClass('Hidden')
      expect(reason).toHaveTextContent('Cheats Applied')
    })

    test('applies the Hidden class to the strikethrough reason element when strikethrough is false', () => {
      let { container } = render(
        <PropertyBadge
          icon='percent'
          value='50%'
          description='Success Chance'
          strikethrough={false}
          strikethroughReason='Cheats Applied'
        />,
      )
      let reason = container.querySelector(
        '.StrikethroughReason',
      ) as HTMLElement

      expect(reason).toHaveClass('Hidden')
    })

    test('applies the Hidden class to the strikethrough reason element when strikethrough is true but no reason is provided', () => {
      let { container } = render(
        <PropertyBadge
          icon='percent'
          value='50%'
          description='Success Chance'
          strikethrough={true}
          strikethroughReason=''
        />,
      )
      let reason = container.querySelector(
        '.StrikethroughReason',
      ) as HTMLElement

      expect(reason).toHaveClass('Hidden')
    })
  })

  /* -- TOOLTIP -- */

  describe('Tooltip', () => {
    test('renders a Tooltip with the description prop passed through', () => {
      let { container } = render(
        <PropertyBadge icon='timer' value='10s' description='Process Time' />,
      )
      let tooltip = container.querySelector(
        '[data-testid="tooltip"]',
      ) as HTMLElement

      expect(tooltip).not.toBeNull()
      expect(tooltip.dataset.description).toBe('Process Time')
    })
  })
})
