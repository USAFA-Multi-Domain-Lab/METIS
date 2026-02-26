import { DetailLocked } from '@client/components/content/form/DetailLocked'
import { describe, expect, test } from '@jest/globals'
import { render } from '@testing-library/react'

describe('DetailLocked', () => {
  /* -- ROOT CLASS NAMES -- */

  describe('Root class names', () => {
    test('Root has "Detail" and "DetailLocked" classes', () => {
      let { container } = render(
        <DetailLocked label='Test Label' value='Test Value' />,
      )
      let root = container.firstChild as HTMLElement
      expect(root).toHaveClass('Detail')
      expect(root).toHaveClass('DetailLocked')
    })

    test('Root has "Disabled" class when disabled', () => {
      let { container } = render(
        <DetailLocked label='Test Label' value='Test Value' disabled />,
      )
      let root = container.firstChild as HTMLElement
      expect(root).toHaveClass('Disabled')
    })

    test('Root does not have "Disabled" class when not disabled', () => {
      let { container } = render(
        <DetailLocked label='Test Label' value='Test Value' />,
      )
      let root = container.firstChild as HTMLElement
      expect(root).not.toHaveClass('Disabled')
    })
  })

  /* -- VALUE DISPLAY -- */

  describe('Value display', () => {
    test('Displays the provided value string', () => {
      let { container } = render(
        <DetailLocked label='Test Label' value='Locked Content' />,
      )
      let text = container.querySelector('.Text') as HTMLElement
      expect(text).not.toBeNull()
      expect(text.textContent).toBe('Locked Content')
    })

    test('Displays an empty string when value is empty', () => {
      let { container } = render(<DetailLocked label='Test Label' value='' />)
      let text = container.querySelector('.Text') as HTMLElement
      expect(text).not.toBeNull()
      expect(text.textContent).toBe('')
    })
  })

  /* -- ERROR DISPLAY -- */

  describe('Error display', () => {
    test('FieldErrorMessage is hidden when no errorMessage is provided', () => {
      let { container } = render(
        <DetailLocked label='Test Label' value='Test Value' />,
      )
      let errorMessage = container.querySelector(
        '.FieldErrorMessage',
      ) as HTMLElement
      expect(errorMessage).toHaveClass('Hidden')
    })

    test('FieldErrorMessage is visible when errorMessage is provided', () => {
      let { container } = render(
        <DetailLocked
          label='Test Label'
          value='Test Value'
          errorMessage='Something went wrong.'
        />,
      )
      let errorMessage = container.querySelector(
        '.FieldErrorMessage',
      ) as HTMLElement
      expect(errorMessage).not.toHaveClass('Hidden')
    })

    test('FieldErrorMessage renders the errorMessage text', () => {
      let { container } = render(
        <DetailLocked
          label='Test Label'
          value='Test Value'
          errorMessage='Invalid value.'
        />,
      )
      let errorMessage = container.querySelector(
        '.FieldErrorMessage',
      ) as HTMLElement
      expect(errorMessage.textContent).toBe('Invalid value.')
    })

    test('Field has "Error" class when errorMessage is provided', () => {
      let { container } = render(
        <DetailLocked
          label='Test Label'
          value='Test Value'
          errorMessage='Something went wrong.'
        />,
      )
      let field = container.querySelector('.Field') as HTMLElement
      expect(field).toHaveClass('Error')
    })

    test('Field does not have "Error" class when no errorMessage is provided', () => {
      let { container } = render(
        <DetailLocked label='Test Label' value='Test Value' />,
      )
      let field = container.querySelector('.Field') as HTMLElement
      expect(field).not.toHaveClass('Error')
    })

    test('FieldErrorMessage has "Warning" class when errorType is "warning"', () => {
      let { container } = render(
        <DetailLocked
          label='Test Label'
          value='Test Value'
          errorMessage='Check this value.'
          errorType='warning'
        />,
      )
      let errorMessage = container.querySelector(
        '.FieldErrorMessage',
      ) as HTMLElement
      expect(errorMessage).toHaveClass('Warning')
    })
  })
})
