// This will render a detail for
// a form, with a label and a text

import React from 'react'
import { useEffect, useRef, useState } from 'react'
import inputs from '../../../modules/toolbox/inputs'
import './Form.scss'
import Toggle, { EToggleLockState } from '../user-controls/Toggle'
import Tooltip from '../communication/Tooltip'
import { AnyObject } from '../../../modules/toolbox/objects'

interface IDetail {
  label: string
  initialValue: string | null
  deliverValue: (value: string) => void
  options?: {
    deliverError?: boolean // defaults to false
    deliverErrorMessage?: string // defaults to ''
    uniqueLabelClassName?: string // defaults to ''
    uniqueInputClassName?: string // defaults to ''
    inputType?: string // defaults to 'text'
    placeholder?: string // defaults to undefined
  }
}

interface IDetail_S {}

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
 * @returns A JSX Element for the detail.
 */
export class Detail extends React.Component<IDetail, IDetail_S> {
  field: React.RefObject<HTMLInputElement> = React.createRef()
  allowAbilityToDisplayError: boolean = false

  // inherited
  componentDidMount(): void {
    let initialValue: string | null = this.props.initialValue
    let fieldElement: HTMLInputElement | null = this.field.current

    if (initialValue && fieldElement) {
      fieldElement.value = initialValue
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
    let inputType: string = this.props.options?.inputType
      ? this.props.options.inputType
      : 'text'
    let placeholder: string | undefined = this.props.options?.placeholder
    let fieldErrorClassName: string = 'FieldErrorMessage hide'
    let labelClassName: string = 'Label'
    let fieldClassName: string = 'Field FieldBox'

    if (displayError) {
      fieldClassName += ' Error'
      labelClassName += ' Error'
      fieldErrorClassName = 'FieldErrorMessage'
    }

    return (
      <div className='Detail'>
        <div
          className={labelClassName + ' ' + uniqueLabelClassName}
        >{`${label}:`}</div>
        <input
          className={fieldClassName + ' ' + uniqueInputClassName}
          type={inputType}
          ref={this.field}
          placeholder={placeholder}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            deliverValue(event.target.value)
          }}
          onBlur={(event: React.FocusEvent) => {
            let target: HTMLInputElement = event.target as HTMLInputElement
          }}
        />
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
 * @returns A JSX Element for the detail.
 */
export function DetailNumber(props: {
  label: string
  initialValue: number
  deliverValue: (value: number | null) => void
  options?: {
    minimum?: number // default null
    maximum?: number // default null
    integersOnly?: boolean // default false
    unit?: string // default ''
  }
}): JSX.Element | null {
  const field = useRef<HTMLInputElement>(null)
  const [mountHandled, setMountHandled] = useState<boolean>(false)

  let label: string = props.label
  let initialValue: number = props.initialValue
  let minimum: number | null =
    props.options?.minimum !== undefined ? props.options.minimum : null
  let maximum: number | null =
    props.options?.maximum !== undefined ? props.options.maximum : null
  let integersOnly: boolean = props.options?.integersOnly || false
  let unit: string = props.options?.unit || ''
  let deliverValue = props.deliverValue

  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled) {
      let fieldElement: HTMLInputElement | null = field.current

      if (fieldElement) {
        fieldElement.value = `${initialValue}`
      }

      setMountHandled(true)
    }
  }, [mountHandled])

  // render
  return (
    <div className='Detail DetailNumber'>
      <div className='Label'>{`${label}:`}</div>
      <div className='Unit'>{unit}</div>
      <input
        className='Field'
        type='text'
        ref={field}
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
          let value: number | null

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

          target.value = `${value}`

          deliverValue(value)
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
 * @param options.placeholder The placeholder for the input. Defaults to ''.
 * @returns A JSX Element for the detail.
 */
export function DetailBox(props: {
  label: string
  initialValue: string | null
  deliverValue: (value: string) => void
  options?: {
    deliverError?: boolean // default false
    deliverErrorMessage?: string // default ''
    disabled?: boolean // default false
    uniqueLabelClassName?: string // default ''
    uniqueInputClassName?: string // default ''
    placeholder?: string // default ''
  }
}): JSX.Element | null {
  const fieldOffsetHeight: number = 3

  const field = useRef<HTMLTextAreaElement>(null)
  const [mountHandled, setMountHandled] = useState<boolean>(false)

  let label: string = props.label
  let initialValue: string | null = props.initialValue
  let displayError: boolean = props.options?.deliverError
    ? props.options.deliverError
    : false
  let errorMessage: string = props.options?.deliverErrorMessage
    ? props.options?.deliverErrorMessage
    : ''
  let uniqueLabelClassName: string = props.options?.uniqueLabelClassName
    ? props.options.uniqueLabelClassName
    : ''
  let uniqueInputClassName: string = props.options?.uniqueInputClassName
    ? props.options.uniqueInputClassName
    : ''
  let disabled: boolean = props.options?.disabled === true
  let placeholder: string | undefined = props.options?.placeholder
  let deliverValue = props.deliverValue
  let className: string = 'Detail DetailBox'
  let fieldClassName: string = 'Field FieldBox'
  let labelClassName: string = 'Label'
  let fieldErrorClassName: string = 'FieldErrorMessage hide'

  /* -- COMPONENT EFFECTS -- */

  // Called when a change is made in the
  // in the field element. This will resize
  // the field based on the height of the
  // content.
  const resizeField = (): void => {
    let fieldElement: HTMLTextAreaElement | null = field.current

    if (fieldElement) {
      fieldElement.style.height = '1px'
      fieldElement.style.height = `${
        fieldOffsetHeight + fieldElement.scrollHeight
      }px`
    }
  }

  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled) {
      let fieldElement: HTMLTextAreaElement | null = field.current

      if (fieldElement && initialValue) {
        fieldElement.value = initialValue
        fieldElement.style.height = '1px'
        fieldElement.style.height = `${
          fieldOffsetHeight + fieldElement.scrollHeight
        }px`

        new ResizeObserver(() => resizeField()).observe(fieldElement)
      }

      setMountHandled(true)
    }
  }, [mountHandled])

  /* -- RENDER -- */

  if (disabled) {
    className += ' Disabled'
  }

  if (displayError) {
    fieldClassName += ' Error'
    labelClassName += ' Error'
    fieldErrorClassName = 'FieldErrorMessage'
  }

  return (
    <div className={className}>
      <div
        className={labelClassName + ' ' + uniqueLabelClassName}
      >{`${label}:`}</div>
      <textarea
        className={fieldClassName + ' ' + uniqueInputClassName}
        ref={field}
        placeholder={placeholder}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
          resizeField()
          deliverValue(event.target.value)
        }}
        onBlur={(event: React.FocusEvent) => {
          // let target: HTMLTextAreaElement = event.target as HTMLTextAreaElement
          resizeField()
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
 * @returns A JSX Element for the detail.
 */
export function DetailDropDown<TOption>(props: {
  label: string
  options: Array<TOption>
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
  }
}): JSX.Element | null {
  const [mountHandled, setMountHandled] = useState<boolean>(false)
  const [expanded, setExpanded] = useState<boolean>(false)

  let label: string = props.label
  let options: Array<TOption> = props.options
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
  let renderOptionClassName = props.renderOptionClassName
  let renderDisplayName = props.renderDisplayName
  let deliverValue = props.deliverValue
  let className: string = `Detail DetailDropDown ${uniqueClassName}`
  let fieldClassName: string = 'Field FieldDropDown'
  let allOptionsClassName: string = 'AllOptions'
  let optionClassName: string = 'Option'
  let labelClassName: string = 'Label'
  let currentValueClassName: string = 'Text'

  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled) {
      setMountHandled(true)
    }
  }, [mountHandled])

  if (expanded) {
    fieldClassName += ' IsExpanded'
  } else {
    fieldClassName += ' IsCollapsed'
    allOptionsClassName += 'Hidden'
  }

  if (currentValue) {
    // render
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
  // marks the form detail
  label: string
  // the default value for the input field
  initialValue: boolean
  // The toggle lock state of the toggle.
  // (See Toggle.tsx)
  lockState: EToggleLockState
  // the description displayed when hovered over
  tooltipDescription: string
  // class name to apply to the root element
  uniqueClassName: string
  // if an error message is needed then this is the
  // message that will be displayed
  errorMessage?: string
  // delivers what the user inputs so that
  // the parent component can track it
  deliverValue: (value: boolean) => void
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

  /* -- functions | render -- */

  // inherited
  render(): JSX.Element | null {
    let label: string = this.props.label
    let initialValue: boolean = this.props.initialValue
    let lockState: EToggleLockState = this.props.lockState
    let tooltipDescription: string = this.props.tooltipDescription
    let hideTooltip: boolean = tooltipDescription.length === 0
    let uniqueClassName: string = this.props.uniqueClassName
    let errorMessage: string | undefined = this.props.errorMessage
    let containerClassName: string = 'Detail DetailToggle'
    let fieldErrorClassName: string = 'FieldErrorMessage hide'

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

    return (
      <div className={containerClassName}>
        <label className='Label'>{label}</label>
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
