import { compute } from '@client/toolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import React, { useState } from 'react'
import type { TDetailWithInput_P } from '.'
import './DetailString.scss'
import DetailTitleRow from './DetailTitleRow'
import { useDetailClassNames } from './useDetailClassNames'

const DEFAULT_ERROR_MESSAGE: string = 'At least one character is required here.'

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
  errorMessage = DEFAULT_ERROR_MESSAGE,
  errorType = 'default',
  disabled = false,
  uniqueLabelClassName = undefined,
  uniqueFieldClassName = undefined,
  inputType = 'text',
  placeholder = 'Enter text here...',
  tooltipDescription = '',
  maxLength = undefined,
  highlightAllOnFocus = false,
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

    // Make sure the user has left the field and that
    // the error message isn't in a default state before
    // displaying the error message.
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

    // Lets the user know that the field cannot be left
    // empty if the field is required and they have left
    // the field without entering any information.
    if (
      leftField &&
      fieldType === 'required' &&
      handleOnBlur === 'deliverError' &&
      errorMessage === DEFAULT_ERROR_MESSAGE &&
      stateValue === ''
    ) {
      display = true
    }

    // Return the boolean.
    return display
  })
  const { rootClasses, labelClasses, fieldClasses, fieldErrorClasses } =
    useDetailClassNames({
      componentName: 'DetailString',
      disabled,
      displayError,
      errorType,
      uniqueLabelClassName,
      uniqueFieldClassName,
    })
  fieldClasses.set('Password', inputType === 'password')
  /**
   * Class names for the toggle password display container.
   * @note Appears as a button with the text "show" or "hide".
   */
  const togglePasswordButtonClasses = new ClassList('TogglePasswordButton')
    .set('Hidden', inputType !== 'password')
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
    <div className={rootClasses.value}>
      <DetailTitleRow
        label={label}
        labelClassName={labelClasses.value}
        tooltipDescription={tooltipDescription}
        fieldType={fieldType}
      />
      <div className={fieldClasses.value}>
        <input
          className={'Input'}
          type={currentInputType}
          value={stateValue}
          placeholder={placeholderDisplayed}
          maxLength={maxLength}
          disabled={disabled}
          onFocus={(event: React.FocusEvent<HTMLInputElement>) => {
            if (highlightAllOnFocus) {
              event.target.select()
            }
          }}
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
          className={togglePasswordButtonClasses.value}
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
      <div className={fieldErrorClasses.value}>{errorMessage}</div>
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
  /**
   * Determines if the field highlights all of the text when the user focuses on the field.
   * @default false
   */
  highlightAllOnFocus?: boolean
}
