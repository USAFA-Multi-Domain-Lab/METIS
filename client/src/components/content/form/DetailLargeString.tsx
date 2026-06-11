import type { Editor, EditorEvents } from '@tiptap/react'
import { useRef, useState } from 'react'
import type { TDetailWithInput_P } from '.'
import RichText from '../general-layout/rich-text/RichText'
import ButtonSvgPanel from '../user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '../user-controls/buttons/panels/hooks'
import './DetailLargeString.scss'
import DetailTitleRow from './DetailTitleRow'
import { useDefaultValue } from './hooks/useDefaultValue'
import { useDetailClassNames } from './hooks/useDetailClassNames'
import { useErrorMessages } from './hooks/useErrorMessages'

const BLANK_ERROR_MESSAGE: string = 'At least one character is required here.'

/**
 * This will render a detail for
 * a form, with a label and a text
 * field for entering information.
 */
export function DetailLargeString({
  fieldType,
  label,
  value: stateValue,
  setValue: setState,
  // Optional Properties
  defaultValue = '',
  errorMessage = '',
  errorType = 'default',
  disabled = false,
  uniqueLabelClassName = undefined,
  uniqueFieldClassName = undefined,
  placeholder = 'Enter text here...',
  tooltipDescription = '',
}: TDetailLargeString_P): TReactElement | null {
  /* -- STATE -- */

  const [focused, setFocused] = useState<boolean>(false)
  const editorRef = useRef<Editor | null>(null)
  const buttonEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'file',
        type: 'button',
        icon: 'file',
        description: 'Click here to view the shortcuts for this editor.',
      },
    ],
  })

  /* -- COMPUTED -- */
  let { displayError, activeErrorMessage } = useErrorMessages({
    errorMessage,
    fieldType,
    inputValue: stateValue,
    focused,
    blankErrorMessage: BLANK_ERROR_MESSAGE,
  })
  const { rootClasses, labelClasses, fieldClasses, fieldErrorClasses } =
    useDetailClassNames({
      componentName: 'DetailLargeString',
      disabled,
      displayError,
      errorType,
      uniqueLabelClassName,
      uniqueFieldClassName,
    })

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
   * Handles the update event for the editor.
   * @param editor The editor instance.
   */
  const onUpdate = ({ editor }: EditorEvents['update']) => {
    const value = editor.getHTML()
    const isEmptyContent = checkForEmptyHtmlContent(value)
    // Updates the parent component's state value
    // and ensures that invalid empty values don't
    // get saved to the database.
    isEmptyContent ? setState('') : setState(value)
  }

  /**
   * Handles the blur event for the editor.
   * @param editor The editor instance.
   */
  const onBlur = () => {
    setFocused(false)
  }

  /* -- EFFECTS -- */

  useDefaultValue({
    fieldType,
    stateValue,
    setState,
    defaultValue,
    focused,
    // When the default value is applied, we also need
    // to refresh the content in the editor to reflect
    // the new state value.
    onApply: (value) => editorRef.current?.commands.setContent(value),
  })

  /* -- RENDER -- */

  return (
    <div className={rootClasses.value}>
      <DetailTitleRow
        label={label}
        labelClassName={labelClasses.value}
        tooltipDescription={tooltipDescription}
        fieldType={fieldType}
      >
        <a href='/files/shortcuts.html' target='_blank' className='Shortcuts'>
          <ButtonSvgPanel engine={buttonEngine} />
        </a>
      </DetailTitleRow>
      <RichText
        options={{
          content: stateValue,
          className: fieldClasses.value,
          placeholder,
          editorRef,
          onUpdate,
          onFocus: () => setFocused(true),
          onBlur,
          editable: !disabled,
        }}
      />
      <div className={fieldErrorClasses.value}>{activeErrorMessage}</div>
    </div>
  )
}

/* ---------------------------- TYPES FOR DETAIL LARGE STRING ---------------------------- */

/**
 * The properties for the Detail Large String component.
 */
type TDetailLargeString_P = TDetailWithInput_P<string>
