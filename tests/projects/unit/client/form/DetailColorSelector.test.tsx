import { DetailColorSelector } from '@client/components/content/form/DetailColorSelector'
import { describe, expect, jest, test } from '@jest/globals'
import { fireEvent, render } from '@testing-library/react'

const availableColors = ['#ff0000', '#00ff00', '#0000ff']

describe('DetailColorSelector', () => {
  /* -- ROOT CLASS NAMES -- */

  describe('Root class names', () => {
    test('Root has "Detail" and "DetailColorSelector" classes', () => {
      let { container } = render(
        <DetailColorSelector
          fieldType='required'
          label='Test Label'
          colors={availableColors}
          value='#ff0000'
          setValue={() => {}}
        />,
      )
      let root = container.firstChild as HTMLElement
      expect(root).toHaveClass('Detail')
      expect(root).toHaveClass('DetailColorSelector')
    })

    test('Root has "Disabled" class when disabled', () => {
      let { container } = render(
        <DetailColorSelector
          fieldType='required'
          label='Test Label'
          colors={availableColors}
          value='#ff0000'
          setValue={() => {}}
          disabled
        />,
      )
      let root = container.firstChild as HTMLElement
      expect(root).toHaveClass('Disabled')
    })
  })

  /* -- FIELD CLASS NAMES -- */

  describe('Field class names', () => {
    test('Field always has "FieldColorSelector" class', () => {
      let { container } = render(
        <DetailColorSelector
          fieldType='required'
          label='Test Label'
          colors={availableColors}
          value='#ff0000'
          setValue={() => {}}
        />,
      )
      let field = container.querySelector('.Field') as HTMLElement
      expect(field).toHaveClass('FieldColorSelector')
    })

    test('Field does not have "IsExpanded" class initially', () => {
      let { container } = render(
        <DetailColorSelector
          fieldType='required'
          label='Test Label'
          colors={availableColors}
          value='#ff0000'
          setValue={() => {}}
        />,
      )
      let field = container.querySelector('.Field') as HTMLElement
      expect(field).not.toHaveClass('IsExpanded')
    })

    test('Field gains "IsExpanded" class after clicking the dropdown trigger', () => {
      let { container } = render(
        <DetailColorSelector
          fieldType='required'
          label='Test Label'
          colors={availableColors}
          value='#ff0000'
          setValue={() => {}}
        />,
      )
      let dropdownTrigger = container.querySelector('.Dropdown') as HTMLElement
      fireEvent.click(dropdownTrigger)
      let field = container.querySelector('.Field') as HTMLElement
      expect(field).toHaveClass('IsExpanded')
    })

    test('Clicking the dropdown trigger when disabled does not expand', () => {
      let { container } = render(
        <DetailColorSelector
          fieldType='required'
          label='Test Label'
          colors={availableColors}
          value='#ff0000'
          setValue={() => {}}
          disabled
        />,
      )
      let dropdownTrigger = container.querySelector('.Dropdown') as HTMLElement
      fireEvent.click(dropdownTrigger)
      let field = container.querySelector('.Field') as HTMLElement
      expect(field).not.toHaveClass('IsExpanded')
    })
  })

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

  /* -- SELECTED COLOR -- */

  describe('Selected color indicator', () => {
    test('The currently selected color has the "Selected" class', () => {
      let { container } = render(
        <DetailColorSelector
          fieldType='required'
          label='Test Label'
          colors={availableColors}
          value='#ff0000'
          setValue={() => {}}
          isExpanded
        />,
      )
      let colors = container.querySelectorAll('.Color')
      expect(colors[0]).toHaveClass('Selected') // '#ff0000' — selected
    })

    test('Non-selected colors do not have the "Selected" class', () => {
      let { container } = render(
        <DetailColorSelector
          fieldType='required'
          label='Test Label'
          colors={availableColors}
          value='#ff0000'
          setValue={() => {}}
          isExpanded
        />,
      )
      let colors = container.querySelectorAll('.Color')
      expect(colors[1]).not.toHaveClass('Selected') // '#00ff00'
      expect(colors[2]).not.toHaveClass('Selected') // '#0000ff'
    })
  })
})
