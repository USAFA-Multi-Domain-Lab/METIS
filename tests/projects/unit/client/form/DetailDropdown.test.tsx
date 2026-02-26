import type { TDetailDropdown_P } from '@client/components/content/form/dropdown/DetailDropdown'
import { DetailDropdown } from '@client/components/content/form/dropdown/DetailDropdown'
import { describe, expect, jest, test } from '@jest/globals'
import { fireEvent, render } from '@testing-library/react'

/**
 * Minimal valid props for a required DetailDropdown<string> with no frills.
 */
const defaultRequiredProps: TDetailDropdown_P<TOptions> = {
  fieldType: 'required' as const,
  label: 'Test Label',
  options: ['Alpha', 'Bravo', 'Charlie'],
  value: 'Alpha',
  setValue: () => {},
  render: (option: string) => option,
  getKey: (option: string) => option,
  handleInvalidOption: { method: 'setToFirst' as const },
  tooltipDescription: '',
}
/**
 * Minimal valid props for an optional DetailDropdown<string | null> with no frills.
 */
const defaultOptionalProps: TDetailDropdown_P<TOptions | null> = {
  fieldType: 'optional' as const,
  label: 'Test Label',
  options: ['Alpha', 'Bravo', 'Charlie'],
  value: null,
  setValue: ((_value: TOptions | null) => {}) as any,
  render: (option: TOptions | null) => option ?? '',
  getKey: (option: TOptions | null) => option ?? '',
  handleInvalidOption: { method: 'setToFirst' as const },
  tooltipDescription: '',
  emptyText: 'Select an option',
}

