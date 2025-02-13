import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { Editor, EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useState } from 'react'
import 'react-quill/dist/quill.snow.css'
import { useGlobalContext } from 'src/context'
import { compute } from 'src/toolbox'
import { TDetailWithInput_P } from '.'
import Tooltip from '../communication/Tooltip'
import { TButtonSvgType } from '../user-controls/buttons/ButtonSvg'
import ButtonSvgPanel_v2 from '../user-controls/buttons/ButtonSvgPanel_v2'
import './DetailLargeString.scss'

/**
 * This will render a detail for
 * a form, with a label and a text
 * field for entering information.
 */
export function DetailLargeString({
  fieldType,
  handleOnBlur,
  label,
  stateValue,
  setState,
  // Optional Properties
  defaultValue = undefined,
  errorMessage = 'At least one character is required here.',
  disabled = false,
  uniqueLabelClassName = undefined,
  uniqueFieldClassName = undefined,
  placeholder = 'Enter text here...',
  tooltipDescription = '',
}: TDetailLargeString_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { prompt } = useGlobalContext().actions

  /* -- STATE -- */
  const [leftField, setLeftField] = useState<boolean>(false)

  /* -- COMPUTED -- */
  /**
   * The boolean that determines if the
   * error message should be displayed.
   */
  const displayError: boolean = compute(() => {
    let display: boolean = false

    // If the user has left the field and the
    // field is required and the error message
    // should be delivered, then display the error.
    if (
      leftField &&
      fieldType === 'required' &&
      handleOnBlur === 'deliverError' &&
      errorMessage !== 'At least one character is required here.'
    ) {
      display = true
    }

    // If the user has left the field and the
    // field is required and the error message
    // should be delivered and the field is empty,
    // then display the default error message.
    if (
      leftField &&
      fieldType === 'required' &&
      handleOnBlur === 'deliverError' &&
      errorMessage === 'At least one character is required here.' &&
      !stateValue
    ) {
      display = true
    }

    // Return the boolean.
    return display
  })
  /**
   * The root class name for the detail.
   */
  const rootClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Detail', 'DetailLargeString']

    // If disabled is true then add the
    // disabled class name.
    if (disabled) {
      classList.push('Disabled')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the label.
   */
  const labelClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Label']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueLabelClassName) {
      classList.push(uniqueLabelClassName)
    }

    // If displayError is true then
    // add the error class name.
    if (displayError) {
      classList.push('Error')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the input field.
   */
  const fieldClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Field', 'FieldLargeString']

    // If the error message is displayed
    // then add the error class name.
    if (displayError) {
      classList.push('Error')
    }

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueFieldClassName) {
      classList.push(uniqueFieldClassName)
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * Class name for the error message field.
   */
  const fieldErrorClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['FieldErrorMessage']

    // Hide the error message if the
    // displayError is false.
    if (!displayError) {
      classList.push('Hidden')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the optional text.
   */
  const optionalClassName: string = compute(() =>
    fieldType === 'optional' ? 'Optional' : 'Hidden',
  )
  /**
   * The class name for the info icon.
   */
  const infoClassName: string = compute(() =>
    tooltipDescription ? 'DetailInfo' : 'Hidden',
  )
  /**
   * The boolean that determines if the field
   * should be repopulated with the default value.
   */
  const shouldRepopulate: boolean = compute(
    () =>
      !displayError &&
      handleOnBlur === 'repopulateValue' &&
      fieldType === 'required',
  )
  /**
   * Determines how to group the toolbar buttons.
   */
  const toolbarGroupings: Array<TButtonSvgType[]> = [
    ['undo', 'redo'],
    ['ordered-list', 'unordered-list'],
    ['bold', 'italic', 'underline', 'strike'],
    ['code', 'code-block', 'link'],
  ]

  /* -- FUNCTIONS -- */

  /**
   * Determines if the html content is empty.
   * @param value The html content to check.
   * @returns True if the html content is empty.
   */
  const checkForEmptyHtmlContent = (value: string): boolean => {
    const strippedContent = value.replace(/<[^>]*>/g, '') // Remove HTML tags
    const emptyHtmlContentRegex = /^\s*$/
    return emptyHtmlContentRegex.test(strippedContent)
  }

  /**
   * Toggles the link extension.
   * @param editor The editor instance.
   */
  const toggleLink = async (editor: Editor) => {
    // Get the previous URL if it exists.
    const prevUrl = editor.getAttributes('link').href
    // Prompt the user for a URL.
    const { choice, text: url } = await prompt('', ['Cancel', 'Submit'], {
      textField: {
        boundChoices: ['Submit'],
        label: 'URL',
        initialValue: prevUrl,
      },
      defaultChoice: 'Submit',
    })
    // Set the link.
    if (choice === 'Submit') {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run()
    }
  }

  /**
   * Handles the button click event for the toolbar.
   * @param button The button that was clicked.
   * @param editor The editor instance.
   */
  const handleToolbarButtonClick = (button: TButtonSvgType, editor: Editor) => {
    switch (button) {
      case 'undo':
        editor.chain().focus().undo().run()
        break
      case 'redo':
        editor.chain().focus().redo().run()
        break
      case 'ordered-list':
        editor.chain().focus().toggleOrderedList().run()
        break
      case 'unordered-list':
        editor.chain().focus().toggleBulletList().run()
        break
      case 'bold':
        editor.chain().focus().toggleBold().run()
        break
      case 'italic':
        editor.chain().focus().toggleItalic().run()
        break
      case 'underline':
        editor.chain().focus().toggleUnderline().run()
        break
      case 'strike':
        editor.chain().focus().toggleStrike().run()
        break
      case 'code':
        editor.chain().focus().toggleCode().run()
        break
      case 'code-block':
        editor.chain().focus().toggleCodeBlock().run()
        break
      case 'link':
        toggleLink(editor)
        break
    }
  }

  /* -- HOOKS -- */

  /**
   * The rich text editor.
   */
  const editor = useEditor({
    content: stateValue,
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: placeholder,
      }),
      Link.configure({
        defaultProtocol: 'https',
        protocols: ['http', 'https'],
        openOnClick: false,
      }),
    ],
    onUpdate({ editor }) {
      const value = editor.getHTML()
      const isEmptyContent = checkForEmptyHtmlContent(value)
      // Updates the parent component's state value
      // and ensures that invalid empty values don't
      // get saved to the database.
      isEmptyContent ? setState('') : setState(value)
    },
    onBlur({ editor }) {
      const value: string = editor.getHTML()
      const isEmptyContent = checkForEmptyHtmlContent(value)
      let { setContent } = editor.commands

      // Indicate that the user has left the field.
      // @note - This allows errors to be displayed.
      setLeftField(true)

      if (isEmptyContent && shouldRepopulate) {
        // Update the parent component's state value
        // and the editor's value (ensures both values
        // are in sync without the need for a re-render).
        if (!!defaultValue) {
          setState(defaultValue)
          setContent(defaultValue)
        } else {
          setState(placeholder)
          setContent(placeholder)
        }
      }
    },
  })

  /* -- RENDER -- */

  return (
    <div className={rootClassName}>
      <div className='TitleRow'>
        <div className='TitleColumnOne'>
          <div className={labelClassName}>{label}</div>
          <sup className={infoClassName}>
            i
            <Tooltip description={tooltipDescription} />
          </sup>
        </div>
        <div className={`TitleColumnTwo ${optionalClassName}`}>optional</div>
      </div>

      {editor && (
        <div className='Toolbar'>
          {toolbarGroupings.map((grouping, index) => (
            <ButtonSvgPanel_v2
              key={index} // todo: fix this to not use the index.
              buttons={grouping}
              onButtonClick={(button) =>
                handleToolbarButtonClick(button, editor)
              }
            />
          ))}
        </div>
      )}
      <EditorContent editor={editor} className={fieldClassName} />

      <div className={fieldErrorClassName}>{errorMessage}</div>
    </div>
  )
}

/* ---------------------------- TYPES FOR DETAIL LARGE STRING ---------------------------- */

/**
 * The properties for the Detail Large String component.
 */
type TDetailLargeString_P = TDetailWithInput_P<string>
