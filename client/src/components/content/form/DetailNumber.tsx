import { useEffect, useState } from 'react'
import { compute } from 'src/toolbox'
import inputs from 'src/toolbox/inputs'
import { TDetail_P } from '.'
import './DetailNumber.scss'

/**
 * This will render a detail for
 * a form, with a label and a number
 * field for entering information.
 */
export function DetailNumber({
  fieldType,
  label,
  stateValue,
  setState,
  // Optional Properties
  minimum = undefined,
  maximum = undefined,
  integersOnly = false,
  unit = undefined,
  placeholder = 'Enter a number here...',
  uniqueLabelClassName = undefined,
  uniqueFieldClassName = undefined,
  disabled = false,
}: TDetailNumber_P): JSX.Element | null {
  /* -- STATE -- */
  const [inputValue, setInputValue] = useState<string>(
    stateValue?.toString() ?? '',
  )
  const [selectTarget, setSelectTarget] = useState<boolean>(false)

  /* -- COMPUTED -- */
  /**
   * The class name for the detail.
   */
  const rootClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Detail', 'DetailNumber']

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

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the optional text.
   */
  const optionalClassName: string = compute(() =>
    fieldType === 'optional' ? 'Optional' : 'Optional Hidden',
  )

  /* -- EFFECTS -- */
  // Set the input value to the state value.
  useEffect(() => {
    setInputValue(stateValue?.toString() ?? '')
  }, [stateValue])

  /* -- RENDER -- */
  return (
    <div className={rootClassName}>
      <div className='TitleContainer'>
        <div className={labelClassName}>{label}:</div>
        <div className={optionalClassName}>optional</div>
      </div>
      <div className='Unit'>{unit}</div>
      <input
        className={fieldClassName}
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
          if (minimum !== undefined && minimum >= 0) {
            inputs.enforceNonNegativeOnly(event)
          }
        }}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          let target: HTMLInputElement = event.target as HTMLInputElement
          let value: number | null

          // If a minimum or maximum value is passed
          // then enforce the minimum and maximum values.
          if (minimum !== undefined) {
            inputs.enforceNumberFloor(event, minimum)
          }
          if (maximum !== undefined) {
            inputs.enforceNumberCap(event, maximum)
          }

          // If the field is required and the input value is empty...
          if (fieldType === 'required' && target.value === '') {
            // ...but the minimum value is greater than 0,
            // then set the input's value to the minimum value.
            if (minimum !== undefined && minimum > 0) {
              target.value = minimum.toString()
            }
            // Or, if the maximum value is less than 0,
            // then set the input's value to the maximum value.
            else if (maximum !== undefined && maximum < 0) {
              target.value = maximum.toString()
            }
            // Otherwise, set the input's value to 0.
            else {
              target.value = '0'
            }

            setSelectTarget(true)
          }

          // Ensure the input value is a valid number.
          const inputValueRegex: RegExp = /^[0-9+-]+[.]?[0-9]{0,6}$/
          let isValidValue: boolean = inputValueRegex.test(target.value)

          // If decimals are allowed and the input value
          // is valid, then set the input value.
          if (isValidValue && !integersOnly) {
            // *** @note - The setInputValue is only called here so that
            // *** a user can enter a decimal point followed by any set
            // *** of (6) numbers. Otherwise, the input value is set in
            // *** the useEffect hook which is called when the state value
            // *** changes.
            setInputValue(target.value)
          }

          // Convert the input's value to a number and
          // check if it is a number, then deliver the value.
          value = parseFloat(target.value)
          value = isNaN(value) ? null : value

          // If the value is valid, the field is required, and
          // the value is not null, update the value.
          if (isValidValue && fieldType === 'required' && value !== null) {
            setState(value)
          }
          // If value is valid and the field is optional,
          // update the value.
          if (isValidValue && fieldType === 'optional') {
            setState(value)
          }
        }}
        onKeyUp={(event: React.KeyboardEvent<HTMLInputElement>) => {
          if (selectTarget) {
            let target: HTMLInputElement = event.target as HTMLInputElement
            target.select()
            setSelectTarget(false)
          }
        }}
        onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
          let target: HTMLInputElement = event.target as HTMLInputElement

          // Ensure the input value is a valid number.
          const zerosTrailingDecimalPoint: RegExp = /^[0-9+-]+[.]+[0]+$/
          const zerosTrailingNumbers: RegExp = /^[0-9+-]+[.]+[0-9]+[0]+$/
          const zerosLeadingDecimalPoint: RegExp = /^[0]+[0-9]+/
          const zerosLeadingNumbers: RegExp = /^[0]+[1-9]+[0-9]*[.]?[0-9]*/

          // If decimals are allowed, then remove
          // unnecessary leading and trailing zeros.
          if (!integersOnly) {
            // Example: 1.0000 -> 1
            if (zerosTrailingDecimalPoint.test(target.value)) {
              target.value = target.value.replace(/[.]+[0]*$/, '')
            }
            // Example: 1.2000 -> 1.2
            if (zerosTrailingNumbers.test(target.value)) {
              target.value = target.value.replace(/[0]+$/, '')
            }
            // Example: 000000.5 -> 0.5
            if (zerosLeadingDecimalPoint.test(target.value)) {
              target.value = target.value.replace(/^[0]+/, '0')
            }
            // Example: 000000123 -> 123
            if (zerosLeadingNumbers.test(target.value)) {
              target.value = target.value.replace(/^[0]+/, '')
            }
          }

          // Update the input value.
          setInputValue(target.value)
        }}
      />
    </div>
  )
}

/* ---------------------------- TYPES FOR DETAIL NUMBER ---------------------------- */

/**
 * The properties for the Detail Number component.
 */
type TDetailNumber_P = TDetail_P<number | null> & {
  /**
   * The placeholder for the input.
   * @default 'Enter [input value type] here...'
   * @note The default value is determined by the input type.
   * For example, if the input type is 'text', then the default
   * value will be 'Enter text here...'.
   */
  placeholder?: string
  /**
   * The minimum value allowed for the detail.
   */
  minimum?: number
  /**
   * The maximum value allowed for the detail.
   */
  maximum?: number
  /**
   * The boolean that determines if the detail should only allow integers.
   * @default false
   */
  integersOnly?: boolean
  /**
   * The unit to display after the detail.
   */
  unit?: string
}
