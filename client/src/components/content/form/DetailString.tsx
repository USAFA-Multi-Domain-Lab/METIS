import { compute } from '@client/toolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import React, { useState } from 'react'
import type { TDetailWithInput_P } from '.'
import './DetailString.scss'
import DetailTitleRow from './DetailTitleRow'
import { useDetailClassNames } from './useDetailClassNames'
import { useErrorMessages } from './useDisplayError'

const BLANK_ERROR_MESSAGE: string = 'At least one character is required here.'

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
  errorMessage = '',
  errorType = 'default',
  errorDisplay = 'on-blur',
  disabled = false,
  uniqueLabelClassName = undefined,
  uniqueFieldClassName = undefined,
  inputType = 'text',
  placeholder = 'Enter text here...',
  tooltipDescription = '',
  maxLength = undefined,
  onBeforeBlur = undefined,
  onAfterBlur = undefined,
}: TDetailString_P): TReactElement {
  /* -- STATE -- */
  const [currentInputType, setCurrentInputType] = useState<TInput>(inputType)
  const [displayPasswordText, setDisplayPasswordText] = useState<
    'show' | 'hide'
  >('show')

  /* -- COMPUTED -- */

  const { displayError, activeErrorMessage, markLeftField } = useErrorMessages({
    errorMethod: 'interactive',
    errorMessage,
    errorDisplay,
    handleOnBlur,
    fieldType,
    stateIsEmpty: stateValue === '',
    blankErrorMessage: BLANK_ERROR_MESSAGE,
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
  const togglePasswordButtonClasses = new ClassList('TogglePasswordButton').set(
    'Hidden',
    inputType !== 'password',
  )
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
            event.target.select()
          }}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            let target: HTMLInputElement = event.target as HTMLInputElement
            let value: string = target.value
            setState(value)
          }}
          onBlur={(event: React.FocusEvent) => {
            let target: HTMLInputElement = event.target as HTMLInputElement
            let value: string | undefined = target.value

            onBeforeBlur?.()

            markLeftField()

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

            onAfterBlur?.()
          }}
          onMouseDown={(event: React.MouseEvent<HTMLInputElement>) => {
            if (document.activeElement !== event.currentTarget) {
              event.preventDefault()
              event.currentTarget.focus()
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
      <div className={fieldErrorClasses.value}>{activeErrorMessage}</div>
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
   * Called at the very start of the blur handler, before any built-in logic runs.
   */
  onBeforeBlur?: () => void
  /**
   * Called at the very end of the blur handler, after all built-in logic has run.
   */
  onAfterBlur?: () => void
}
