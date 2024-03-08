import React, { useEffect, useRef, useState } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { compute } from 'src/toolbox'
import inputs from 'src/toolbox/inputs'
import { AnyObject } from '../../../../../shared/toolbox/objects'
import Tooltip from '../communication/Tooltip'
import Toggle, { EToggleLockState } from '../user-controls/Toggle'
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
  previousValue = undefined,
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
              if (!displayError && previousValue) {
                setInputValue(previousValue)
                deliverValue(previousValue)
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
 * @param props.label The label for the detail.
 * @param props.initialValue The initial value for the detail.
 * @param props.deliverValue The function to deliver the value.
 * @param props.options The options available for the detail.
 * @param options.minimum The minimum value allowed for the detail. Defaults to null.
 * @param options.maximum The maximum value allowed for the detail. Defaults to null.
 * @param options.integersOnly The boolean that determines if the detail should only allow integers. Defaults to false.
 * @param options.unit The unit to display after the detail. Defaults to ''.
 * @param options.placeholder The placeholder for the input. Defaults to 'Enter a number...'.
 * @param options.emptyValueAllowed The boolean that determines if the detail should allow empty values. Defaults to false.
 * @param options.clearField The boolean that determines if the detail should clear the field. Defaults to false.
 * @param options.uniqueLabelClassName The unique class name for the label. Defaults to ''.
 * @param options.displayOptionalText The boolean that determines if the detail should display optional text. Defaults to false.
 * @returns A JSX Element for the detail.
 */
export function DetailNumber(props: {
  label: string
  initialValue: number | null | undefined
  deliverValue: (value: number | null | undefined) => void
  options?: {
    minimum?: number // default null
    maximum?: number // default null
    integersOnly?: boolean // default false
    unit?: string // default ''
    placeholder?: string // default 'Enter a number...'
    emptyValueAllowed?: boolean // default false
    clearField?: boolean // default false
    uniqueLabelClassName?: string // default ''
    displayOptionalText?: boolean // default false
  }
}): JSX.Element | null {
  const field = useRef<HTMLInputElement>(null)
  const [mountHandled, setMountHandled] = useState<boolean>(false)

  let label: string = props.label
  let initialValue: number | null | undefined = props.initialValue
  let minimum: number | null =
    props.options?.minimum !== undefined ? props.options.minimum : null
  let maximum: number | null =
    props.options?.maximum !== undefined ? props.options.maximum : null
  let integersOnly: boolean = props.options?.integersOnly || false
  let unit: string = props.options?.unit || ''
  let placeholder: string = props.options?.placeholder || 'Enter a number...'
  let emptyValueAllowed: boolean = props.options?.emptyValueAllowed || false
  let clearField: boolean = props.options?.clearField || false
  let uniqueLabelClassName: string = props.options?.uniqueLabelClassName || ''
  let displayOptionalText: boolean = props.options?.displayOptionalText || false
  let deliverValue = props.deliverValue

  /* -- COMPONENT EFFECTS -- */
  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled) {
      let fieldElement: HTMLInputElement | null = field.current

      if (fieldElement && initialValue) {
        fieldElement.value = `${initialValue}`
      }

      setMountHandled(true)
    }
  }, [mountHandled])

  /* -- PRE-RENDER PROCESSING -- */

  // Default class names
  let labelClassName: string = 'Label'
  let optionalClassName: string = displayOptionalText
    ? 'Optional'
    : 'Optional Hidden'

  // If a boolean that is equivalent
  // to true is passed, then the
  // field will be cleared, or reset.
  if (clearField && field.current) {
    field.current.value = ''
  }

  /* -- RENDER -- */
  return (
    <div className='Detail DetailNumber'>
      <div className='TitleContainer'>
        <div
          className={labelClassName + ' ' + uniqueLabelClassName}
        >{`${label}:`}</div>
        <div className={optionalClassName}>optional</div>
      </div>
      <div className='Unit'>{unit}</div>
      <input
        className='Field'
        type='text'
        ref={field}
        placeholder={placeholder}
        onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
          inputs.enforceNumbericCharsOnly(event)
          if (integersOnly) {
            inputs.enforceIntegersOnly(event)
          }
          if (minimum !== null && minimum >= 0) {
            inputs.enforceNonNegativeOnly(event)
          }
        }}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          let target: HTMLInputElement = event.target as HTMLInputElement
          let value: number | null

          if (minimum !== null) {
            inputs.enforceNumberFloor(event, minimum)
          }
          if (maximum !== null) {
            inputs.enforceNumberCap(event, maximum)
          }

          value = parseInt(target.value)
          value = isNaN(value) ? null : value

          deliverValue(value)
        }}
        onBlur={(event: React.FocusEvent) => {
          let target: HTMLInputElement = event.target as HTMLInputElement
          let value: number | null | undefined

          value = parseInt(target.value)
          value = isNaN(value) ? null : value

          if (value === null) {
            if (minimum !== null && minimum > 0) {
              value = minimum
            } else if (maximum !== null && maximum < 0) {
              value = maximum
            } else {
              value = 0
            }
          }

          if (!emptyValueAllowed) {
            target.value = `${value}`
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
 * @param props.label The label for the detail.
 * @param props.initialValue The initial value for the detail.
 * @param props.deliverValue The function to deliver the value.
 * @param props.options The options available for the detail.
 * @param options.deliverError The boolean that determines if the detail should display an error. Defaults to false.
 * @param options.deliverErrorMessage The error message to display if the detail has an error. Defaults to ''.
 * @param options.disabled The boolean that determines if the detail should be disabled. Defaults to false.
 * @param options.uniqueLabelClassName The unique class name for the label. Defaults to ''.
 * @param options.uniqueInputClassName The unique class name for the input. Defaults to ''.
 * @param options.placeholder The placeholder for the input. Defaults to undefined.
 * @param options.emptyStringAllowed The boolean that determines if the detail should allow empty strings. Defaults to false.
 * @param options.elementBoundary The element boundary for the detail. Defaults to undefined.
 * @param options.clearField The boolean that determines if the detail should clear the field. Defaults to false.
 * @param options.displayOptionalText The boolean that determines if the detail should display optional text. Defaults to false.
 * @returns A JSX Element for the detail.
 */
export function DetailBox(props: {
  label: string
  initialValue: string | undefined
  deliverValue: (value: string) => void
  options?: {
    disabled?: boolean // default false
    uniqueLabelClassName?: string // default ''
    uniqueInputClassName?: string // default ''
    placeholder?: string
    emptyStringAllowed?: boolean // default false
    elementBoundary?: string
    clearField?: boolean // default false
    displayOptionalText?: boolean // default false
  }
}): JSX.Element | null {
  let label: string = props.label
  let initialValue: string | undefined = props.initialValue
  let uniqueLabelClassName: string = props.options?.uniqueLabelClassName
    ? props.options.uniqueLabelClassName
    : ''
  let uniqueInputClassName: string = props.options?.uniqueInputClassName
    ? props.options.uniqueInputClassName
    : ''
  let disabled: boolean = props.options?.disabled === true
  let placeholder: string | undefined =
    props.options?.placeholder || 'Enter text...'
  let emptyStringAllowed: boolean = props.options?.emptyStringAllowed || false
  let elementBoundary: string | undefined = props.options?.elementBoundary
  let clearField: boolean = props.options?.clearField || false
  let displayOptionalText: boolean = props.options?.displayOptionalText || false
  let deliverValue = props.deliverValue

  /* -- COMPONENT STATE -- */
  const [isEmptyString, setIsEmptyString] = useState<boolean>(false)

  /* -- COMPONENT EFFECTS -- */
  useEffect(() => {
    // If a boolean that is equivalent
    // to true is passed, then the
    // field will be cleared, or reset.
    if (clearField) {
      deliverValue('')
    }
  }, [clearField])

  /* -- PRE-RENDER PROCESSING -- */

  // Default class names
  let className: string = 'Detail DetailBox'
  let fieldClassName: string = 'Field FieldBox'
  let labelClassName: string = 'Label'
  let fieldErrorClassName: string = 'FieldErrorMessage hide'
  let optionalClassName: string = displayOptionalText
    ? 'Optional'
    : 'Optional Hidden'

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

  if (disabled) {
    className += ' Disabled'
  }

  if (!emptyStringAllowed && isEmptyString) {
    fieldClassName += ' Error'
    labelClassName += ' Error'
    fieldErrorClassName = 'FieldErrorMessage'
  } else if (emptyStringAllowed) {
    fieldClassName = 'Field FieldBox'
    labelClassName = 'Label'
  }

  /* -- RENDER -- */

  return (
    <div className={className}>
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
        value={initialValue}
        placeholder={placeholder}
        theme='snow'
        onChange={(value: string) => {
          deliverValue(value)

          // If empty strings are not allowed
          // and the field is empty or in a default
          // state, then display an error.
          if (!emptyStringAllowed) {
            if (value === '<p><br></p>' || !value) {
              setIsEmptyString(true)
            }
            // If empty strings are not allowed
            // and the field is not empty or in a default
            // state, then do not display an error.
            else {
              setIsEmptyString(false)
            }
          }
          // If empty strings are allowed then never
          // display an error.
          else {
            setIsEmptyString(false)
          }
        }}
        onBlur={(
          previousSelection: ReactQuill.Range,
          source: any,
          editor: ReactQuill.UnprivilegedEditor,
        ) => {
          let value: string = editor.getHTML()

          // If empty strings are not allowed
          // and the field is empty or in a default
          // state, then display an error.
          if (!emptyStringAllowed) {
            if (value === '<p><br></p>' || !value) {
              setIsEmptyString(true)
            }
          }
          // If empty strings are allowed then never
          // display an error.
          else {
            setIsEmptyString(false)
          }
        }}
      />
      <div className={fieldErrorClassName}>
        At least one character is required here.
      </div>
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

// A field in a form that consists of a label
// and an on/off toggle.
export class DetailToggle extends React.Component<
  TDetailToggle_P,
  TDetailToggle_S
> {
  /* -- static-fields -- */

  static defaultProps = {
    initialValue: false,
    lockState: EToggleLockState.Unlocked,
    tooltipDescription: '',
    uniqueClassName: '',
  }

  /* -- non-static-fields -- */

  // ...none added

  /* -- initialization -- */

  // constructor(props: IFormDetailToggle_P) {
  //   super(props)
  // }

  componentDidMount(): void {}

  componentDidUpdate(
    prevProps: Readonly<TDetailToggle_P>,
    prevState: Readonly<TDetailToggle_S>,
    snapshot?: any,
  ): void {
    if (prevProps.initialValue !== this.props.initialValue) {
      this.forceUpdate()
    }
  }

  /* -- functions | render -- */

  // inherited
  render(): JSX.Element | null {
    let label: string = this.props.label
    let initialValue: boolean = this.props.initialValue
    let lockState: EToggleLockState = this.props.lockState
    let tooltipDescription: string = this.props.tooltipDescription
    let hideTooltip: boolean = tooltipDescription.length === 0
    let uniqueClassName: string = this.props.uniqueClassName
    let errorMessage: string | undefined = this.props.options?.errorMessage
    let displayOptionalText: boolean =
      this.props.options?.displayOptionalText || false

    /* -- PRE-RENDER PROCESSING -- */

    // Default class names
    let containerClassName: string = 'Detail DetailToggle'
    let fieldErrorClassName: string = 'FieldErrorMessage hide'
    let optionalClassName: string = displayOptionalText
      ? 'Optional'
      : 'Optional Hidden'

    if (uniqueClassName.length > 0) {
      containerClassName += ` ${uniqueClassName}`
    }
    tooltipDescription = `#### ${label}\n${tooltipDescription}`

    if (
      errorMessage !== undefined &&
      (lockState === EToggleLockState.LockedActivation ||
        lockState === EToggleLockState.LockedDeactivation)
    ) {
      fieldErrorClassName = 'FieldErrorMessage'
    }

    /* -- RENDER -- */

    return (
      <div className={containerClassName}>
        <div className='TitleContainer'>
          <div className='Label'>{label}</div>
          <div className={optionalClassName}>optional</div>
        </div>
        <div className='Field'>
          <Toggle
            initiallyActivated={initialValue}
            lockState={lockState}
            deliverValue={this.props.deliverValue}
          />
        </div>
        {hideTooltip ? null : <Tooltip description={tooltipDescription} />}
        <div className={fieldErrorClassName}>{errorMessage}</div>
      </div>
    )
  }
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
   * The previous value saved for the detail.
   * @default undefined
   */
  previousValue?: string | undefined
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
   * Marks the form detail.
   */
  label: string
  /**
   * The default value for the input field.
   */
  initialValue: boolean
  /**
   * The toggle lock state of the toggle.
   * (See Toggle.tsx)
   */
  lockState: EToggleLockState
  /**
   * The description displayed when hovered over.
   */
  tooltipDescription: string
  /**
   * Class name to apply to the root element.
   */
  uniqueClassName: string
  /**
   * Delivers what the user inputs so that
   * the parent component can track it.
   * @param value The value to deliver.
   */
  deliverValue: (value: boolean) => void
  /**
   * The options available for the detail.
   */
  options?: {
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
}

/**
 * The state for the DetailToggle component.
 */
type TDetailToggle_S = {}
