import { DetailNumber } from '@client/components/content/form/DetailNumber'
import { describe, expect, jest, test } from '@jest/globals'
import { fireEvent, render } from '@testing-library/react'

describe('DetailNumber', () => {
  /* -- ROOT CLASS NAMES -- */

  describe('Root class names', () => {
    test('Root has "Detail" and "DetailNumber" classes', () => {
      let { container } = render(
        <DetailNumber
          fieldType='required'
          label='Test Label'
          value={0}
          setValue={() => {}}
        />,
      )
      let root = container.firstChild as HTMLElement
      expect(root).toHaveClass('Detail')
      expect(root).toHaveClass('DetailNumber')
    })

    test('Root has "Disabled" class when disabled', () => {
      let { container } = render(
        <DetailNumber
          fieldType='required'
          label='Test Label'
          value={0}
          setValue={() => {}}
          disabled
        />,
      )
      let root = container.firstChild as HTMLElement
      expect(root).toHaveClass('Disabled')
    })

    test('Root does not have "Disabled" class when not disabled', () => {
      let { container } = render(
        <DetailNumber
          fieldType='required'
          label='Test Label'
          value={0}
          setValue={() => {}}
        />,
      )
      let root = container.firstChild as HTMLElement
      expect(root).not.toHaveClass('Disabled')
    })
  })

  /* -- UNIT LABEL -- */

  describe('Unit label', () => {
    test('Unit label is rendered when the unit prop is provided', () => {
      let { container } = render(
        <DetailNumber
          fieldType='required'
          label='Test Label'
          value={5}
          setValue={() => {}}
          unit='kg'
        />,
      )
      let unit = container.querySelector('.Unit') as HTMLElement
      expect(unit).not.toBeNull()
      expect(unit.textContent).toBe('kg')
    })

    test('Unit label is not rendered when the unit prop is not provided', () => {
      let { container } = render(
        <DetailNumber
          fieldType='required'
          label='Test Label'
          value={5}
          setValue={() => {}}
        />,
      )
      expect(container.querySelector('.Unit')).toBeNull()
    })
  })

  /* -- ON CHANGE -- */

  describe('onChange behavior', () => {
    test('Typing a valid number calls setValue with the parsed value', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailNumber
          fieldType='required'
          label='Test Label'
          value={0}
          setValue={setValue}
        />,
      )
      let input = container.querySelector('input') as HTMLInputElement
      fireEvent.change(input, { target: { value: '42' } })
      expect(setValue).toHaveBeenCalledWith(42)
    })

    test('Typing an invalid string does not call setValue', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailNumber
          fieldType='required'
          label='Test Label'
          value={0}
          setValue={setValue}
        />,
      )
      let input = container.querySelector('input') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'abc' } })
      expect(setValue).not.toHaveBeenCalled()
    })

    test('Typing a decimal when integersOnly is true does not call setValue', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailNumber
          fieldType='required'
          label='Test Label'
          value={0}
          setValue={setValue}
          integersOnly
        />,
      )
      let input = container.querySelector('input') as HTMLInputElement
      fireEvent.change(input, { target: { value: '1.5' } })
      expect(setValue).not.toHaveBeenCalled()
    })
  })

  /* -- ON BLUR CLAMPING -- */

  describe('onBlur clamping', () => {
    test('Value above maximum is clamped to the maximum on blur', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailNumber
          fieldType='required'
          label='Test Label'
          value={150}
          setValue={setValue}
          maximum={100}
        />,
      )
      let input = container.querySelector('input') as HTMLInputElement
      fireEvent.blur(input)
      expect(setValue).toHaveBeenCalledWith(100)
    })

    test('Value below minimum is clamped to the minimum on blur', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailNumber
          fieldType='required'
          label='Test Label'
          value={-5}
          setValue={setValue}
          minimum={0}
        />,
      )
      let input = container.querySelector('input') as HTMLInputElement
      fireEvent.blur(input)
      expect(setValue).toHaveBeenCalledWith(0)
    })

    test('Empty required field defaults to 0 on blur when no minimum or maximum is set', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailNumber
          fieldType='required'
          label='Test Label'
          value={0}
          setValue={setValue}
        />,
      )
      let input = container.querySelector('input') as HTMLInputElement
      fireEvent.change(input, { target: { value: '' } })
      fireEvent.blur(input)
      expect(setValue).toHaveBeenCalledWith(0)
    })

    test('Empty required field defaults to the minimum on blur when minimum is positive', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailNumber
          fieldType='required'
          label='Test Label'
          value={0}
          setValue={setValue}
          minimum={5}
        />,
      )
      let input = container.querySelector('input') as HTMLInputElement
      fireEvent.change(input, { target: { value: '' } })
      fireEvent.blur(input)
      expect(setValue).toHaveBeenCalledWith(5)
    })

    test('Clearing input on a required field does not call setValue before blur', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailNumber
          fieldType='required'
          label='Test Label'
          value={42}
          setValue={setValue}
        />,
      )
      let input = container.querySelector('input') as HTMLInputElement
      fireEvent.change(input, { target: { value: '' } })
      expect(setValue).not.toHaveBeenCalled()
    })

    test('Clearing input on an optional field calls setValue with null on blur', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailNumber
          fieldType='optional'
          label='Test Label'
          value={23}
          setValue={setValue}
        />,
      )
      let input = container.querySelector('input') as HTMLInputElement
      fireEvent.change(input, { target: { value: '' } })
      fireEvent.blur(input)
      expect(setValue).toHaveBeenCalledWith(null)
    })
  })
})
