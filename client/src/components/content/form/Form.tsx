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
export class Detail extends React.Component<TDetail_P, TDetail_S> {
  field: React.RefObject<HTMLInputElement> = React.createRef()

  constructor(props: TDetail_P, state: TDetail_S) {
    super(props)

    this.state = {
      inputType: this.props.options?.inputType || 'text',
      displayPasswordText: 'show',
      currentValue: this.props.initialValue,
      displayError: false,
    }
  }

  // inherited
  componentDidMount(): void {
    let initialValue: string | null | undefined = this.props.initialValue
    let fieldElement: HTMLInputElement | null = this.field.current

    if (initialValue && fieldElement) {
      fieldElement.value = initialValue
    }
  }

  componentDidUpdate(
    prevProps: Readonly<TDetail_P>,
    prevState: Readonly<TDetail_S>,
    snapshot?: any,
  ): void {
    if (prevProps.initialValue !== this.props.initialValue) {
      this.setState({ currentValue: this.props.initialValue })
    }
  }

  togglePasswordDisplay(): void {
    if (this.state.inputType === 'password') {
      this.setState({ inputType: 'text' })
      this.setState({ displayPasswordText: 'hide' })
    } else {
      this.setState({ inputType: 'password' })
      this.setState({ displayPasswordText: 'show' })
    }
  }

  // inherited
  render(): JSX.Element | null {
    let label: string = this.props.label
    let deliverValue = this.props.deliverValue
    let deliverError: boolean = this.props.options?.deliverError || false
    let errorMessage: string = this.props.options?.deliverErrorMessage || ''
    let uniqueLabelClassName: string =
      this.props.options?.uniqueLabelClassName || ''
    let uniqueInputClassName: string =
      this.props.options?.uniqueInputClassName || ''
    let inputTypePassed: string = this.props.options?.inputType || 'text'
    let placeholder: string | undefined =
      this.props.options?.placeholder || 'Enter text...'
    let clearField: boolean = this.props.options?.clearField || false
    let displayRequiredIcon: boolean =
      this.props.options?.displayRequiredIcon || false
    let emptyStringAllowed: boolean =
      this.props.options?.emptyStringAllowed || false
    let currentValue: string | null | undefined = this.state.currentValue || ''
    let displayError: boolean = this.state.displayError
    let displayOptionalText: boolean =
      this.props.options?.displayOptionalText || false

    /* -- PRE-RENDER PROCESSING -- */

    // Default class names
    let fieldErrorClassName: string = 'FieldErrorMessage hide'
    let labelClassName: string = 'Label'
    let fieldClassName: string = 'Field FieldBox'
    let inputContainerClassName: string = 'InputContainer'
    let togglePasswordContainerClassName: string =
      'TogglePasswordDisplayContainer Hidden'
    let optionalClassName: string = displayOptionalText
      ? 'Optional'
      : 'Optional Hidden'

    // If empty strings are not allowed
    // and the field is empty or in a default
    // state, then display an error.
    if (!emptyStringAllowed && (displayError || deliverError)) {
      fieldClassName += ' Error'
      labelClassName += ' Error'
      fieldErrorClassName = 'FieldErrorMessage'
    }

    if (inputTypePassed === 'password') {
      togglePasswordContainerClassName = 'TogglePasswordDisplayContainer'
      inputContainerClassName += ' Password'
    }

    // If a boolean that is equivalent
    // to true is passed, then the
    // field will be cleared, or reset.
    if (clearField && this.field.current) {
      this.field.current.value = ''
    }

    /* -- RENDER -- */

    return (
      <div className='Detail'>
        <div className='TitleContainer'>
          <div
            className={labelClassName + ' ' + uniqueLabelClassName}
          >{`${label}:`}</div>
          <div className={optionalClassName}>optional</div>
        </div>
        <div className={inputContainerClassName}>
          <input
            className={fieldClassName + ' ' + uniqueInputClassName}
            type={this.state.inputType}
            ref={this.field}
            value={currentValue}
            placeholder={placeholder}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              this.setState({ currentValue: event.target.value })
              deliverValue(event.target.value)

              // If empty strings are not allowed
              // and the field is empty or in a default
              // state, then display an error.
              if (!emptyStringAllowed) {
                if (
                  event.target.value === '' ||
                  event.target.value === null ||
                  event.target.value === undefined
                ) {
                  this.setState({ displayError: true })
                }
                // If empty strings are not allowed
                // and the field is not empty or in a default
                // state, then do not display an error.
                else {
                  this.setState({ displayError: false })
                }
              }
              // If empty strings are allowed then never
              // display an error.
              else {
                this.setState({ displayError: false })
              }
            }}
            onBlur={(event: React.FocusEvent) => {
              let target: HTMLInputElement = event.target as HTMLInputElement
              let value: string | null | undefined = target.value

              // If empty strings are not allowed
              // and the field is empty or in a default
              // state, then display an error.
              if (!emptyStringAllowed) {
                if (value === '' || value === null || value === undefined) {
                  this.setState({ displayError: true })
                }
              }
              // If empty strings are allowed then never
              // display an error.
              else {
                this.setState({ displayError: false })
              }
            }}
          />
          <input
            className={
              togglePasswordContainerClassName +
              ' ' +
              fieldClassName +
              ' ' +
              uniqueInputClassName
            }
            onClick={() => this.togglePasswordDisplay()}
            type='button'
            value={this.state.displayPasswordText}
            disabled={inputTypePassed !== 'password'}
          />
        </div>
        <div className={fieldErrorClassName}>{errorMessage}</div>
      </div>
    )
  }
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
            if (
              value === '<p><br></p>' ||
              value === null ||
              value === undefined
            ) {
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
            if (
              value === '<p><br></p>' ||
              value === null ||
              value === undefined
            ) {
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
   * The initial value for the detail.
   */
  initialValue: string | null | undefined
  /**
   * The function to deliver the value.
   */
  deliverValue: (value: string) => void
  /**
   * The options available for the detail.
   */
  options?: {
    /**
     * The boolean that determines if the detail should display an error.
     * @default false
     */
    deliverError?: boolean
    /**
     * The error message to display if the detail has an error.
     * @default 'At least one character is required here.'
     */
    deliverErrorMessage?: string
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
     * @default false
     */
    emptyStringAllowed?: boolean
    /**
     * A boolean that will determine whether or not to show that the field
     * is optional.
     * @default false
     */
    displayOptionalText?: boolean
  }
}

/**
 * The state for the Detail component.
 */
type TDetail_S = {
  /**
   * The type of input to render (i.e., text, password, etc.).
   */
  inputType: TInput
  /**
   * The text to display for the password.
   */
  displayPasswordText: string
  /**
   * The current value for the detail.
   */
  currentValue: string | null | undefined
  /**
   * The boolean that determines if the detail should display an error.
   */
  displayError: boolean
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
