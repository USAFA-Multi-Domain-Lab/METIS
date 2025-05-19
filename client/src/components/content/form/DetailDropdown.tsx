import { ReactNode, useEffect, useState } from 'react'
import { compute } from 'src/toolbox'
import { TDetailBase_P, TDetailOptional_P, TDetailRequired_P } from '.'
import Tooltip from '../communication/Tooltip'
import './DetailDropdown.scss'

/**
 * This will render a detail for
 * a form, with a label and a drop
 * down box for selecting from various
 * options.
 * @note If `TOption` can be null or undefined, passing null or undefined
 * will leave the Dropdown box unselected.
 */
export function DetailDropdown<TOption>({
  fieldType,
  label,
  options,
  stateValue,
  setState,
  handleInvalidOption,
  isExpanded,
  render,
  getKey,
  // Optional Properties
  uniqueClassName = undefined,
  uniqueLabelClassName = undefined,
  uniqueFieldClassName = undefined,
  uniqueStateValueClassName = undefined,
  disabled = false,
  tooltipDescription = '',
  emptyText = 'Select an option',
}: TDetailDropdown_P<TOption>): JSX.Element | null {
  /* -- STATE -- */
  const [expanded, setExpanded] = useState<boolean>(false)

  /* -- COMPUTED -- */

  /**
   * The class name for the detail.
   */
  const rootClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Detail', 'DetailDropdown']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueClassName) {
      classList.push(uniqueClassName)
    }

    // If disabled is true then add the
    // disabled class name.
    if (disabled) {
      classList.push('Disabled')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the field.
   */
  const fieldClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Field', 'FieldDropdown']

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
   * The class name for the state value.
   */
  const stateValueClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Text']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueStateValueClassName) {
      classList.push(uniqueStateValueClassName)
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The value displayed.
   */
  const valueDisplayed: ReactNode = compute(() => {
    // If the current value is not null
    // or undefined then display it.
    if (stateValue !== null && stateValue !== undefined) {
      return render(stateValue)
    }
    // If the current value is null and a default
    // value is not passed, then display a message
    // that indicates an option should be selected.
    else {
      return emptyText
    }
  })
  /**
   * The class name for the optional text.
   */
  const optionalClassName: string = compute(() => {
    return fieldType === 'optional' ? 'Optional' : 'Hidden'
  })
  /**
   * The class name for the info icon.
   */
  const infoClassName: string = compute(() =>
    tooltipDescription ? 'DetailInfo' : 'Hidden',
  )
  /**
   * Determines if the warning icon should be displayed.
   */
  const displayWarning: boolean = compute(() => {
    if (
      fieldType === 'required' &&
      handleInvalidOption.method === 'warning' &&
      !options.includes(stateValue)
    ) {
      return true
    } else if (
      fieldType === 'optional' &&
      handleInvalidOption.method === 'warning' &&
      stateValue &&
      !options.includes(stateValue)
    ) {
      return true
    } else {
      return false
    }
  })

  /**
   * The class name for the warning icon.
   */
  const warningClassName: string = compute(() =>
    displayWarning ? 'Warning' : 'Hidden',
  )
  /**
   * The tooltip description for the warning icon.
   */
  const warningTooltipDescription: string = compute(() => {
    if (handleInvalidOption.method === 'warning') {
      return handleInvalidOption.message ?? ''
    } else {
      return ''
    }
  })

  // If the list of options changes, then
  // determine if the state value is still
  // a valid option.
  useEffect(() => {
    // If the selected option is not in the list
    // of options, then handle the invalid option
    // based on the method provided.
    if (fieldType === 'required' && !options.includes(stateValue)) {
      switch (handleInvalidOption.method) {
        case 'setToDefault':
          setState(handleInvalidOption.defaultValue)
          break
        case 'setToFirst':
          setState(options[0])
          break
      }
    } else if (
      fieldType === 'optional' &&
      stateValue &&
      !options.includes(stateValue)
    ) {
      switch (handleInvalidOption.method) {
        case 'setToDefault':
          setState(handleInvalidOption.defaultValue)
          break
        case 'setToFirst':
          setState(options[0])
          break
      }
    }
  }, [options, handleInvalidOption.method])

  /* -- PRE-RENDER PROCESSING -- */

  const optionsJsx: Array<JSX.Element | null> = compute(() => {
    switch (fieldType) {
      case 'required': {
        return options.map((option) => {
          return (
            <div
              className='Option'
              key={getKey(option)}
              onClick={() => {
                setState(option)
                setExpanded(isExpanded)
              }}
            >
              {render(option)}
            </div>
          )
        })
      }
      case 'optional': {
        let newOptions = [null, ...options]

        return newOptions.map((option, index) => {
          if (index > 0 && option === null) return null

          if (index === 0 && option === null) {
            return (
              <div
                className='Option'
                key={`initial-null-value`}
                onClick={() => {
                  setState(null)
                  setExpanded(isExpanded)
                }}
              >
                {emptyText}
              </div>
            )
          }

          return (
            <div
              className='Option'
              key={getKey(option)}
              onClick={() => {
                setState(option)
                setExpanded(isExpanded)
              }}
            >
              {render(option)}
            </div>
          )
        })
      }
    }
  })

  /* -- RENDER -- */

  if (options.length === 0 && fieldType === 'required') return null

  return (
    <div className={rootClassName}>
      <div className='TitleRow'>
        <div className='TitleColumnOne'>
          <div className={labelClassName}>{label}</div>
          <sup className={infoClassName}>
            i
            <Tooltip description={tooltipDescription} />
          </sup>
          <div className={warningClassName}>
            <Tooltip description={warningTooltipDescription} />
          </div>
        </div>
        <div className={'TitleColumnTwo'}>
          <div className={optionalClassName}>optional</div>
        </div>
      </div>
      <div className={fieldClassName}>
        <div className='Option Selected' onClick={() => setExpanded(!expanded)}>
          <div className={stateValueClassName}>{valueDisplayed}</div>
          <div className='Indicator'>v</div>
        </div>
        <div className={allOptionsClassName}>{optionsJsx}</div>
      </div>
    </div>
  )
}

