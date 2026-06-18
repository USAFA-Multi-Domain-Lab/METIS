import { DetailLargeString } from '@client/components/content/form/DetailLargeString'
import { describe, expect, jest, test } from '@jest/globals'
import { fireEvent, render } from '@testing-library/react'

// Mock ButtonSvgPanel and its hooks to avoid the icons.ts import.meta dependency
// that is incompatible with the Jest transform environment.
jest.mock(
  '@client/components/content/user-controls/buttons/panels/ButtonSvgPanel',
  () => ({ __esModule: true, default: () => null }),
)
jest.mock(
  '@client/components/content/user-controls/buttons/panels/hooks',
  () => ({ __esModule: true, useButtonSvgEngine: () => ({}) }),
)

// Mock RichText to avoid Tiptap and global context dependencies.
// The mock renders a <textarea> that forwards DOM events to the
// onUpdate / onBlur callbacks using a minimal fake editor object.
jest.mock(
  '@client/components/content/general-layout/rich-text/RichText',
  () => ({
    __esModule: true,
    default: ({ options }: { options?: any }) => {
      const { className, content, onUpdate, onFocus, onBlur } = options ?? {}

      const buildEditor = (value: string) => ({
        getHTML: () => value,
        commands: { setContent: jest.fn() },
      })

      return (
        <textarea
          className={className}
          defaultValue={content}
          onChange={(event) => {
            if (onUpdate) {
              onUpdate({ editor: buildEditor(event.target.value) })
            }
          }}
          onFocus={(event) => {
            if (onFocus) {
              onFocus({ editor: buildEditor(event.target.value) })
            }
          }}
          onBlur={(event) => {
            if (onBlur) {
              onBlur({ editor: buildEditor(event.target.value) })
            }
          }}
        />
      )
    },
  }),
)

describe('DetailLargeString', () => {
  /* -- ON CHANGE -- */

  describe('onChange behavior', () => {
    test('Typing content calls setValue with the entered value', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailLargeString
          fieldType='required'
          label='Test Label'
          value=''
          setValue={setValue}
        />,
      )
      let textarea = container.querySelector('textarea') as HTMLTextAreaElement
      fireEvent.change(textarea, { target: { value: '<p>New content</p>' } })
      expect(setValue).toHaveBeenCalledWith('<p>New content</p>')
    })

    test('Clearing content calls setValue with an empty string', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailLargeString
          fieldType='required'
          label='Test Label'
          value='<p>Existing content</p>'
          setValue={setValue}
        />,
      )
      let textarea = container.querySelector('textarea') as HTMLTextAreaElement
      fireEvent.change(textarea, { target: { value: '' } })
      expect(setValue).toHaveBeenCalledWith('')
    })
  })

  /* -- ERROR DISPLAY -- */

  describe('Error display', () => {
    test('FieldErrorMessage is hidden before the user blurs', () => {
      let { container } = render(
        <DetailLargeString
          fieldType='required'
          label='Test Label'
          value=''
          setValue={() => {}}
        />,
      )
      let errorMessage = container.querySelector(
        '.FieldErrorMessage',
      ) as HTMLElement
      expect(errorMessage).toHaveClass('Hidden')
    })

    test('FieldErrorMessage is visible after focusing then blurring a required empty field', () => {
      let { container } = render(
        <DetailLargeString
          fieldType='required'
          label='Test Label'
          value=''
          setValue={() => {}}
        />,
      )
      let textarea = container.querySelector('textarea') as HTMLTextAreaElement
      // The blank-field error is only surfaced after the user has visited and
      // left the field.
      fireEvent.focus(textarea)
      fireEvent.blur(textarea)
      let errorMessage = container.querySelector(
        '.FieldErrorMessage',
      ) as HTMLElement
      expect(errorMessage).not.toHaveClass('Hidden')
    })

    test('FieldErrorMessage remains hidden when the field is blurred without first being focused', () => {
      let { container } = render(
        <DetailLargeString
          fieldType='required'
          label='Test Label'
          value=''
          setValue={() => {}}
        />,
      )
      let textarea = container.querySelector('textarea') as HTMLTextAreaElement
      fireEvent.blur(textarea)
      let errorMessage = container.querySelector(
        '.FieldErrorMessage',
      ) as HTMLElement
      expect(errorMessage).toHaveClass('Hidden')
    })

    test('FieldErrorMessage is visible when a custom errorMessage is provided', () => {
      let { container } = render(
        <DetailLargeString
          fieldType='required'
          label='Test Label'
          value='<p>Hello</p>'
          setValue={() => {}}
          errorMessage='Custom error.'
        />,
      )
      let textarea = container.querySelector('textarea') as HTMLTextAreaElement
      fireEvent.blur(textarea)
      let errorMessage = container.querySelector(
        '.FieldErrorMessage',
      ) as HTMLElement
      expect(errorMessage).not.toHaveClass('Hidden')
      expect(errorMessage.textContent).toBe('Custom error.')
    })
  })

  /* -- ON BLUR REPOPULATE -- */

  describe('onBlur repopulate behavior', () => {
    test('An empty required field repopulates with the defaultValue', () => {
      let setValue = jest.fn()
      render(
        <DetailLargeString
          fieldType='required'
          label='Test Label'
          value=''
          setValue={setValue}
          defaultValue='<p>Default content</p>'
        />,
      )
      expect(setValue).toHaveBeenCalledWith('<p>Default content</p>')
    })

    test('An empty required field with no defaultValue will get set to an empty string and will not repopulate with anything', () => {
      let setValue = jest.fn()
      render(
        <DetailLargeString
          fieldType='required'
          label='Test Label'
          value=''
          setValue={setValue}
          placeholder='Enter your text here...'
        />,
      )
      expect(setValue).toHaveBeenCalledWith('')
    })

    test('A non-empty required field does not repopulate', () => {
      let setValue = jest.fn()
      render(
        <DetailLargeString
          fieldType='required'
          label='Test Label'
          value='<p>Existing value</p>'
          setValue={setValue}
          defaultValue='<p>Default content</p>'
        />,
      )
      expect(setValue).not.toHaveBeenCalled()
    })
  })
})
