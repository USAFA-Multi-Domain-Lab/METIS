import React, { useEffect, useState } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { useGlobalContext } from 'src/context'
import { compute } from 'src/toolbox'
import inputs from 'src/toolbox/inputs'
import { AnyObject } from '../../../../../shared/toolbox/objects'
import Tooltip from '../communication/Tooltip'
import Toggle, { TToggleLockState } from '../user-controls/Toggle'
import './Form.scss'

/**
 * This will render a detail for
 * a form, with a label and a text
 * field for entering information.
 */
export function Detail({
  label,
  currentValue,
  deliverValue,
  // Optional Properties
  defaultValue = undefined,
  deliverError = false,
  errorMessage = 'At least one character is required here.',
  disabled = false,
  uniqueLabelClassName = '',
  uniqueInputClassName = '',
  inputType = 'text',
  placeholder = undefined,
  emptyStringAllowed = true,
  clearField = false,
  displayOptionalText = false,
}: TDetail_P): JSX.Element {
  /* -- STATE -- */
  const [inputValue, setInputValue] = useState<string | undefined>(currentValue)
  const [leftFieldEmpty, setLeftFieldEmpty] = useState<boolean>(false)
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
    // Initialize the boolean.
    let displayError: boolean = deliverError

    // If the user leaves the field by clicking
    // outside of it, and the current value is
    // an empty string...
    if (leftFieldEmpty) {
      // ...and empty strings are not allowed, the
      // field is empty or in a default state,
      // then display the error message.
      if (!emptyStringAllowed && (inputValue === '' || !inputValue)) {
        displayError = true
      }
    }
    // Otherwise, the field was not left empty
    // and the error message should not be displayed.
    else {
      displayError = false
    }

    // Return the boolean.
    return displayError
  })

  /**
   * The class name for the detail.
   */
  const rootClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Detail']

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
   * Class name for the field.
   */
  const fieldClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Field', 'FieldBox']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueInputClassName) {
      classList.push(uniqueInputClassName)
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
   * The class name for the input container.
   */
  const inputContainerClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['InputContainer']

    // If the input type is password then
    // add the password class name.
    if (inputType === 'password') {
      classList.push('Password')
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
    let classList: string[] = ['TogglePasswordButton', fieldClassName]

    // If the input type is not "password" then
    // add the hidden class name.
    if (inputType !== 'password') {
      classList.push('Hidden')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the optional text.
   */
  const optionalClassName: string = compute(() =>
    displayOptionalText ? 'Optional' : 'Optional Hidden',
  )

  /* -- EFFECTS -- */
  useEffect(() => {
    // If clearField is true then
    // clear the field.
    if (clearField) {
      setInputValue('')
      deliverValue('')
    }
  }, [clearField])

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
      <div className='TitleContainer'>
        <div className={labelClassName}>{`${label}:`}</div>
        <div className={optionalClassName}>optional</div>
      </div>
      <div className={inputContainerClassName}>
        <input
          className={fieldClassName}
          type={currentInputType}
          value={inputValue}
          placeholder={placeholder}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setInputValue(event.target.value)
            deliverValue(event.target.value)
          }}
          onBlur={(event: React.FocusEvent) => {
            let target: HTMLInputElement = event.target as HTMLInputElement
            let value: string | undefined = target.value

            // If the field is empty or in a default
            // state...
            if (value === '' || !value) {
              // ...set the left field empty state to true.
              setLeftFieldEmpty(true)

              // If the error message is not displayed
              // and the field is empty or in a default
              // state, then set the input's value to
              // the previous value and deliver the previous
              // value.
              if (!displayError && defaultValue) {
                setInputValue(defaultValue)
                deliverValue(defaultValue)
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
      <div className={fieldErrorClassName}>{errorMessage}</div>
    </div>
  )
}

/**
 * This will render a detail for
 * a form, with a label and a number
 * field for entering information.
 */
export function DetailNumber({
  label,
  currentValue,
  deliverValue,
  // Optional Properties
  defaultValue = 0,
  minimum = undefined,
  maximum = undefined,
  integersOnly = false,
  unit = '',
  placeholder = undefined,
  emptyValueAllowed = true,
  clearField = false,
  uniqueLabelClassName = '',
  displayOptionalText = false,
}: TDetailNumber_P): JSX.Element | null {
  /* -- STATE -- */
  const [inputValue, setInputValue] = useState<number | undefined>(currentValue)

  /* -- COMPUTED -- */
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

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the optional text.
   */
  const optionalClassName: string = compute(() =>
    displayOptionalText ? 'Optional' : 'Optional Hidden',
  )

  /* -- EFFECTS -- */
  useEffect(() => {
    // If clearField is true then
    // clear the field.
    if (clearField) {
      setInputValue(undefined)
      deliverValue(undefined)
    }
  }, [clearField])

  /* -- RENDER -- */
  return (
    <div className='Detail DetailNumber'>
      <div className='TitleContainer'>
        <div className={labelClassName}>{`${label}:`}</div>
        <div className={optionalClassName}>optional</div>
      </div>
      <div className='Unit'>{unit}</div>
      <input
        className='Field'
        type='text'
        placeholder={placeholder}
        value={inputValue}
        onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
          // Enforce the input to only accept numeric characters.
          inputs.enforceNumbericCharsOnly(event)

          // If integersOnly is true then enforce the input to only accept integers.
          if (integersOnly) {
            inputs.enforceIntegersOnly(event)
          }

          // If a minimum value is passed and it is greater than or equal to 0,
          // then enforce the input to only accept non-negative numbers.
          if (minimum && minimum >= 0) {
            inputs.enforceNonNegativeOnly(event)
          }
        }}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          let target: HTMLInputElement = event.target as HTMLInputElement
          let value: number | undefined

          // If a minimum or maximum value is passed
          // then enforce the minimum and maximum values.
          if (minimum) {
            inputs.enforceNumberFloor(event, minimum)
          }
          if (maximum) {
            inputs.enforceNumberCap(event, maximum)
          }

          // Convert the input's value to a number and
          // check if it is a number.
          value = parseInt(target.value)
          value = isNaN(value) ? undefined : value

          // Update the input's value and deliver the value.
          setInputValue(value)
          deliverValue(value)
        }}
        onBlur={(event: React.FocusEvent) => {
          let target: HTMLInputElement = event.target as HTMLInputElement
          let value: number | undefined

          // Convert the input's value to a number and
          // check if it is a number.
          value = parseInt(target.value)
          value = isNaN(value) ? undefined : value

          // If the field is empty or in a default
          // state...
          if (!value) {
            // ...and empty values are not allowed, but the
            // minimum value is greater than 0, then set the
            // input's value to the minimum value.
            if (!emptyValueAllowed && minimum && minimum > 0) {
              value = minimum
            }
            // Or, if empty values are not allowed, but the
            // maximum value is less than 0, then set the
            // input's value to the maximum value.
            else if (!emptyValueAllowed && maximum && maximum < 0) {
              value = maximum
            }
            // Or, if empty values are not allowed, then set
            // the input's value to the default value.
            else if (!emptyValueAllowed) {
              value = defaultValue
            }

            setInputValue(value)
            deliverValue(value)
          }
        }}
      />
    </div>
  )
}

