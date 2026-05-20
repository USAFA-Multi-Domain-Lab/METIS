import { DetailString } from '@client/components/content/form/DetailString'
import { describe, expect, jest, test } from '@jest/globals'
import { fireEvent, render } from '@testing-library/react'

describe('DetailString', () => {
  /* -- ON CHANGE -- */

  describe('onChange behavior', () => {
    test('Typing in the input calls setValue with the new value', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailString
          fieldType='required'
          handleOnBlur='none'
          label='Test Label'
          value=''
          setValue={setValue}
        />,
      )
      let input = container.querySelector('input') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'Hello' } })
      expect(setValue).toHaveBeenCalledWith('Hello')
    })
  })

  /* -- HANDLE ON BLUR BEHAVIOR -- */

  describe('handleOnBlur behavior', () => {
    test('Blurring an empty required field with "deliverError" shows the error message', () => {
      let { container } = render(
        <DetailString
          fieldType='required'
          handleOnBlur='deliverError'
          label='Test Label'
          value=''
          setValue={() => {}}
        />,
      )
      let input = container.querySelector('input') as HTMLElement
      fireEvent.blur(input)
      let fieldError = container.querySelector(
        '.FieldErrorMessage',
      ) as HTMLElement
      expect(fieldError).not.toHaveClass('Hidden')
    })

    test('Blurring a non-empty required field with "deliverError" does not show the error message', () => {
      let { container } = render(
        <DetailString
          fieldType='required'
          handleOnBlur='deliverError'
          label='Test Label'
          value='Some value'
          setValue={() => {}}
        />,
      )
      let input = container.querySelector('input') as HTMLElement
      fireEvent.blur(input)
      let fieldError = container.querySelector(
        '.FieldErrorMessage',
      ) as HTMLElement
      expect(fieldError).toHaveClass('Hidden')
    })

    test('Blurring an empty required field with "repopulateValue" calls setValue with the defaultValue', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailString
          fieldType='required'
          handleOnBlur='repopulateValue'
          label='Test Label'
          value=''
          setValue={setValue}
          defaultValue='fallback'
        />,
      )
      let input = container.querySelector('input') as HTMLElement
      fireEvent.blur(input)
      expect(setValue).toHaveBeenCalledWith('fallback')
    })

    test('Blurring a field with "none" does not call setValue', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailString
          fieldType='required'
          handleOnBlur='none'
          label='Test Label'
          value=''
          setValue={setValue}
        />,
      )
      let input = container.querySelector('input') as HTMLElement
      fireEvent.blur(input)
      expect(setValue).not.toHaveBeenCalled()
    })
  })

  /* -- PASSWORD TOGGLE INTERACTION -- */

  describe('Password toggle interaction', () => {
    test('Clicking the toggle button changes the input type from "password" to "text"', () => {
      let { container } = render(
        <DetailString
          fieldType='required'
          handleOnBlur='none'
          label='Test Label'
          value=''
          setValue={() => {}}
          inputType='password'
        />,
      )
      let toggleButton = container.querySelector(
        '.TogglePasswordButton',
      ) as HTMLInputElement
      let input = container.querySelector(
        'input:not([type="button"])',
      ) as HTMLInputElement
      expect(input.type).toBe('password')
      fireEvent.click(toggleButton)
      expect(input.type).toBe('text')
    })

    test('Clicking the toggle button a second time restores the input type to "password"', () => {
      let { container } = render(
        <DetailString
          fieldType='required'
          handleOnBlur='none'
          label='Test Label'
          value=''
          setValue={() => {}}
          inputType='password'
        />,
      )
      let toggleButton = container.querySelector(
        '.TogglePasswordButton',
      ) as HTMLInputElement
      fireEvent.click(toggleButton)
      fireEvent.click(toggleButton)
      let input = container.querySelector(
        'input:not([type="button"])',
      ) as HTMLInputElement
      expect(input.type).toBe('password')
    })

    test('Toggle button text changes to "hide" after revealing the password', () => {
      let { container } = render(
        <DetailString
          fieldType='required'
          handleOnBlur='none'
          label='Test Label'
          value=''
          setValue={() => {}}
          inputType='password'
        />,
      )
      let toggleButton = container.querySelector(
        '.TogglePasswordButton',
      ) as HTMLInputElement
      expect(toggleButton.value).toBe('show')
      fireEvent.click(toggleButton)
      expect(toggleButton.value).toBe('hide')
    })
  })

  /* -- CHARACTER COUNT -- */

  describe('Character count', () => {
    test('Character count is rendered when maxLength is provided', () => {
      let { getByText } = render(
        <DetailString
          fieldType='required'
          handleOnBlur='none'
          label='Test Label'
          value='Hello'
          setValue={() => {}}
          maxLength={10}
        />,
      )
      expect(getByText('5/10')).toBeTruthy()
    })

    test('Character count is not rendered when maxLength is not provided', () => {
      let { queryByText } = render(
        <DetailString
          fieldType='required'
          handleOnBlur='none'
          label='Test Label'
          value='Hello'
          setValue={() => {}}
        />,
      )
      expect(queryByText('5/10')).toBeNull()
    })
  })
})
