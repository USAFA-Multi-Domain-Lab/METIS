import DetailMultiSelect from '@client/components/content/form/multiselect/DetailMultiSelect'
import { describe, expect, jest, test } from '@jest/globals'
import { fireEvent, render } from '@testing-library/react'

/**
 * Minimal valid props for a DetailMultiSelect<string>.
 */
const defaultProps = {
  label: 'Test Label',
  options: ['Alpha', 'Bravo', 'Charlie'],
  value: ['Alpha'],
  setValue: () => {},
  render: (option: string) => option,
  getKey: (option: string) => option,
  tooltipDescription: '',
}

describe('DetailMultiSelect', () => {
  /* -- ROOT CLASS NAMES -- */

  describe('Root class names', () => {
    test('Root has "Detail" and "DetailMultiSelect" classes', () => {
      let { container } = render(<DetailMultiSelect {...defaultProps} />)
      let root = container.firstChild as HTMLElement
      expect(root).toHaveClass('Detail')
      expect(root).toHaveClass('DetailMultiSelect')
    })

    test('Root has "Disabled" class when disabled', () => {
      let { container } = render(
        <DetailMultiSelect {...defaultProps} disabled />,
      )
      let root = container.firstChild as HTMLElement
      expect(root).toHaveClass('Disabled')
    })
  })

  /* -- COLLAPSED STATE -- */

  describe('Collapsed state (default)', () => {
    test('"AllOptions" has "Hidden" class when not expanded', () => {
      let { container } = render(<DetailMultiSelect {...defaultProps} />)
      let allOptions = container.querySelector('.AllOptions') as HTMLElement
      expect(allOptions).toHaveClass('Hidden')
    })

    test('Root does not have "IsExpanded" class when not expanded', () => {
      let { container } = render(<DetailMultiSelect {...defaultProps} />)
      let root = container.firstChild as HTMLElement
      expect(root).not.toHaveClass('IsExpanded')
    })

    test('Field does not have "IsExpanded" class when not expanded', () => {
      let { container } = render(<DetailMultiSelect {...defaultProps} />)
      let field = container.querySelector('.Field') as HTMLElement
      expect(field).not.toHaveClass('IsExpanded')
    })
  })

  /* -- EXPANDED STATE -- */

  describe('Expanded state (after clicking the selected container)', () => {
    test('"AllOptions" loses "Hidden" class when expanded', () => {
      let { container } = render(<DetailMultiSelect {...defaultProps} />)
      let trigger = container.querySelector('.SelectedContainer') as HTMLElement
      fireEvent.click(trigger)
      let allOptions = container.querySelector('.AllOptions') as HTMLElement
      expect(allOptions).not.toHaveClass('Hidden')
    })

    test('Root gains "IsExpanded" class when expanded', () => {
      let { container } = render(<DetailMultiSelect {...defaultProps} />)
      let trigger = container.querySelector('.SelectedContainer') as HTMLElement
      fireEvent.click(trigger)
      let root = container.firstChild as HTMLElement
      expect(root).toHaveClass('IsExpanded')
    })

    test('Field gains "IsExpanded" class when expanded', () => {
      let { container } = render(<DetailMultiSelect {...defaultProps} />)
      let trigger = container.querySelector('.SelectedContainer') as HTMLElement
      fireEvent.click(trigger)
      let field = container.querySelector('.Field') as HTMLElement
      expect(field).toHaveClass('IsExpanded')
    })
  })

  /* -- OPTION TOGGLE -- */

  describe('Option toggling', () => {
    test('Clicking an unselected option calls setValue with that option added', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailMultiSelect
          {...defaultProps}
          value={['Alpha']}
          setValue={setValue}
        />,
      )
      let trigger = container.querySelector('.SelectedContainer') as HTMLElement
      fireEvent.click(trigger)
      let optionContents = container.querySelectorAll('.OptionContent')
      fireEvent.click(optionContents[1]) // 'Bravo'
      expect(setValue).toHaveBeenCalledWith(['Alpha', 'Bravo'])
    })

    test('Clicking a selected option calls setValue with that option removed', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailMultiSelect
          {...defaultProps}
          value={['Alpha', 'Bravo']}
          setValue={setValue}
        />,
      )
      let trigger = container.querySelector('.SelectedContainer') as HTMLElement
      fireEvent.click(trigger)
      let optionContents = container.querySelectorAll('.OptionContent')
      fireEvent.click(optionContents[0]) // 'Alpha' — already selected
      expect(setValue).toHaveBeenCalledWith(['Bravo'])
    })

    test('Clicking an option when disabled does not call setValue', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailMultiSelect
          {...defaultProps}
          value={['Alpha']}
          setValue={setValue}
          disabled
          isExpanded
        />,
      )
      let optionContents = container.querySelectorAll('.OptionContent')
      fireEvent.click(optionContents[1]) // 'Bravo'
      expect(setValue).not.toHaveBeenCalled()
    })
  })

  /* -- REMOVE PILL -- */

  describe('Remove pill button', () => {
    test('Clicking the remove button on a pill calls setValue with that option removed', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailMultiSelect
          {...defaultProps}
          value={['Alpha', 'Bravo']}
          setValue={setValue}
        />,
      )
      let removeButtons = container.querySelectorAll('.RemoveButton')
      fireEvent.click(removeButtons[0]) // Removes 'Alpha'
      expect(setValue).toHaveBeenCalledWith(['Bravo'])
    })
  })

  /* -- EMPTY TEXT -- */

  describe('Empty text', () => {
    test('EmptyText is displayed when no options are selected', () => {
      let { container } = render(
        <DetailMultiSelect
          {...defaultProps}
          value={[]}
          emptyText='Nothing selected'
        />,
      )
      let emptyText = container.querySelector('.EmptyText') as HTMLElement
      expect(emptyText).not.toBeNull()
      expect(emptyText.textContent).toBe('Nothing selected')
    })

    test('EmptyText is not displayed when options are selected', () => {
      let { container } = render(
        <DetailMultiSelect {...defaultProps} value={['Alpha']} />,
      )
      expect(container.querySelector('.EmptyText')).toBeNull()
    })
  })
})