/**
 * This will render a detail for
 * a form, with a label and a text
 * field for entering information.
 */
export function DetailBox({
  label,
  currentValue,
  deliverValue,
  // Optional Properties
  defaultValue = undefined,
  deliverError = false,
  errorMessage = 'At least one character is required here.',
  disabled = false,
  uniqueLabelClassName = '',
  uniqueInputClassName = '',
  placeholder = undefined,
  emptyStringAllowed = true,
  elementBoundary = undefined,
  clearField = false,
  displayOptionalText = false,
}: TDetailBox_P): JSX.Element | null {
  /* -- STATE -- */
  const [inputValue, setInputValue] = useState<string | undefined>(currentValue)
  const [leftFieldEmpty, setLeftFieldEmpty] = useState<boolean>(false)

  /* -- COMPUTED -- */
  /**
   * The boolean that determines if the
   * error message should be displayed.
   */
  const displayError: boolean = compute(() => {
    // Initialize the boolean.
    let displayError: boolean = deliverError

    // If the user leaves the field by clicking
    // outside of it, and the current value is
    // an empty string...
    if (leftFieldEmpty) {
      // ...and empty strings are not allowed, the
      // field is empty or in a default state,
      // then display the error message.
      if (
        !emptyStringAllowed &&
        (inputValue === '<p><br></p>' || !inputValue)
      ) {
        displayError = true
      }
    }
    // Otherwise, the field was not left empty
    // and the error message should not be displayed.
    else {
      displayError = false
    }

    // Return the boolean.
    return displayError
  })
  /**
   * The root class name for the detail.
   */
  const rootClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Detail', 'DetailBox']

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
   * The class name for the field.
   */
  const fieldClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Field', 'FieldBox']

    // If the error message is displayed
    // then add the error class name.
    if (displayError) {
      classList.push('Error')
    }

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueInputClassName) {
      classList.push(uniqueInputClassName)
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
    displayOptionalText ? 'Optional' : 'Optional Hidden',
  )

  /* -- EFFECTS -- */
  useEffect(() => {
    // If clearField is true then
    // clear the field.
    if (clearField) {
      setInputValue('')
      deliverValue('')
    }
  }, [clearField])

  /* -- PRE-RENDER PROCESSING -- */

  const reactQuillModules = {
    toolbar: {
      container: [
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['bold', 'italic', 'underline', 'link'],
        ['clean'],
      ],
    },
    clipboard: {
      matchVisual: false,
    },
  }

  const reactQuillFormats = ['bold', 'italic', 'underline', 'link', 'list']

  /* -- RENDER -- */

  return (
    <div className={rootClassName}>
      <div className='TitleContainer'>
        <div
          className={labelClassName + ' ' + uniqueLabelClassName}
        >{`${label}:`}</div>
        <div className={optionalClassName}>optional</div>
      </div>
      <ReactQuill
        bounds={elementBoundary}
        className={fieldClassName + ' ' + uniqueInputClassName}
        modules={reactQuillModules}
        formats={reactQuillFormats}
        value={currentValue}
        placeholder={placeholder}
        theme='snow'
        onChange={(value: string) => {
          setInputValue(value)
          deliverValue(value)
        }}
        onBlur={(
          previousSelection: ReactQuill.Range,
          source,
          editor: ReactQuill.UnprivilegedEditor,
        ) => {
          let value: string | undefined | null = editor.getHTML()

          // If the field is empty or in a default
          // state...
          if (value === '<p><br></p>' || !value) {
            // ...set the left field empty state to true.
            setLeftFieldEmpty(true)

            // If the error message is not displayed
            // and the field is empty or in a default
            // state, then set the input's value to
            // the default value and deliver the previous
            // value.
            if (!displayError && defaultValue) {
              setInputValue(defaultValue)
              deliverValue(defaultValue)
            }
          }
        }}
      />
      <div className={fieldErrorClassName}>{errorMessage}</div>
    </div>
  )
}