/* ---------------------------- TYPES FOR DETAIL DROPDOWN ---------------------------- */

/**
 * The base properties for the Detail Dropdown component.
 */
type TDetailDropdownBase_P = TDetailBase_P & {
  /**
   * The boolean that determines if the detail is expanded.
   */
  isExpanded: boolean

  /**
   * The unique class name for the detail.
   */
  uniqueClassName?: string
  /**
   * The unique class name for the current value.
   */
  uniqueStateValueClassName?: string
  /**
   * @note This is disabled for Dropdown details.
   */
  errorMessage?: undefined
  /**
   * The text to display when the value is not set.
   */
  emptyText?: string
}

/**
 * The properties for the Detail Dropdown component.
 */
type TDetailDropdown_P<TOption> =
  | TDetailDropdownRequired_P<TOption>
  | TDetailDropdownOptional_P<TOption | null>

/**
 * The required properties for the Detail Dropdown component.
 */
type TDetailDropdownRequired_P<TOption> = TDetailRequired_P<TOption> &
  TDetailDropdownBase_P & {
    /**
     * The options available for the detail.
     */
    options: NonNullable<TOption>[]
    /**
     * The function to render the display name for the option.
     */
    render: (option: NonNullable<TOption>) => ReactNode
    /**
     * Gets the key for the given option.
     * @param option The option for which to get the key.
     * @returns The key for the given option.
     */
    getKey: (option: NonNullable<TOption>) => string
    /**
     * How to handle the selected option if it's invalid or not in the list.
     * @methods
     * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
     * - `setToFirst` - Set the selected option to the first option in the list.
     * - `warning` - Display a warning icon.
     *
     * @example
     * ```
     * handleInvalidOption={{
     *  method: 'setToDefault',
     *  defaultValue: new Object()
     * }}
     * ```
     *
     * @example
     * ```
     * handleInvalidOption={{
     * method: 'setToFirst'
     * }}
     * ```
     *
     * @example
     * ```
     * handleInvalidOption={{
     * method: 'warning',
     * message: 'This is a warning message.'
     * }}
     * ```
     */
    handleInvalidOption: TRequiredHandleInvalidOption<TOption>
  }

/**
 * The optional properties for the Detail Dropdown component.
 */
