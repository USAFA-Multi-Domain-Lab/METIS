// This will render a detail for
// a form, with a label and a text

import React from 'react'
import { useEffect, useRef, useState } from 'react'
import inputs from 'src/toolbox/inputs'
import './Form.scss'
import Toggle, { EToggleLockState } from '../user-controls/Toggle'
import Tooltip from '../communication/Tooltip'
import { AnyObject } from '../../../../../shared/toolbox/objects'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

interface IDetail {
  label: string
  initialValue: string | null | undefined
  deliverValue: (value: string) => void
  options?: {
    deliverError?: boolean // defaults to false
    deliverErrorMessage?: string // defaults to ''
    uniqueLabelClassName?: string // defaults to ''
    uniqueInputClassName?: string // defaults to ''
    inputType?: TInput // defaults to 'text'
    placeholder?: string // defaults to undefined
    clearField?: boolean // defaults to false
    displayRequiredIcon?: boolean // defaults to false
  }
}

interface IDetail_S {
  inputType: string
  displayPasswordText: string
}

/**
 * This will render a detail for
 * a form, with a label and a text
 * field for entering information.
 * @param label The label for the detail.
 * @param initialValue The initial value for the detail.
 * @param deliverValue The function to deliver the value.
 * @param options The options available for the detail.
 * @param options.deliverError The boolean that determines if the detail should display an error. Defaults to false.
 * @param options.deliverErrorMessage The error message to display. Defaults to ''.
 * @param options.uniqueLabelClassName The unique class name for the label. Defaults to ''.
 * @param options.uniqueInputClassName The unique class name for the input. Defaults to ''.
 * @param options.inputType The type of input to render (i.e., text, password, etc.). Defaults to text.
 * @param options.placeholder The placeholder for the input. Defaults to undefined.
 * @param options.clearField The boolean that determines if the detail should clear the field. Defaults to false.
 * @param options.displayRequiredIcon The boolean that determines if the detail should display a required icon. Defaults to false.
 * @returns A JSX Element for the detail.
 */
export class Detail extends React.Component<IDetail, IDetail_S> {
  field: React.RefObject<HTMLInputElement> = React.createRef()

