import { DetailColorSelector } from '@client/components/content/form/dropdowns/colors/DetailColorSelector'
import { describe, expect, jest, test } from '@jest/globals'
import { fireEvent, render } from '@testing-library/react'

const availableColors = ['#ff0000', '#00ff00', '#0000ff']

describe('DetailColorSelector', () => {
  /* -- COLOR SELECTION -- */

  describe('Color selection', () => {
    test('Clicking a color calls setValue with that color', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailColorSelector
          fieldType='required'
          label='Test Label'
          colors={availableColors}
          value='#ff0000'
          setValue={setValue}
        />,
      )
      let dropdownTrigger = container.querySelector('.Dropdown') as HTMLElement
      fireEvent.click(dropdownTrigger)
      let colors = container.querySelectorAll('.Color')
      fireEvent.click(colors[1]) // '#00ff00'
      expect(setValue).toHaveBeenCalledWith('#00ff00')
    })

    test('Clicking a color when disabled does not call setValue', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailColorSelector
          fieldType='required'
          label='Test Label'
          colors={availableColors}
          value='#ff0000'
          setValue={setValue}
          disabled
          isExpanded
        />,
      )
      let colors = container.querySelectorAll('.Color')
      expect(colors.length).toBeGreaterThan(0)
      fireEvent.click(colors[1]) // '#00ff00'
      expect(setValue).not.toHaveBeenCalled()
    })
  })
})
