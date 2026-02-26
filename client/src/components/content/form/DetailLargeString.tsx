import { compute } from '@client/toolbox'
import type { EditorEvents } from '@tiptap/react'
import { useState } from 'react'
import type { TDetailWithInput_P } from '.'
import RichText from '../general-layout/rich-text/RichText'
import ButtonSvgPanel from '../user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '../user-controls/buttons/panels/hooks'
import './DetailLargeString.scss'
import DetailTitleRow from './DetailTitleRow'
import { useDetailClassNames } from './useDetailClassNames'

const DEFAULT_ERROR_MESSAGE: string = 'At least one character is required here.'

/**
 * This will render a detail for
 * a form, with a label and a text
 * field for entering information.
 */
export function DetailLargeString({
  fieldType,
  handleOnBlur,
  label,
  value: stateValue,
  setValue: setState,
  // Optional Properties
  defaultValue = undefined,
  errorMessage = DEFAULT_ERROR_MESSAGE,
  errorType = 'default',
  disabled = false,
  uniqueLabelClassName = undefined,
  uniqueFieldClassName = undefined,
  placeholder = 'Enter text here...',
  tooltipDescription = '',
}: TDetailLargeString_P): TReactElement | null {
  /* -- STATE -- */
  const [leftField, setLeftField] = useState<boolean>(false)
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
  /**
   * The boolean that determines if the
   * error message should be displayed.
   */
  const displayError: boolean = compute(() => {
    let display: boolean = false

    if (
      errorType === 'default' &&
      leftField &&
      handleOnBlur === 'deliverError' &&
      errorMessage !== DEFAULT_ERROR_MESSAGE
    ) {
      display = true
    }

    if (
      errorType === 'warning' &&
      leftField &&
      handleOnBlur === 'deliverError' &&
      errorMessage !== DEFAULT_ERROR_MESSAGE
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
      errorMessage === DEFAULT_ERROR_MESSAGE &&
      !stateValue
    ) {
      display = true
    }

    // Return the boolean.
    return display
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
  const onBlur = ({ editor }: EditorEvents['blur']) => {
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
  }

  /* -- RENDER -- */

  return (
    <div className={rootClasses.value}>
      <DetailTitleRow
        label={label}
        labelClassName={labelClasses.value}
        tooltipDescription={tooltipDescription}
        fieldType={fieldType}
      >
        <a href='/files/shortcuts.pdf' target='_blank' className='Shortcuts'>
          <ButtonSvgPanel engine={buttonEngine} />
        </a>
      </DetailTitleRow>
      <RichText
        options={{
          content: stateValue,
          className: fieldClasses.value,
          placeholder,
          onUpdate,
          onBlur,
          editable: !disabled,
        }}
      />
      <div className={fieldErrorClasses.value}>{errorMessage}</div>
    </div>
  )
}

/* ---------------------------- TYPES FOR DETAIL LARGE STRING ---------------------------- */

/**
 * The properties for the Detail Large String component.
 */
type TDetailLargeString_P = TDetailWithInput_P<string>
