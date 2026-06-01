import { DetailLocked } from '@client/components/content/form/DetailLocked'
import { describe, expect, test } from '@jest/globals'
import { render } from '@testing-library/react'

describe('DetailLocked', () => {
  /* -- VALUE DISPLAY -- */

  describe('Value display', () => {
    test('Displays the provided value string', () => {
      let { getByText } = render(
        <DetailLocked label='Test Label' value='Locked Content' />,
      )
      expect(getByText('Locked Content')).toBeTruthy()
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
  })
})
