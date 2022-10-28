// This will render a detail for
// a form, with a label and a text

import React from 'react'
import { useEffect, useRef, useState } from 'react'
import inputs from '../../modules/toolbox/inputs'
import './Form.scss'
import Toggle from './Toggle'
import Tooltip from './Tooltip'

// field for entering information.
export function Detail(props: {
  label: string
  initialValue: string
  deliverValue: (value: string) => void
}): JSX.Element | null {
  const field = useRef<HTMLInputElement>(null)
  const [mountHandled, setMountHandled] = useState<boolean>()

  let label: string = props.label
  let initialValue: string = props.initialValue
  let deliverValue = props.deliverValue

  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled) {
      let fieldElement: HTMLInputElement | null = field.current

      if (fieldElement) {
        fieldElement.value = initialValue
      }

      setMountHandled(true)
    }
  }, [mountHandled])

  return (
    <div className='Detail'>
      <div className='Label'>{`${label}:`}</div>
      <input
        className='Field'
        type='text'
        ref={field}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          deliverValue(event.target.value)
        }}
      />
    </div>
  )
}

// This will render a detail for
// a form, with a label and a number
// field for entering information.
export function DetailNumber(props: {
  label: string
  initialValue: number
  minimum?: number // default null
  maximum?: number // default null
  integersOnly?: boolean // default false
  unit?: string // default ''
  deliverValue: (value: number | null) => void
}): JSX.Element | null {
  const field = useRef<HTMLInputElement>(null)
  const [mountHandled, setMountHandled] = useState<boolean>()

  let label: string = props.label
  let initialValue: number = props.initialValue
  let minimum: number | null =
    props.minimum !== undefined ? props.minimum : null
  let maximum: number | null =
    props.maximum !== undefined ? props.maximum : null
  let integersOnly: boolean = props.integersOnly || false
  let unit: string = props.unit || ''
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

// This will render a detail for
// a form, with a label and a text
// field for entering information.
export function DetailBox(props: {
  label: string
  initialValue: string
  disabled?: boolean
  deliverValue: (value: string) => void
}): JSX.Element | null {
  const fieldOffsetHeight: number = 3

  const field = useRef<HTMLTextAreaElement>(null)
  const [mountHandled, setMountHandled] = useState<boolean>()

  let label: string = props.label
  let initialValue: string = props.initialValue
  let disabled: boolean = props.disabled === true
  let deliverValue = props.deliverValue
  let className: string = 'Detail DetailBox'

  // Called when a change is made in the
  // in the field element. This will resize
  // the field based on the height of the
  // content.
  const resizeField = (
    event:
      | React.KeyboardEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ): void => {
    let fieldElement: HTMLTextAreaElement = event.target as HTMLTextAreaElement

    fieldElement.style.height = '1px'
    fieldElement.style.height = `${
      fieldOffsetHeight + fieldElement.scrollHeight
    }px`
  }

  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled) {
      let fieldElement: HTMLTextAreaElement | null = field.current

      if (fieldElement) {
        fieldElement.value = initialValue
        fieldElement.style.height = '1px'
        fieldElement.style.height = `${
          fieldOffsetHeight + fieldElement.scrollHeight
        }px`
      }

      setMountHandled(true)
    }
  }, [mountHandled])

  if (disabled) {
    className += ' Disabled'
  }

  // render
  return (
    <div className={className}>
      <div className='Label'>{`${label}:`}</div>
      <textarea
        className='Field FieldBox'
        ref={field}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
          resizeField(event)
          deliverValue(event.target.value)
        }}
      />
    </div>
  )
}

// THis will render a detail for
// a form, with a label and a drop
// down box for selecting from various
// options.

export function DetailDropDown(props: {
  label: string
  options: Array<string>
  currentValue: string
  uniqueClassName?: string
  deliverValue: (value: string) => void
}): JSX.Element | null {
  const field = useRef<HTMLTextAreaElement>(null)
  const [mountHandled, setMountHandled] = useState<boolean>()
  const [expanded, setExpanded] = useState<boolean>(false)

  let label: string = props.label
  let options: Array<string> = props.options
  let currentValue: string = props.currentValue
  let uniqueClassName: string = props.uniqueClassName
    ? props.uniqueClassName
    : ''
  let deliverValue = props.deliverValue
  let className: string = `Detail DetailDropDown ${uniqueClassName}`
  let fieldClassName: string = 'Field FieldDropDown'

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
  }

  // render
  return (
    <div className={className}>
      <div className='Label'>{`${label}:`}</div>
      <div className={fieldClassName}>
        <div
          className='Option Selected'
          onClick={() => {
            setExpanded(!expanded)
          }}
        >
          <div className='Text'>{currentValue}</div>
          <div className='Indicator'>v</div>
        </div>
        {options.map((option: string) => {
          return (
            <div
              className='Option'
              key={`option_${option}`}
              onClick={() => {
                deliverValue(option)
                setExpanded(false)
              }}
            >
              {option}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export interface IDetailToggle_P {
  // marks the form detail
  label: string
  // the default value for the input field
  initialValue: boolean
  // the description displayed when hovered over
  tooltipDescription: string
  // class name to apply to the root element
  uniqueClassName: string
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
    let tooltipDescription: string = this.props.tooltipDescription
    let hideTooltip: boolean = tooltipDescription.length === 0
    let uniqueClassName: string = this.props.uniqueClassName
    let className: string = 'Detail DetailToggle'
    if (uniqueClassName.length > 0) {
      className += ` ${uniqueClassName}`
    }
    tooltipDescription = `#### ${label}\n${tooltipDescription}`
    return (
      <div className={className}>
        <label className='Label'>{label}</label>
        <div className='Field'>
          <Toggle
            initiallyActivated={initialValue}
            deliverValue={this.props.deliverValue}
          />
        </div>
        {hideTooltip ? null : <Tooltip description={tooltipDescription} />}
      </div>
    )
  }
}
