import DetailMultiSelect from '@client/components/content/form/dropdowns/multiselect/DetailMultiSelect'
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
  /* -- OPTION TOGGLE -- */

  describe('Option toggling', () => {
    test('Clicking an unselected option calls setValue with that option added', () => {
      let setValue = jest.fn()
      let { container, getByText } = render(
        <DetailMultiSelect
          {...defaultProps}
          value={['Alpha']}
          setValue={setValue}
        />,
      )
      let trigger = container.querySelector('.SelectedContainer') as HTMLElement
      fireEvent.click(trigger)
      fireEvent.click(getByText('Bravo'))
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
      let { getByText } = render(
        <DetailMultiSelect
          {...defaultProps}
          value={['Alpha']}
          setValue={setValue}
          disabled
          isExpanded
        />,
      )
      fireEvent.click(getByText('Bravo'))
      expect(setValue).not.toHaveBeenCalled()
    })
  })

  /* -- REMOVE PILL -- */

  describe('Remove pill button', () => {
    test('Clicking the remove button on a pill calls setValue with that option removed', () => {
      let setValue = jest.fn()
      let { getAllByRole } = render(
        <DetailMultiSelect
          {...defaultProps}
          value={['Alpha', 'Bravo']}
          setValue={setValue}
        />,
      )
      let removeButtons = getAllByRole('button')
      fireEvent.click(removeButtons[0]) // Removes 'Alpha'
      expect(setValue).toHaveBeenCalledWith(['Bravo'])
    })
  })

  /* -- EMPTY TEXT -- */

  describe('Empty text', () => {
    test('EmptyText is displayed when no options are selected', () => {
      let { getByText } = render(
        <DetailMultiSelect
          {...defaultProps}
          value={[]}
          emptyText='Nothing selected'
        />,
      )
      expect(getByText('Nothing selected')).toBeTruthy()
    })

    test('EmptyText is not displayed when options are selected', () => {
      let { queryByText } = render(
        <DetailMultiSelect
          {...defaultProps}
          value={['Alpha']}
          emptyText='Nothing selected'
        />,
      )
      expect(queryByText('Nothing selected')).toBeNull()
    })
  })
})