/**
 * This will render a detail for
 * a form, with a label and a drop
 * down box for selecting from various
 * options.
 */
export function DetailDropDown<TOption>({
  label,
  options,
  currentValue,
  isExpanded,
  renderDisplayName,
  deliverValue,
  // Optional Properties
  uniqueDropDownStyling = {},
  uniqueClassName,
  uniqueLabelClassName,
  uniqueFieldClassName,
  uniqueCurrentValueClassName,
  clearField = false,
  defaultValue = undefined,
  displayOptionalText = false,
  uniqueOptionStyling = (option: TOption) => {
    return {}
  },
  renderOptionClassName = (option: TOption) => {
    return ''
  },
}: TDetailDropDown_P<TOption>): JSX.Element | null {
  /* -- STATE -- */
  const [expanded, setExpanded] = useState<boolean>(false)

  /* -- COMPUTED -- */
  /**
   * The class name for the detail.
   */
  const className: string = compute(() => {
    // Default class names
    let classList: string[] = ['Detail', 'DetailDropDown']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueClassName) {
      classList.push(uniqueClassName)
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the field.
   */
  const fieldClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Field', 'FieldDropDown']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueFieldClassName) {
      classList.push(uniqueFieldClassName)
    }

    // If the detail is expanded then add
    // the expanded class name
    if (expanded) {
      classList.push('IsExpanded')
    }
    // Otherwise add the collapsed class name.
    else {
      classList.push('IsCollapsed')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for all options.
   */
  const allOptionsClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['AllOptions']

    // If the detail is collapsed
    // then hide the options.
    if (!expanded) {
      classList.push('Hidden')
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

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the current value.
   */
  const currentValueClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Text']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueCurrentValueClassName) {
      classList.push(uniqueCurrentValueClassName)
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The value displayed.
   */
  const valueDisplayed: string = compute(() => {
    // If the current value is not null
    // or undefined then display it.
    if (currentValue) {
      return renderDisplayName(currentValue)
    }
    // If the current value is null or undefined
    // and a default value is passed then display
    // the default value.
    else if (defaultValue) {
      return renderDisplayName(defaultValue)
    }
    // If the current value is null or undefined
    // and a default value is not passed then display
    // a message that indicates that an option should
    // be selected.
    else {
      return 'Select an option'
    }
  })
  const optionalClassName: string = compute(() => {
    return displayOptionalText ? 'Optional' : 'Optional Hidden'
  })

  /* -- EFFECTS -- */
  useEffect(() => {
    if (clearField) {
      setExpanded(false)
      currentValue = null
    }
  }, [clearField])

  /* -- RENDER -- */
  if (options.length > 0) {
    return (
      <div className={className} style={uniqueDropDownStyling}>
        <div className='TitleContainer'>
          <div className={labelClassName}>{`${label}:`}</div>
          <div className={optionalClassName}>optional</div>
        </div>
        <div className={fieldClassName}>
          <div
            className='Option Selected'
            onClick={() => {
              setExpanded(!expanded)
            }}
          >
            <div className={currentValueClassName}>{valueDisplayed}</div>
            <div className='Indicator'>v</div>
          </div>
          <div className={allOptionsClassName}>
            {options.map((option: TOption, index: number) => {
              return (
                <div
                  className={`Option ${renderOptionClassName(option)}`}
                  style={uniqueOptionStyling(option)}
                  key={`option_${renderDisplayName(option)}_${index}`}
                  onClick={() => {
                    deliverValue(option)
                    setExpanded(isExpanded)
                  }}
                >
                  {renderDisplayName(option)}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  } else {
    return null
  }
}

/**
 * This will render a detail for a form,
 * with a label and a toggle switch
 * for turning a feature on or off.
 */
export function DetailToggle({
  label,
  currentValue = false,
  deliverValue,
  // Optional Properties
  lockState = 'unlocked',
  tooltipDescription = '',
  uniqueClassName = undefined,
  errorMessage = undefined,
  displayOptionalText = false,
}: TDetailToggle_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- COMPUTED -- */
  /**
   * The class name for the detail.
   */
  const containerClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Detail', 'DetailToggle']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueClassName) {
      classList.push(uniqueClassName)
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the optional text.
   */
  const optionalClassName: string = compute(() =>
    displayOptionalText ? 'Optional' : 'Optional Hidden',
  )
  /**
   * Class name for the error message field.
   */
  const fieldErrorClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['FieldErrorMessage']

    // Hide the error message if the
    // error message is not passed and
    // the lock state is locked.
    if (
      !errorMessage &&
      (lockState === 'locked-activation' || lockState === 'locked-deactivation')
    ) {
      classList.push('Hidden')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })

  /* -- EFFECTS -- */
  useEffect(() => {
    forceUpdate()
  }, [currentValue])

  /* -- RENDER -- */
  return (
    <div className={containerClassName}>
      <div className='TitleContainer'>
        <div className='Label'>{label}</div>
        <div className={optionalClassName}>optional</div>
      </div>
      <div className='Field'>
        <Toggle
          currentValue={currentValue}
          deliverValue={deliverValue}
          lockState={lockState}
        />
      </div>
      <Tooltip description={tooltipDescription} />
      <div className={fieldErrorClassName}>{errorMessage}</div>
    </div>
  )
}

/* ---------------------------- TYPES FOR FORMS ---------------------------- */

/**
 * Input types for the Detail component.
 */
type TInput =
  | 'button'
  | 'checkbox'
  | 'color'
  | 'date'
  | 'datetime-local'
  | 'email'
  | 'file'
  | 'hidden'
  | 'image'
  | 'month'
  | 'number'
  | 'password'
  | 'radio'
  | 'range'
  | 'reset'
  | 'search'
  | 'submit'
  | 'tel'
  | 'text'
  | 'time'
  | 'url'
  | 'week'

/**
 * The properties for the Detail component.
 */
type TDetail_P = {
  /**
   * The label for the detail.
   */
  label: string
  /**
   * The current value for the detail.
   */
  currentValue: string | undefined
  /**
   * The function to deliver the value.
   */
  deliverValue: (value: string) => void
  /**
   * The default value that is used if the field is empty.
   * @default undefined
   */
  defaultValue?: string | undefined
  /**
   * The boolean that determines if the detail should display an error.
   * @default false
   */
  deliverError?: boolean
  /**
   * The error message to display if the detail has an error.
   * @default 'At least one character is required here.'
   */
  errorMessage?: string
  /**
   * Boolean that determines if the detail should be disabled.
   */
  disabled?: boolean
  /**
   * The unique class name for the label.
   * @default ''
   */
  uniqueLabelClassName?: string
  /**
   * The unique class name for the input.
   * @default ''
   */
  uniqueInputClassName?: string
  /**
   * The type of input to render (i.e., text, password, etc.).
   * @default 'text'
   */
  inputType?: TInput
  /**
   * The placeholder for the input.
   * @default 'Enter text...'
   */
  placeholder?: string
  /**
   * The boolean that determines if the detail should clear the field.
   * @default false
   */
  clearField?: boolean
  /**
   * The boolean that determines if the detail should display a required icon.
   * @default false
   */
  displayRequiredIcon?: boolean
  /**
   * The boolean that determines if the detail should allow empty strings.
   * @default true
   */
  emptyStringAllowed?: boolean
  /**
   * A boolean that will determine whether or not to show that the field
   * is optional.
   * @default false
   */
  displayOptionalText?: boolean
}

/**
 * The properties for the DetailNumber component.
 */
type TDetailNumber_P = {
  /**
   * The label for the detail.
   */
  label: string
  /**
   * The current value for the detail.
   */
  currentValue: number | undefined
  /**
   * The function to deliver the value.
   */
  deliverValue: (value: number | undefined) => void
  /**
   * The default value that is used if the field is empty.
   * @default 0
   */
  defaultValue?: number | undefined
  /**
   * The minimum value allowed for the detail.
   * @default undefined
   */
  minimum?: number
  /**
   * The maximum value allowed for the detail.
   * @default undefined
   */
  maximum?: number
  /**
   * The boolean that determines if the detail should only allow integers.
   * @default false
   */
  integersOnly?: boolean
  /**
   * The unit to display after the detail.
   * @default ''
   */
  unit?: string
  /**
   * The placeholder for the input.
   * @default undefined
   */
  placeholder?: string
  /**
   * The boolean that determines if the detail should allow empty values.
   * @default true
   */
  emptyValueAllowed?: boolean
  /**
   * The boolean that determines if the detail should clear the field.
   * @default false
   */
  clearField?: boolean
  /**
   * The unique class name for the label.
   * @default ''
   */
  uniqueLabelClassName?: string
  /**
   * The boolean that determines if the detail should display optional text.
   * @default false
   */
  displayOptionalText?: boolean
}

/**
 * The properties for the DetailBox component.
 */
type TDetailBox_P = {
  /**
   * The label for the detail.
   */
  label: string
  /**
   * The current value for the detail.
   */
  currentValue: string | undefined
  /**
   * The function to deliver the value.
   */
  deliverValue: (value: string) => void
  /**
   * The default value that is used if the field is empty.
   * @default undefined
   */
  defaultValue?: string | undefined
  /**
   * The boolean that determines if the detail should display an error.
   * @default false
   */
  deliverError?: boolean
  /**
   * The error message to display if the detail has an error.
   * @default 'At least one character is required here.'
   */
  errorMessage?: string
  /**
   * The boolean that determines if the detail should be disabled.
   * @default false
   */
  disabled?: boolean
  /**
   * The unique class name for the label.
   * @default ''
   */
  uniqueLabelClassName?: string
  /**
   * The unique class name for the input.
   * @default ''
   */
  uniqueInputClassName?: string
  /**
   * The placeholder for the input.
   * @default undefined
   */
  placeholder?: string
  /**
   * The boolean that determines if the detail should allow empty strings.
   * @default true
   */
  emptyStringAllowed?: boolean
  /**
   * The class name of the element that the detail is bound to.
   * @note This is used to keep the tooltip from being cut off by the
   * element's boundary.
   * @default undefined
   */
  elementBoundary?: string
  /**
   * The boolean that determines if the detail should clear the field.
   * @default false
   */
  clearField?: boolean
  /**
   * A boolean that will determine whether or not to show that the field
   * is optional.
   * @default false
   */
  displayOptionalText?: boolean
}

/**
 * The properties for the DetailDropDown component.
 */
type TDetailDropDown_P<TOption> = {
  /**
   * The label for the detail.
   */
  label: string
  /**
   * The options available for the detail.
   */
  options: TOption[]
  /**
   * The current value for the detail.
   */
  currentValue: TOption | null | undefined
  /**
   * The boolean that determines if the detail is expanded.
   */
  isExpanded: boolean
  /**
   * The function to render the display name for the option.
   */
  renderDisplayName: (option: TOption) => string
  /**
   * The function to deliver the value.
   */
  deliverValue: (value: TOption) => void
  /**
   * The unique styling for the drop down.
   * @default {}
   */
  uniqueDropDownStyling?: AnyObject
  /**
   * The unique class name for the detail.
   * @default ''
   */
  uniqueClassName?: string
  /**
   * The unique class name for the label.
   * @default ''
   */
  uniqueLabelClassName?: string
  /**
   * The unique class name for the field.
   * @default ''
   */
  uniqueFieldClassName?: string
  /**
   * The unique class name for the current value.
   * @default ''
   */
  uniqueCurrentValueClassName?: string
  /**
   * The boolean that determines if the detail should clear the field.
   * @default false
   */
  clearField?: boolean
  /**
   * The default value for the detail.
   * @default undefined
   */
  defaultValue?: TOption
  /**
   * A boolean that will determine whether or not to show that the field
   * is optional.
   * @default false
   */
  displayOptionalText?: boolean
  /**
   * The unique styling for the options.
   * @default (option: TOption) => { return {} }
   */
  uniqueOptionStyling?: (option: TOption) => AnyObject
  /**
   * The function to render the class name for the option.
   * @default (option: TOption) => { return '' }
   */
  renderOptionClassName?: (option: TOption) => string
}

/**
 * The properties for the DetailToggle component.
 */
export type TDetailToggle_P = {
  /**
   * The label for the detail.
   */
  label: string
  /**
   * The current value for the detail.
   * @default false
   */
  currentValue: boolean | undefined
  /**
   * A function that will deliver the value of the toggle.
   */
  deliverValue: (activated: boolean) => void
  /**
   * The toggle lock state of the toggle.
   * @default 'unlocked'
   */
  lockState?: TToggleLockState
  /**
   * The description displayed when hovered over.
   * @default ''
   */
  tooltipDescription?: string
  /**
   * Class name to apply to the root element.
   */
  uniqueClassName?: string
  /** If an error message is needed then this is the
   * message that will be displayed
   */
  errorMessage?: string
  /**
   * A boolean that will determine whether or not to show that the field
   * is optional.
   * @default false
   */
  displayOptionalText?: boolean
}
