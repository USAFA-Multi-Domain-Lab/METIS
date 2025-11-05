import { EditorEvents } from '@tiptap/react'
import { compute } from 'metis/client/toolbox'
import { useState } from 'react'
import { TDetailWithInput_P } from '.'
import Tooltip from '../communication/Tooltip'
import RichText from '../general-layout/rich-text/RichText'
import ButtonSvgPanel from '../user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '../user-controls/buttons/panels/hooks'
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
  value: stateValue,
  setValue: setState,
  // Optional Properties
  defaultValue = undefined,
  errorMessage = 'At least one character is required here.',
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
    let classList: string[] = ['Field']

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
    <div className={rootClassName}>
      <div className='TitleRow'>
        <div className='TitleColumnOne'>
          <div className={labelClassName}>{label}</div>
          <sup className={infoClassName}>
            i
            <Tooltip description={tooltipDescription} />
          </sup>
          <a href='/files/shortcuts.pdf' target='_blank' className='Shortcuts'>
            <ButtonSvgPanel engine={buttonEngine} />
          </a>
        </div>
        <div className={`TitleColumnTwo ${optionalClassName}`}>optional</div>
      </div>
      <RichText
        options={{
          content: stateValue,
          className: fieldClassName,
          placeholder,
          onUpdate,
          onBlur,
        }}
      />
      <div className={fieldErrorClassName}>{errorMessage}</div>
    </div>
  )
}

/* ---------------------------- TYPES FOR DETAIL LARGE STRING ---------------------------- */

/**
 * The properties for the Detail Large String component.
 */
type TDetailLargeString_P = TDetailWithInput_P<string>