type TDetailDropdownOptional_P<TOption> = TDetailOptional_P<TOption> &
  TDetailDropdownBase_P & {
    /**
     * The options available for the detail.
     */
    options: TOption[]
    /**
     * The function to render the display name for the option.
     */
    render: (option: TOption) => ReactNode | null | undefined
    /**
     * Gets the key for the given option.
     * @param option The option for which to get the key.
     * @returns The key for the given option.
     */
    getKey: (option: TOption) => string | null | undefined
    /**
     * How to handle the selected option if it's invalid or not in the list.
     * @methods
     * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
     * - `setToFirst` - Set the selected option to the first option in the list.
     * - `warning` - Display a warning icon.
     *
     * @example
     * ```
     * handleInvalidOption={{
     *  method: 'setToDefault',
     *  defaultValue: new Object()
     * }}
     * ```
     *
     * @example
     * ```
     * handleInvalidOption={{
     * method: 'setToFirst'
     * }}
     * ```
     *
     * @example
     * ```
     * handleInvalidOption={{
     * method: 'warning',
     * message: 'This is a warning message.'
     * }}
     * ```
     */
    handleInvalidOption: TOptionalHandleInvalidOption<TOption>
  }

/**
 * How to handle the selected option if it's invalid or not in the list.
 * @methods
 * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
 * - `setToFirst` - Set the selected option to the first option in the list.
 * - `warning` - Display a warning icon.
 *
 * @example
 * ```
 * handleInvalidOption={{
 *  method: 'setToDefault',
 *  defaultValue: new Object()
 * }}
 * ```
 *
 * @example
 * ```
 * handleInvalidOption={{
 * method: 'setToFirst'
 * }}
 * ```
 *
 * @example
 * ```
 * handleInvalidOption={{
 * method: 'warning',
 * message: 'This is a warning message.'
 * }}
 * ```
 */
export type TRequiredHandleInvalidOption<TOption> =
  | TRequiredSetToDefault<TOption>
  | TSetToFirst
  | TWarning

/**
 * How to handle the selected option if it's invalid or not in the list.
 * @methods
 * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
 * - `setToFirst` - Set the selected option to the first option in the list.
 * - `warning` - Display a warning icon.
 *
 * @example
 * ```
 * handleInvalidOption={{
 *  method: 'setToDefault',
 *  defaultValue: new Object()
 * }}
 * ```
 *
 * @example
 * ```
 * handleInvalidOption={{
 * method: 'setToFirst'
 * }}
 * ```
 *
 * @example
 * ```
 * handleInvalidOption={{
 * method: 'warning',
 * message: 'This is a warning message.'
 * }}
 * ```
 */
export type TOptionalHandleInvalidOption<TOption> =
  | TOptionalSetToDefault<TOption>
  | TSetToFirst
  | TWarning

/**
 * The method that handles an invalid option by setting the selected option to the default value provided.
 * @note If the fieldType is 'required', then the default value provided cannot be null or undefined.
 * @note If the fieldType is 'optional', then the default value provided can be null or undefined.
 */
type TRequiredSetToDefault<TOption> = {
  /**
   * The method to handle the invalid option.
   * @options
   * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
   * - `setToFirst` - Set the selected option to the first option in the list.
   * - `warning` - Display a warning icon.
   */
  method: 'setToDefault'
  /**
   * The default value to set the selected option to.
   * @note If the fieldType is 'required', then the default value provided cannot be null or undefined.
   * @note If the fieldType is 'optional', then the default value provided can be null or undefined.
   */
  defaultValue: NonNullable<TOption>
}

/**
 * The method that handles an invalid option by setting the selected option to the default value provided.
 * @note If the fieldType is 'required', then the default value provided cannot be null or undefined.
 * @note If the fieldType is 'optional', then the default value provided can be null or undefined.
 */
type TOptionalSetToDefault<TOption> = {
  /**
   * The method to handle the invalid option.
   * @options
   * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
   * - `setToFirst` - Set the selected option to the first option in the list.
   * - `warning` - Display a warning icon.
   */
  method: 'setToDefault'
  /**
   * The default value to set the selected option to.
   * @note If the fieldType is 'required', then the default value provided cannot be null or undefined.
   * @note If the fieldType is 'optional', then the default value provided can be null or undefined.
   */
  defaultValue: TOption
}

/**
 * The method that handles an invalid option by setting the selected option to the first option in the list.
 */
type TSetToFirst = {
  /**
   * The method to handle the invalid option.
   * @options
   * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
   * - `setToFirst` - Set the selected option to the first option in the list.
   * - `warning` - Display a warning icon.
   */
  method: 'setToFirst'
}

/**
 * The method that handles an invalid option by displaying a warning icon with a message.
 */
type TWarning = {
  /**
   * The method to handle the invalid option.
   * @options
   * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
   * - `setToFirst` - Set the selected option to the first option in the list.
   * - `warning` - Display a warning icon.
   */
  method: 'warning'
  /**
   * The message that displays when hovering over the warning icon.
   */
  message?: string
}