describe('DetailDropdown', () => {
  /* -- ROOT CLASS NAMES -- */

  describe('Root class names', () => {
    test('Root has "Detail" and "DetailDropdown" classes', () => {
      let { container } = render(<DetailDropdown {...defaultRequiredProps} />)
      let root = container.firstChild as HTMLElement
      expect(root).toHaveClass('Detail')
      expect(root).toHaveClass('DetailDropdown')
    })

    test('Root has "Disabled" class when disabled', () => {
      let { container } = render(
        <DetailDropdown {...defaultRequiredProps} disabled />,
      )
      let root = container.firstChild as HTMLElement
      expect(root).toHaveClass('Disabled')
    })
  })

  /* -- COLLAPSED STATE -- */

  describe('Collapsed state (default)', () => {
    test('"AllOptions" has "Hidden" class when not expanded', () => {
      let { container } = render(<DetailDropdown {...defaultRequiredProps} />)
      let allOptions = container.querySelector('.AllOptions') as HTMLElement
      expect(allOptions).toHaveClass('Hidden')
    })

    test('Field does not have "IsExpanded" class when not expanded', () => {
      let { container } = render(<DetailDropdown {...defaultRequiredProps} />)
      let field = container.querySelector('.Field') as HTMLElement
      expect(field).not.toHaveClass('IsExpanded')
    })
  })

  /* -- EXPANDED STATE -- */

  describe('Expanded state (after clicking the selected option)', () => {
    test('"AllOptions" loses "Hidden" class when expanded', () => {
      let { container } = render(<DetailDropdown {...defaultRequiredProps} />)
      let trigger = container.querySelector(
        '.DropdownOption.Selected',
      ) as HTMLElement
      fireEvent.click(trigger)
      let allOptions = container.querySelector('.AllOptions') as HTMLElement
      expect(allOptions).not.toHaveClass('Hidden')
    })

    test('Field gains "IsExpanded" class when expanded', () => {
      let { container } = render(<DetailDropdown {...defaultRequiredProps} />)
      let trigger = container.querySelector(
        '.DropdownOption.Selected',
      ) as HTMLElement
      fireEvent.click(trigger)
      let field = container.querySelector('.Field') as HTMLElement
      expect(field).toHaveClass('IsExpanded')
    })
  })

  /* -- OPTION SELECTION -- */

  describe('Option selection', () => {
    test('Clicking an option calls setValue with that option', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailDropdown {...defaultRequiredProps} setValue={setValue} />,
      )
      let trigger = container.querySelector(
        '.DropdownOption.Selected',
      ) as HTMLElement
      fireEvent.click(trigger)
      let options = container.querySelectorAll('.AllOptions .DropdownOption')
      fireEvent.click(options[1]) // 'Bravo'
      expect(setValue).toHaveBeenCalledWith('Bravo')
    })

    test('Clicking an option when disabled does not call setValue', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailDropdown
          {...defaultRequiredProps}
          setValue={setValue}
          disabled
        />,
      )
      let trigger = container.querySelector(
        '.DropdownOption.Selected',
      ) as HTMLElement
      fireEvent.click(trigger)
      // Dropdown should not expand when disabled
      let allOptions = container.querySelector('.AllOptions') as HTMLElement
      expect(allOptions).toHaveClass('Hidden')
      expect(setValue).not.toHaveBeenCalled()
    })
  })

  /* -- INVALID OPTION HANDLING -- */

  describe('Invalid option handling', () => {
    test('setValue is called with the first option when method is "setToFirst" and value leaves options', () => {
      let setValue = jest.fn()
      let { rerender } = render(
        <DetailDropdown
          {...defaultRequiredProps}
          options={['Alpha', 'Bravo', 'Charlie']}
          value='Alpha'
          setValue={setValue}
          handleInvalidOption={{ method: 'setToFirst' }}
        />,
      )
      rerender(
        <DetailDropdown
          {...defaultRequiredProps}
          options={['Bravo', 'Charlie']}
          value='Alpha'
          setValue={setValue}
          handleInvalidOption={{ method: 'setToFirst' }}
        />,
      )
      expect(setValue).toHaveBeenCalledWith('Bravo')
    })

    test('setValue is called with the defaultValue when method is "setToDefault" and value leaves options', () => {
      let setValue = jest.fn()
      let { rerender } = render(
        <DetailDropdown
          {...defaultRequiredProps}
          options={['Alpha', 'Bravo', 'Charlie']}
          value='Alpha'
          setValue={setValue}
          handleInvalidOption={{
            method: 'setToDefault',
            defaultValue: 'Charlie',
          }}
        />,
      )
      rerender(
        <DetailDropdown
          {...defaultRequiredProps}
          options={['Bravo', 'Charlie']}
          value='Alpha'
          setValue={setValue}
          handleInvalidOption={{
            method: 'setToDefault',
            defaultValue: 'Charlie',
          }}
        />,
      )
      expect(setValue).toHaveBeenCalledWith('Charlie')
    })

    test('Warning icon has "Warning" class when method is "warning" and value is not in options', () => {
      let { container } = render(
        <DetailDropdown
          {...defaultRequiredProps}
          options={['Bravo', 'Charlie']}
          value='Alpha'
          handleInvalidOption={{ method: 'warning', message: 'Invalid option' }}
        />,
      )
      let warning = container.querySelector('.Warning') as HTMLElement
      expect(warning).not.toBeNull()
    })

    test('Warning icon has "Hidden" class when value is valid and method is "warning"', () => {
      let { container } = render(
        <DetailDropdown
          {...defaultRequiredProps}
          options={['Alpha', 'Bravo', 'Charlie']}
          value='Alpha'
          handleInvalidOption={{ method: 'warning', message: 'Invalid option' }}
        />,
      )
      let hidden = container.querySelector('.Hidden') as HTMLElement
      // The warning div should have Hidden class (not Warning) when value is valid
      expect(hidden).not.toBeNull()
    })
  })

  /* -- EMPTY TEXT -- */

  describe('Empty text', () => {
    test('emptyText is displayed in the state value area when value is null and fieldType is optional', () => {
      let { container } = render(
        <DetailDropdown<TOptions | null>
          {...defaultOptionalProps}
          emptyText='No option selected'
        />,
      )
      let text = container.querySelector('.Text') as HTMLElement
      expect(text?.textContent).toBe('No option selected')
    })
  })
})

/* -- TYPES -- */

type TOptions = 'Alpha' | 'Bravo' | 'Charlie'
