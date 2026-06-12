import { compute } from '@client/toolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import React, { useEffect, useState } from 'react'
import type { TDetailWithInput_P } from '.'
import './DetailString.scss'
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
export function DetailString({
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
  inputType = 'text',
  placeholder = 'Enter text here...',
  tooltipDescription = '',
  maxLength = undefined,
  onBlur = () => {},
  onActiveErrorMessageChange = () => {},
}: TDetailString_P): TReactElement {
  /* -- STATE -- */
  const [currentInputType, setCurrentInputType] = useState<TInput>(inputType)
  const [displayPasswordText, setDisplayPasswordText] = useState<
    'show' | 'hide'
  >('show')
  const [focused, setFocused] = useState<boolean>(false)

  /* -- COMPUTED -- */

  const { displayError, activeErrorMessage } = useErrorMessages({
    errorMessage,
    fieldType,
    inputValue: stateValue,
    focused,
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

  /* -- EFFECTS -- */

  useDefaultValue({
    fieldType,
    stateValue,
    setState,
    defaultValue,
    focused,
  })

  useEffect(() => {
    onActiveErrorMessageChange(activeErrorMessage)
  }, [activeErrorMessage])

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
            setFocused(true)
            event.target.select()
          }}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            let target: HTMLInputElement = event.target as HTMLInputElement
            let value: string = target.value
            setState(value)
          }}
          onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
            setFocused(false)
            onBlur(event)
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
   * Callback function to externally handle blur events on the input.
   * @default () => {}
   */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
  /**
   * Callback function to handle changes to the active error message.
   * @note The active error message is the current error message being
   * displayed on the detail. This may or may not be the same as the
   * `errorMessage` prop, depending on the context of the detail
   * (e.g., focused, blurred, left blank).
   * @default () => {}
   */
  onActiveErrorMessageChange?: (activeErrorMessage: string) => void
}
