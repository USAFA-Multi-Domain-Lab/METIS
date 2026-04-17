import type { TDetailDropdown_P } from '@client/components/content/form/dropdowns/standard/DetailDropdown'
import { DetailDropdown } from '@client/components/content/form/dropdowns/standard/DetailDropdown'
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
  /* -- OPTION SELECTION -- */

  describe('Option selection', () => {
    test('Clicking an option calls setValue with that option', () => {
      let setValue = jest.fn()
      let { getAllByText, getByText } = render(
        <DetailDropdown {...defaultRequiredProps} setValue={setValue} />,
      )
      fireEvent.click(getAllByText('Alpha')[0])
      fireEvent.click(getByText('Bravo'))
      expect(setValue).toHaveBeenCalledWith('Bravo')
    })

    test('Clicking an option when disabled does not call setValue', () => {
      let setValue = jest.fn()
      let { getAllByText, getByText } = render(
        <DetailDropdown
          {...defaultRequiredProps}
          setValue={setValue}
          disabled
        />,
      )
      fireEvent.click(getAllByText('Alpha')[0])
      fireEvent.click(getByText('Bravo'))
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
  })

  /* -- OPTIONAL FIELD BEHAVIOR -- */

  describe('Optional field behavior', () => {
    test('Starting from a null value, selecting an option calls setValue with that option', () => {
      let setValue = jest.fn()
      let { getAllByText, getByText } = render(
        <DetailDropdown<TOptions | null>
          {...defaultOptionalProps}
          setValue={setValue}
          emptyText='No option selected'
        />,
      )
      fireEvent.click(getAllByText('No option selected')[0])
      fireEvent.click(getByText('Bravo'))
      expect(setValue).toHaveBeenCalledWith('Bravo')
    })

    test('Selecting the empty option calls setValue with null for optional fields', () => {
      let setValue = jest.fn()
      let { getAllByText, getByText } = render(
        <DetailDropdown<TOptions | null>
          {...defaultOptionalProps}
          value='Alpha'
          setValue={setValue}
          emptyText='No option selected'
        />,
      )
      fireEvent.click(getAllByText('Alpha')[0])
      fireEvent.click(getByText('No option selected'))
      expect(setValue).toHaveBeenCalledWith(null)
    })
  })
})

/* -- TYPES -- */

type TOptions = 'Alpha' | 'Bravo' | 'Charlie'
