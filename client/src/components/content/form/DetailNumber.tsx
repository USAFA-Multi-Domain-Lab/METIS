import { compute } from '@client/toolbox'
import inputs from '@client/toolbox/inputs'
import { useEffect, useState } from 'react'
import type { TDetail_P } from '.'
import './DetailNumber.scss'
import DetailTitleRow from './DetailTitleRow'
import { useDetailClassNames } from './useDetailClassNames'

/**
 * This will render a detail for
 * a form, with a label and a number
 * field for entering information.
 */
export function DetailNumber({
  fieldType,
  label,
  value: stateValue,
  setValue: setState,
  // Optional Properties
  minimum = undefined,
  maximum = undefined,
  integersOnly = false,
  unit = undefined,
  placeholder = 'Enter a number here...',
  uniqueLabelClassName = undefined,
  uniqueFieldClassName = undefined,
  errorMessage = undefined,
  errorType = 'default',
  disabled = false,
  tooltipDescription = '',
}: TDetailNumber_P): TReactElement | null {
  /* -- STATE -- */
  const [inputValue, setInputValue] = useState<string>(
    stateValue?.toString() ?? '',
  )

  /* -- COMPUTED -- */
  /**
   * The boolean that determines if the
   * error message should be displayed.
   */
  const displayError: boolean = compute(() => errorMessage !== undefined)
  const { rootClasses, labelClasses, fieldClasses, fieldErrorClasses } =
    useDetailClassNames({
      componentName: 'DetailNumber',
      disabled,
      displayError,
      errorType,
      uniqueLabelClassName,
      uniqueFieldClassName,
    })
  /* -- EFFECTS -- */
  // Set the input value to the state value.
  useEffect(() => {
    const stateAsString = stateValue?.toString() ?? ''
    // Don't overwrite if user is typing a decimal (preserve trailing ".")
    // Use a functional update to avoid needing inputValue in dependencies
    setInputValue((currentInput) => {
      // Check if current input is the state value + "." (e.g. "12.")
      if (currentInput === stateAsString + '.') {
        return currentInput
      }
      return stateAsString
    })
  }, [stateValue])

  /* -- RENDER -- */
  return (
    <div className={rootClasses.value}>
      <DetailTitleRow
        label={label}
        labelClassName={labelClasses.value}
        tooltipDescription={tooltipDescription}
        fieldType={fieldType}
      />
      <input
        className={fieldClasses.value}
        type='text'
        placeholder={placeholder}
        value={inputValue}
        disabled={disabled}
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

          // Ensure the input value is a valid number.
          const inputValueRegex: RegExp = integersOnly
            ? /^[+-]?[0-9]{0,9}$/
            : /^[+-]?[0-9]{0,9}[.]?[0-9]{0,6}$/
          let isValidValue: boolean = inputValueRegex.test(target.value)

          // Update the input value to show user feedback
          if (isValidValue) {
            // *** @note - The setInputValue is called here so that
            // *** a user can see their input immediately (especially for
            // *** decimal points followed by numbers). The useEffect also
            // *** updates this when the state value changes externally.
            setInputValue(target.value)
          }

          // Convert the input's value to a number and
          // check if it is a number, then deliver the value.
          value = parseFloat(target.value)
          value = isNaN(value) ? null : value

          // Always update state with the parsed value, even if typing decimal.
          // The setInputValue above preserves the trailing decimal for UX.
          // If the value is valid, the field is required, the value is
          // not null, update the value.
          if (isValidValue && fieldType === 'required' && value !== null) {
            setState(value)
          }
          // If value is valid and the field is optional,
          // update the value.
          if ((isValidValue || value === null) && fieldType === 'optional') {
            setState(value)
          }
        }}
        onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
          let target: HTMLInputElement = event.target as HTMLInputElement

          // Enforce minimum and maximum values on blur
          let numValue = parseFloat(target.value)
          let isEmpty = target.value === '' || isNaN(numValue)

          // Handle empty required fields
          if (isEmpty && fieldType === 'required') {
            if (minimum !== undefined && minimum > 0) {
              target.value = minimum.toString()
            } else if (maximum !== undefined && maximum < 0) {
              target.value = maximum.toString()
            } else {
              target.value = '0'
            }
            // Recalculate after setting default value
            numValue = parseFloat(target.value)
            isEmpty = false
          }

          // Enforce minimum constraint
          if (!isEmpty && minimum !== undefined && numValue < minimum) {
            target.value = minimum.toString()
            numValue = minimum
          }

          // Enforce maximum constraint
          if (!isEmpty && maximum !== undefined && numValue > maximum) {
            target.value = maximum.toString()
          }

          // Ensure the input value is a valid number.
          const zerosTrailingDecimalPoint: RegExp = /^[-+]{0,1}[0-9]+[.]+[0]+$/
          const zerosTrailingNumbers: RegExp = /^[-+]{0,1}[0-9]+[.]+[0-9]+[0]+$/
          const zerosLeadingDecimalPoint: RegExp = /^[0]+[0-9]+/
          const zerosLeadingNumbers: RegExp = /^[0]+[1-9]+[0-9]*[.]?[0-9]*/

          // If decimals are allowed, then remove
          // unnecessary leading and trailing zeros.
          if (!integersOnly) {
            // Example: 128. -> 128
            if (target.value.endsWith('.')) {
              target.value = target.value.slice(0, -1)
            }
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

          // Update the state value with the parsed number
          let finalValue = parseFloat(target.value)
          if (!isNaN(finalValue)) {
            setState(finalValue)
          } else if (fieldType === 'optional') {
            setState(null)
          }
        }}
      />
      {unit && <div className='Unit'>{unit}</div>}
      <div className={fieldErrorClasses.value}>{errorMessage}</div>
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
