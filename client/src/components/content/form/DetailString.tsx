import { compute } from 'metis/client/toolbox'
import { useState } from 'react'
import { TDetailWithInput_P } from '.'
import Tooltip from '../communication/Tooltip'
import './DetailString.scss'

/**
 * This will render a detail for
 * a form, with a label and a text
 * field for entering information.
 */
export function DetailString({
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
  inputType = 'text',
  placeholder = 'Enter text here...',
  tooltipDescription = '',
  maxLength = undefined,
}: TDetailString_P): TReactElement {
  /* -- STATE -- */
  const [leftField, setLeftField] = useState<boolean>(false)
  const [currentInputType, setCurrentInputType] = useState<TInput>(inputType)
  const [displayPasswordText, setDisplayPasswordText] = useState<
    'show' | 'hide'
  >('show')

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
      stateValue === ''
    ) {
      display = true
    }

    // Return the boolean.
    return display
  })
  /**
   * The class name for the detail.
   */
  const rootClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Detail', 'DetailString']

    // If disabled is true then add the
    // disabled class name.
    if (disabled) {
      classList.push('Disabled')
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
   * Class name for the label.
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
   * Class name for the input field.
   */
  const fieldClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Field']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueFieldClassName) {
      classList.push(uniqueFieldClassName)
    }

    // If the input type is password then
    // add the password class name.
    if (inputType === 'password') {
      classList.push('Password')
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
   * Class name for the toggle password display container.
   * @note Appears as a button with the text "show" or "hide".
   */
  const togglePasswordButtonClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['TogglePasswordButton']

    // If the input type is not "password" then
    // add the hidden class name.
    if (inputType !== 'password') {
      classList.push('Hidden')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The placeholder text being displayed.
   */
  const placeholderDisplayed: string = compute(() => {
    let placeholderText: string = placeholder

    if (inputType === 'password' && placeholder === 'Enter text here...') {
      placeholderText = 'Enter password here...'
    }

    return placeholderText
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

  /* -- FUNCTIONS -- */

  /**
   * Toggles the display of the password.
   */
  const togglePasswordDisplay = (): void => {
    if (currentInputType === 'password') {
      setCurrentInputType('text')
      setDisplayPasswordText('hide')
    } else {
      setCurrentInputType('password')
      setDisplayPasswordText('show')
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
        </div>
        <div className={`TitleColumnTwo ${optionalClassName}`}>optional</div>
      </div>
      <div className={fieldClassName}>
        <input
          className={'Input'}
          type={currentInputType}
          value={stateValue}
          placeholder={placeholderDisplayed}
          maxLength={maxLength}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            let target: HTMLInputElement = event.target as HTMLInputElement
            let value: string = target.value
            setState(value)
          }}
          onBlur={(event: React.FocusEvent) => {
            let target: HTMLInputElement = event.target as HTMLInputElement
            let value: string | undefined = target.value

            // Indicate that the user has left the field.
            // @note - This allows errors to be displayed.
            setLeftField(true)

            // If the field is empty or in a default
            // state and the error message is not displayed
            // and the default value is defined, but not an
            // empty string, and the field is required, then
            // set the input's value to a default value.
            if (
              (value === '' || value === undefined) &&
              !displayError &&
              handleOnBlur === 'repopulateValue' &&
              fieldType === 'required'
            ) {
              if (defaultValue !== undefined && defaultValue !== '') {
                setState(defaultValue)
              } else {
                setState(placeholderDisplayed)
              }
            }
          }}
        />
        <input
          className={togglePasswordButtonClassName}
          onClick={togglePasswordDisplay}
          type='button'
          value={displayPasswordText}
          disabled={inputType !== 'password'}
        />
      </div>
      {maxLength ? (
        <div className='CharacterCount'>
          {stateValue.length}/{maxLength}
        </div>
      ) : null}
      <div className={fieldErrorClassName}>{errorMessage}</div>
    </div>
  )
}

/* ---------------------------- TYPES FOR DETAIL STRING ---------------------------- */

/**
 * Input types for the Detail component.
 */
type TInput = 'password' | 'text'

/**
 * The properties for the Detail String component.
 */
type TDetailString_P = TDetailWithInput_P<string> & {
  /**
   * The type of input to render (i.e., text or password).
   * @default 'text'
   */
  inputType?: TInput
  /**
   * The maximum number of characters that can be entered.
   */
  maxLength?: number
}
