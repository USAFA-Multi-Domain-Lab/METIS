import { DetailString } from '@client/components/content/form/DetailString'
import { describe, expect, jest, test } from '@jest/globals'
import { fireEvent, render } from '@testing-library/react'

describe('DetailString', () => {
  /* -- ROOT CLASS NAMES -- */

  describe('Root class names', () => {
    test('Root has "Detail" and "DetailString" classes', () => {
      let { container } = render(
        <DetailString
          fieldType='required'
          handleOnBlur='none'
          label='Test Label'
          value='Test'
          setValue={() => {}}
        />,
      )
      let root = container.firstChild as HTMLElement
      expect(root).toHaveClass('Detail')
      expect(root).toHaveClass('DetailString')
    })

    test('Root has "Disabled" class when disabled', () => {
      let { container } = render(
        <DetailString
          fieldType='required'
          handleOnBlur='none'
          label='Test Label'
          value='Test'
          setValue={() => {}}
          disabled
        />,
      )
      let root = container.firstChild as HTMLElement
      expect(root).toHaveClass('Disabled')
    })

    test('Root does not have "Disabled" class when not disabled', () => {
      let { container } = render(
        <DetailString
          fieldType='required'
          handleOnBlur='none'
          label='Test Label'
          value='Test'
          setValue={() => {}}
        />,
      )
      let root = container.firstChild as HTMLElement
      expect(root).not.toHaveClass('Disabled')
    })
  })

  /* -- PASSWORD FIELD BEHAVIOR -- */

  describe('Password input type', () => {
    test('Field has "Password" class when inputType is "password"', () => {
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
      let field = container.querySelector('.Field') as HTMLElement
      expect(field).toHaveClass('Password')
    })

    test('Field does not have "Password" class when inputType is "text"', () => {
      let { container } = render(
        <DetailString
          fieldType='required'
          handleOnBlur='none'
          label='Test Label'
          value='Test'
          setValue={() => {}}
          inputType='text'
        />,
      )
      let field = container.querySelector('.Field') as HTMLElement
      expect(field).not.toHaveClass('Password')
    })

    test('Field does not have "Password" class by default', () => {
      let { container } = render(
        <DetailString
          fieldType='required'
          handleOnBlur='none'
          label='Test Label'
          value='Test'
          setValue={() => {}}
        />,
      )
      let field = container.querySelector('.Field') as HTMLElement
      expect(field).not.toHaveClass('Password')
    })
  })

  /* -- TOGGLE PASSWORD BUTTON -- */

  describe('Toggle password button', () => {
    test('Toggle button has "Hidden" class when inputType is "text"', () => {
      let { container } = render(
        <DetailString
          fieldType='required'
          handleOnBlur='none'
          label='Test Label'
          value='Test'
          setValue={() => {}}
          inputType='text'
        />,
      )
      let toggleButton = container.querySelector(
        '.TogglePasswordButton',
      ) as HTMLElement
      expect(toggleButton).toHaveClass('Hidden')
    })

    test('Toggle button does not have "Hidden" class when inputType is "password"', () => {
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
      ) as HTMLElement
      expect(toggleButton).not.toHaveClass('Hidden')
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
      let input = container.querySelector('.Input') as HTMLElement
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
      let input = container.querySelector('.Input') as HTMLElement
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
      let input = container.querySelector('.Input') as HTMLElement
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
      let input = container.querySelector('.Input') as HTMLElement
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
      let input = container.querySelector('.Input') as HTMLInputElement
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
      let input = container.querySelector('.Input') as HTMLInputElement
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
      let { container } = render(
        <DetailString
          fieldType='required'
          handleOnBlur='none'
          label='Test Label'
          value='Hello'
          setValue={() => {}}
          maxLength={10}
        />,
      )
      let counter = container.querySelector('.CharacterCount') as HTMLElement
      expect(counter).not.toBeNull()
      expect(counter.textContent).toBe('5/10')
    })

    test('Character count is not rendered when maxLength is not provided', () => {
      let { container } = render(
        <DetailString
          fieldType='required'
          handleOnBlur='none'
          label='Test Label'
          value='Hello'
          setValue={() => {}}
        />,
      )
      expect(container.querySelector('.CharacterCount')).toBeNull()
    })
  })
})
