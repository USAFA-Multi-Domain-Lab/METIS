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
      const { className, content, onUpdate, onBlur } = options ?? {}

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
  /* -- ROOT CLASS NAMES -- */

  describe('Root class names', () => {
    test('Root has "Detail" and "DetailLargeString" classes', () => {
      let { container } = render(
        <DetailLargeString
          fieldType='required'
          handleOnBlur='none'
          label='Test Label'
          value='<p>Hello</p>'
          setValue={() => {}}
        />,
      )
      let root = container.firstChild as HTMLElement
      expect(root).toHaveClass('Detail')
      expect(root).toHaveClass('DetailLargeString')
    })

    test('Root has "Disabled" class when disabled', () => {
      let { container } = render(
        <DetailLargeString
          fieldType='required'
          handleOnBlur='none'
          label='Test Label'
          value='<p>Hello</p>'
          setValue={() => {}}
          disabled
        />,
      )
      let root = container.firstChild as HTMLElement
      expect(root).toHaveClass('Disabled')
    })

    test('Root does not have "Disabled" class when not disabled', () => {
      let { container } = render(
        <DetailLargeString
          fieldType='required'
          handleOnBlur='none'
          label='Test Label'
          value='<p>Hello</p>'
          setValue={() => {}}
        />,
      )
      let root = container.firstChild as HTMLElement
      expect(root).not.toHaveClass('Disabled')
    })
  })

  /* -- ON CHANGE -- */

  describe('onChange behavior', () => {
    test('Typing content calls setValue with the entered value', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailLargeString
          fieldType='required'
          handleOnBlur='none'
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
          handleOnBlur='none'
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
          handleOnBlur='deliverError'
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

    test('FieldErrorMessage is visible after blur on a required empty field with deliverError', () => {
      let { container } = render(
        <DetailLargeString
          fieldType='required'
          handleOnBlur='deliverError'
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
      expect(errorMessage).not.toHaveClass('Hidden')
    })

    test('FieldErrorMessage remains hidden after blur when handleOnBlur is "none"', () => {
      let { container } = render(
        <DetailLargeString
          fieldType='required'
          handleOnBlur='none'
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

    test('FieldErrorMessage is visible after blur when a custom errorMessage is provided with deliverError', () => {
      let { container } = render(
        <DetailLargeString
          fieldType='required'
          handleOnBlur='deliverError'
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

    test('FieldErrorMessage has "Warning" class when errorType is "warning"', () => {
      let { container } = render(
        <DetailLargeString
          fieldType='required'
          handleOnBlur='deliverError'
          label='Test Label'
          value=''
          setValue={() => {}}
          errorType='warning'
          errorMessage='Check this.'
        />,
      )
      let textarea = container.querySelector('textarea') as HTMLTextAreaElement
      fireEvent.blur(textarea)
      let errorMessage = container.querySelector(
        '.FieldErrorMessage',
      ) as HTMLElement
      expect(errorMessage).toHaveClass('Warning')
    })
  })

  /* -- ON BLUR REPOPULATE -- */

  describe('onBlur repopulate behavior', () => {
    test('Blurring an empty required field with repopulateValue calls setValue with the defaultValue', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailLargeString
          fieldType='required'
          handleOnBlur='repopulateValue'
          label='Test Label'
          value=''
          setValue={setValue}
          defaultValue='<p>Default content</p>'
        />,
      )
      let textarea = container.querySelector('textarea') as HTMLTextAreaElement
      fireEvent.blur(textarea)
      expect(setValue).toHaveBeenCalledWith('<p>Default content</p>')
    })

    test('Blurring an empty required field with repopulateValue and no defaultValue calls setValue with the placeholder', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailLargeString
          fieldType='required'
          handleOnBlur='repopulateValue'
          label='Test Label'
          value=''
          setValue={setValue}
          placeholder='Enter your text here...'
        />,
      )
      let textarea = container.querySelector('textarea') as HTMLTextAreaElement
      fireEvent.blur(textarea)
      expect(setValue).toHaveBeenCalledWith('Enter your text here...')
    })

    test('Blurring a non-empty required field with repopulateValue does not repopulate', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailLargeString
          fieldType='required'
          handleOnBlur='repopulateValue'
          label='Test Label'
          value='<p>Existing value</p>'
          setValue={setValue}
          defaultValue='<p>Default content</p>'
        />,
      )
      let textarea = container.querySelector('textarea') as HTMLTextAreaElement
      fireEvent.blur(textarea)
      expect(setValue).not.toHaveBeenCalled()
    })
  })
})
