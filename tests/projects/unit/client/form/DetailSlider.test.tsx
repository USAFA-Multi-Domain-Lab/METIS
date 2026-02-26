import { DetailSlider } from '@client/components/content/form/DetailSlider'
import { describe, expect, jest, test } from '@jest/globals'
import { fireEvent, render } from '@testing-library/react'

describe('DetailSlider', () => {
  /* -- ROOT CLASS NAMES -- */

  describe('Root class names', () => {
    test('Root has "Detail" and "DetailSlider" classes', () => {
      let { container } = render(
        <DetailSlider
          fieldType='required'
          label='Test Label'
          value={50}
          setValue={() => {}}
        />,
      )
      let root = container.querySelector('.DetailSlider') as HTMLElement
      expect(root).toHaveClass('Detail')
      expect(root).toHaveClass('DetailSlider')
    })

    test('Root has "Disabled" class when disabled', () => {
      let { container } = render(
        <DetailSlider
          fieldType='required'
          label='Test Label'
          value={50}
          setValue={() => {}}
          disabled
        />,
      )
      let root = container.querySelector('.DetailSlider') as HTMLElement
      expect(root).toHaveClass('Disabled')
    })

    test('Root does not have "Disabled" class when not disabled', () => {
      let { container } = render(
        <DetailSlider
          fieldType='required'
          label='Test Label'
          value={50}
          setValue={() => {}}
        />,
      )
      let root = container.querySelector('.DetailSlider') as HTMLElement
      expect(root).not.toHaveClass('Disabled')
    })
  })

  /* -- VALUE DISPLAY -- */

  describe('Value display', () => {
    test('SliderValue is rendered by default', () => {
      let { container } = render(
        <DetailSlider
          fieldType='required'
          label='Test Label'
          value={42}
          setValue={() => {}}
        />,
      )
      expect(container.querySelector('.SliderValue')).not.toBeNull()
    })

    test('SliderValue shows the current numeric value', () => {
      let { container } = render(
        <DetailSlider
          fieldType='required'
          label='Test Label'
          value={42}
          setValue={() => {}}
        />,
      )
      let valueElement = container.querySelector('.SliderValue') as HTMLElement
      expect(valueElement.textContent).toBe('42')
    })

    test('SliderValue includes the unit when the unit prop is provided', () => {
      let { container } = render(
        <DetailSlider
          fieldType='required'
          label='Test Label'
          value={75}
          setValue={() => {}}
          unit='%'
        />,
      )
      let valueElement = container.querySelector('.SliderValue') as HTMLElement
      expect(valueElement.textContent).toBe('75 %')
    })

    test('SliderValue is not rendered when showValue is false', () => {
      let { container } = render(
        <DetailSlider
          fieldType='required'
          label='Test Label'
          value={50}
          setValue={() => {}}
          showValue={false}
        />,
      )
      expect(container.querySelector('.SliderValue')).toBeNull()
    })
  })

  /* -- SLIDER INPUT ATTRIBUTES -- */

  describe('Slider input attributes', () => {
    test('Renders an input of type range', () => {
      let { container } = render(
        <DetailSlider
          fieldType='required'
          label='Test Label'
          value={50}
          setValue={() => {}}
        />,
      )
      let input = container.querySelector('input') as HTMLInputElement
      expect(input.type).toBe('range')
    })

    test('Input reflects the minimum prop', () => {
      let { container } = render(
        <DetailSlider
          fieldType='required'
          label='Test Label'
          value={10}
          setValue={() => {}}
          minimum={5}
        />,
      )
      let input = container.querySelector('input') as HTMLInputElement
      expect(input.min).toBe('5')
    })

    test('Input reflects the maximum prop', () => {
      let { container } = render(
        <DetailSlider
          fieldType='required'
          label='Test Label'
          value={10}
          setValue={() => {}}
          maximum={200}
        />,
      )
      let input = container.querySelector('input') as HTMLInputElement
      expect(input.max).toBe('200')
    })

    test('Input reflects the step prop', () => {
      let { container } = render(
        <DetailSlider
          fieldType='required'
          label='Test Label'
          value={10}
          setValue={() => {}}
          step={5}
        />,
      )
      let input = container.querySelector('input') as HTMLInputElement
      expect(input.step).toBe('5')
    })

    test('Input is disabled when the disabled prop is true', () => {
      let { container } = render(
        <DetailSlider
          fieldType='required'
          label='Test Label'
          value={50}
          setValue={() => {}}
          disabled
        />,
      )
      let input = container.querySelector('input') as HTMLInputElement
      expect(input.disabled).toBe(true)
    })
  })

  /* -- ON CHANGE -- */

  describe('onChange behavior', () => {
    test('Changing the slider calls setValue with the parsed numeric value', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailSlider
          fieldType='required'
          label='Test Label'
          value={50}
          setValue={setValue}
        />,
      )
      let input = container.querySelector('input') as HTMLInputElement
      fireEvent.change(input, { target: { value: '75' } })
      expect(setValue).toHaveBeenCalledWith(75)
    })

    test('Changing the slider to a decimal step calls setValue with a float', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailSlider
          fieldType='required'
          label='Test Label'
          value={0}
          setValue={setValue}
          minimum={0}
          maximum={1}
          step={0.1}
        />,
      )
      let input = container.querySelector('input') as HTMLInputElement
      fireEvent.change(input, { target: { value: '0.5' } })
      expect(setValue).toHaveBeenCalledWith(0.5)
    })

    test('Changing the slider to the minimum value calls setValue with the minimum', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailSlider
          fieldType='required'
          label='Test Label'
          value={50}
          setValue={setValue}
          minimum={10}
        />,
      )
      let input = container.querySelector('input') as HTMLInputElement
      fireEvent.change(input, { target: { value: '10' } })
      expect(setValue).toHaveBeenCalledWith(10)
    })

    test('Changing the slider to the maximum value calls setValue with the maximum', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailSlider
          fieldType='required'
          label='Test Label'
          value={50}
          setValue={setValue}
          maximum={200}
        />,
      )
      let input = container.querySelector('input') as HTMLInputElement
      fireEvent.change(input, { target: { value: '200' } })
      expect(setValue).toHaveBeenCalledWith(200)
    })
  })

  /* -- OPTIONAL FIELD (NULL VALUE) -- */

  describe('Optional field with null value', () => {
    test('Renders without error when the optional value is null', () => {
      expect(() =>
        render(
          <DetailSlider
            fieldType='optional'
            label='Test Label'
            value={null}
            setValue={() => {}}
          />,
        ),
      ).not.toThrow()
    })

    test('SliderValue defaults to the minimum when the optional value is null', () => {
      let { container } = render(
        <DetailSlider
          fieldType='optional'
          label='Test Label'
          value={null}
          setValue={() => {}}
          minimum={20}
        />,
      )
      let valueElement = container.querySelector('.SliderValue') as HTMLElement
      expect(valueElement.textContent).toBe('20')
    })

    test('Changing the slider when the optional value is null calls setValue with a number', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailSlider
          fieldType='optional'
          label='Test Label'
          value={null}
          setValue={setValue}
          minimum={0}
          maximum={100}
        />,
      )
      let input = container.querySelector('input') as HTMLInputElement
      fireEvent.change(input, { target: { value: '60' } })
      expect(setValue).toHaveBeenCalledWith(60)
    })
  })

  /* -- VALUE CLAMPING -- */

  describe('Value clamping', () => {
    test('Value above the maximum is clamped to the maximum for display', () => {
      let { container } = render(
        <DetailSlider
          fieldType='required'
          label='Test Label'
          value={150}
          setValue={() => {}}
          maximum={100}
        />,
      )
      let valueElement = container.querySelector('.SliderValue') as HTMLElement
      expect(valueElement.textContent).toBe('100')
    })

    test('Value below the minimum is clamped to the minimum for display', () => {
      let { container } = render(
        <DetailSlider
          fieldType='required'
          label='Test Label'
          value={-10}
          setValue={() => {}}
          minimum={0}
        />,
      )
      let valueElement = container.querySelector('.SliderValue') as HTMLElement
      expect(valueElement.textContent).toBe('0')
    })
  })

  /* -- ERROR MESSAGE -- */

  describe('Error message', () => {
    test('Error message is not visible when errorMessage is not provided', () => {
      let { container } = render(
        <DetailSlider
          fieldType='required'
          label='Test Label'
          value={50}
          setValue={() => {}}
        />,
      )
      let errorEl = container.querySelector('.FieldErrorMessage') as HTMLElement
      expect(errorEl).toHaveClass('Hidden')
    })

    test('Error message is visible and displays the text when errorMessage is provided', () => {
      let { container } = render(
        <DetailSlider
          fieldType='required'
          label='Test Label'
          value={50}
          setValue={() => {}}
          errorMessage='Value out of range.'
        />,
      )
      let errorEl = container.querySelector('.FieldErrorMessage') as HTMLElement
      expect(errorEl).not.toHaveClass('Hidden')
      expect(errorEl.textContent).toBe('Value out of range.')
    })
  })
})