  constructor(props: IDetail, state: IDetail_S) {
    super(props)

    this.state = {
      inputType: this.props.options?.inputType
        ? this.props.options.inputType
        : 'text',
      displayPasswordText: 'show',
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
    let displayError: boolean = this.props.options?.deliverError
      ? this.props.options.deliverError
      : false
    let errorMessage: string = this.props.options?.deliverErrorMessage
      ? this.props.options.deliverErrorMessage
      : ''
    let uniqueLabelClassName: string = this.props.options?.uniqueLabelClassName
      ? this.props.options.uniqueLabelClassName
      : ''
    let uniqueInputClassName: string = this.props.options?.uniqueInputClassName
      ? this.props.options.uniqueInputClassName
      : ''
    let inputTypePassed: string = this.props.options?.inputType
      ? this.props.options.inputType
      : 'text'
    let placeholder: string | undefined =
      this.props.options?.placeholder || 'Enter text...'
    let clearField: boolean = this.props.options?.clearField || false
    let displayRequiredIcon: boolean =
      this.props.options?.displayRequiredIcon || false

    /* -- PRE-RENDER PROCESSING -- */

    // Default class names
    let fieldErrorClassName: string = 'FieldErrorMessage hide'
    let labelClassName: string = 'Label'
    let fieldClassName: string = 'Field FieldBox'
    let inputContainerClassName: string = 'InputContainer'
    let togglePasswordContainerClassName: string =
      'TogglePasswordDisplayContainer Hidden'
    let requiredIconClassName: string = 'Required'

    if (displayError) {
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

    // If a boolean that is equivalent
    // to true is passed, then the
    // field will display a required
    // icon.
    if (displayRequiredIcon === undefined || !displayRequiredIcon) {
      requiredIconClassName += ' Hidden'
    }

    /* -- RENDER -- */

    return (
      <div className='Detail'>
        <div className={labelClassName + ' ' + uniqueLabelClassName}>
          {`${label}`}
          <sup className={requiredIconClassName}> *</sup>
        </div>
        <div className={inputContainerClassName}>
          <input
            className={fieldClassName + ' ' + uniqueInputClassName}
            type={this.state.inputType}
            ref={this.field}
            placeholder={placeholder}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              deliverValue(event.target.value)
            }}
            // onBlur={(event: React.FocusEvent) => {
            //   let target: HTMLInputElement = event.target as HTMLInputElement
            // }}
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
 * @param options.displayRequiredIcon The boolean that determines if the detail should display a required icon. Defaults to false.
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
    displayRequiredIcon?: boolean // default false
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
  let displayRequiredIcon: boolean = props.options?.displayRequiredIcon || false
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
  let requiredIconClassName: string = 'Required'

  // If a boolean that is equivalent
  // to true is passed, then the
  // field will be cleared, or reset.
  if (clearField && field.current) {
    field.current.value = ''
  }

  // If a boolean that is equivalent
  // to true is passed, then the
  // field will display a required
  // icon.
  if (displayRequiredIcon === undefined || !displayRequiredIcon) {
    requiredIconClassName += ' Hidden'
  }

  /* -- RENDER -- */
  return (
    <div className='Detail DetailNumber'>
      <div className={labelClassName + ' ' + uniqueLabelClassName}>
        {`${label}`}
        <sup className={requiredIconClassName}> *</sup>
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
 * @param options.displayRequiredIcon The boolean that determines if the detail should display a required icon. Defaults to false.
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
    displayRequiredIcon?: boolean // default false
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
    props.options?.placeholder || 'Enter text here...'
  let emptyStringAllowed: boolean = props.options?.emptyStringAllowed || false
  let elementBoundary: string | undefined = props.options?.elementBoundary
  let clearField: boolean = props.options?.clearField || false
  let displayRequiredIcon: boolean = props.options?.displayRequiredIcon || false
  let deliverValue = props.deliverValue

  /* -- COMPONENT STATE -- */
  const [isEmptyString, setIsEmptyString] = useState<boolean>(false)
  const [_, setValue] = useState<string>('')

  /* -- COMPONENT EFFECTS -- */
  useEffect(() => {
    // If a boolean that is equivalent
    // to true is passed, then the
    // field will be cleared, or reset.
    if (clearField) {
      setValue('')
      deliverValue('')
    }
  }, [clearField])

  /* -- PRE-RENDER PROCESSING -- */

  // Default class names
  let className: string = 'Detail DetailBox'
  let fieldClassName: string = 'Field FieldBox'
  let labelClassName: string = 'Label'
  let fieldErrorClassName: string = 'FieldErrorMessage hide'
  let requiredIconClassName: string = 'Required'

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

  // If a boolean that is equivalent
  // to true is passed, then the
  // field will display a required
  // icon.
  if (displayRequiredIcon === undefined || !displayRequiredIcon) {
    requiredIconClassName += ' Hidden'
  }

  /* -- RENDER -- */

  return (
    <div className={className}>
      <div className={labelClassName + ' ' + uniqueLabelClassName}>
        {`${label}`}
        <sup className={requiredIconClassName}> *</sup>
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

          // Equivalent to an empty string.
          if (!emptyStringAllowed && value !== '<p><br></p>') {
            setIsEmptyString(false)
            setValue(value)
          } else if (emptyStringAllowed && value === '<p><br></p>') {
            setIsEmptyString(false)
            setValue(value)
          }
        }}
        onBlur={(
          previousSelection: ReactQuill.Range,
          source: any,
          editor: ReactQuill.UnprivilegedEditor,
        ) => {
          let value: string = editor.getHTML()

          if (!emptyStringAllowed && value === '<p><br></p>') {
            setIsEmptyString(true)
          } else if (emptyStringAllowed && value === '<p><br></p>') {
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
 * @param props.label The label for the detail.
 * @param props.options The options available for the detail.
 * @param props.currentValue The current value for the detail.
 * @param props.isExpanded The boolean that determines if the detail is expanded.
 * @param props.uniqueDropDownStyling The unique styling for the drop down.
 * @param props.uniqueOptionStyling The unique styling for the options.
 * @param props.renderOptionClassName The function to render the class name for the option.
 * @param props.renderDisplayName The function to render the display name for the option.
 * @param props.deliverValue The function to deliver the value.
 * @param props.optional.uniqueClassName The unique class name for the detail. Defaults to ''.
 * @param props.optional.uniqueLabelClassName The unique class name for the label. Defaults to ''.
 * @param props.optional.uniqueFieldClassName The unique class name for the field. Defaults to ''.
 * @param props.optional.uniqueCurrentValueClassName The unique class name for the current value. Defaults to ''.
 * @param props.optional.clearField The boolean that determines if the detail should clear the field. Defaults to false.
 * @returns A JSX Element for the detail.
 */
export function DetailDropDown<TOption>(props: {
  label: string
  options: TOption[]
  currentValue: TOption | null | undefined
  isExpanded: boolean
  uniqueDropDownStyling: AnyObject
  uniqueOptionStyling: (option: TOption) => AnyObject
  renderOptionClassName: (option: TOption) => string
  renderDisplayName: (option: TOption) => string
  deliverValue: (value: TOption) => void
  optional?: {
    uniqueClassName?: string
    uniqueLabelClassName?: string
    uniqueFieldClassName?: string
    uniqueCurrentValueClassName?: string
    clearField?: boolean
    displayRequiredIcon?: boolean
  }
}): JSX.Element | null {
  /* -- COMPONENT VARIABLES -- */
  let label: string = props.label
  let options: TOption[] = props.options
  let currentValue: TOption | null | undefined = props.currentValue
  let isExpanded: boolean = props.isExpanded
  let uniqueDropDownStyling: AnyObject = props.uniqueDropDownStyling
  let uniqueOptionStyling = props.uniqueOptionStyling
  let uniqueClassName: string = props.optional?.uniqueClassName
    ? props.optional.uniqueClassName
    : ''
  let uniqueLabelClassName: string = props.optional?.uniqueLabelClassName
    ? props.optional.uniqueLabelClassName
    : ''
  let uniqueFieldClassName: string = props.optional?.uniqueFieldClassName
    ? props.optional.uniqueFieldClassName
    : ''
  let uniqueCurrentValueClassName: string = props.optional
    ?.uniqueCurrentValueClassName
    ? props.optional.uniqueCurrentValueClassName
    : ''
  let clearField: boolean = props.optional?.clearField || false
  let displayRequiredIcon: boolean =
    props.optional?.displayRequiredIcon || false
  let renderOptionClassName = props.renderOptionClassName
  let renderDisplayName = props.renderDisplayName
  let deliverValue = props.deliverValue

  /* -- COMPONENT STATE -- */
  const [expanded, setExpanded] = useState<boolean>(false)

  /* -- COMPONENT EFFECTS -- */
  useEffect(() => {
    if (clearField) {
      setExpanded(false)
      currentValue = null
    }
  }, [clearField])

  /* -- PRE-RENDER PROCESSING -- */

  // Default class names
  let className: string = `Detail DetailDropDown ${uniqueClassName}`
  let fieldClassName: string = 'Field FieldDropDown'
  let allOptionsClassName: string = 'AllOptions'
  let optionClassName: string = 'Option'
  let labelClassName: string = 'Label'
  let currentValueClassName: string = 'Text'
  let requiredIconClassName: string = 'Required'

  if (expanded) {
    fieldClassName += ' IsExpanded'
  } else {
    fieldClassName += ' IsCollapsed'
    allOptionsClassName += 'Hidden'
  }

  // If a boolean that is equivalent
  // to true is passed, then the
  // field will display a required
  // icon.
  if (displayRequiredIcon === undefined || !displayRequiredIcon) {
    requiredIconClassName += ' Hidden'
  }

  /* -- RENDER -- */
  if (currentValue) {
    return (
      <div className={className} style={uniqueDropDownStyling}>
        <div className={labelClassName + ' ' + uniqueLabelClassName}>
          {`${label}`}
          <sup className={requiredIconClassName}> *</sup>
        </div>
        <div className={fieldClassName + ' ' + uniqueFieldClassName}>
          <div
            className='Option Selected'
            onClick={() => {
              setExpanded(!expanded)
            }}
          >
            <div
              className={
                currentValueClassName + ' ' + uniqueCurrentValueClassName
              }
            >
              {renderDisplayName(currentValue)}
            </div>
            <div className='Indicator'>v</div>
          </div>
          <div className={allOptionsClassName}>
            {options.map((option: TOption) => {
              return (
                <div
                  className={`Option ${renderOptionClassName(option)}`}
                  style={uniqueOptionStyling(option)}
                  key={`option_${renderDisplayName(option)}`}
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
  } else if (currentValue === null || currentValue === undefined) {
    return (
      <div className={className} style={uniqueDropDownStyling}>
        <div
          className={labelClassName + ' ' + uniqueLabelClassName}
        >{`${label}:`}</div>
        <div className={fieldClassName + ' ' + uniqueFieldClassName}>
          <div
            className='Option Selected'
            onClick={() => {
              setExpanded(!expanded)
            }}
          >
            <div
              className={
                currentValueClassName + ' ' + uniqueCurrentValueClassName
              }
            >
              Select an option
            </div>
            <div className='Indicator'>v</div>
          </div>
          <div className={allOptionsClassName}>
            {options.map((option: TOption) => {
              return (
                <div
                  className={optionClassName}
                  style={uniqueOptionStyling(option)}
                  key={`option_${renderDisplayName(option)}`}
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

export interface IDetailToggle_P {
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
     * Determines if the detail should display a required icon. Defaults to false.
     */
    displayRequiredIcon?: boolean
  }
}

interface IDetailToggle_S {}

// A field in a form that consists of a label
// and an on/off toggle.
export class DetailToggle extends React.Component<
  IDetailToggle_P,
  IDetailToggle_S
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
    prevProps: Readonly<IDetailToggle_P>,
    prevState: Readonly<IDetailToggle_S>,
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
    let displayRequiredIcon: boolean | undefined =
      this.props.options?.displayRequiredIcon

    /* -- PRE-RENDER PROCESSING -- */

    // Default class names
    let containerClassName: string = 'Detail DetailToggle'
    let fieldErrorClassName: string = 'FieldErrorMessage hide'
    let requiredIconClassName: string = 'Required'

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

    if (displayRequiredIcon === undefined || !displayRequiredIcon) {
      requiredIconClassName += ' Hidden'
    }

    /* -- RENDER -- */

    return (
      <div className={containerClassName}>
        <label className='Label'>
          {label}
          <sup className={requiredIconClassName}> *</sup>
        </label>
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
