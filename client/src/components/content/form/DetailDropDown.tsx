import { useEffect, useState } from 'react'
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
  renderDisplayName,
  // Optional Properties
  uniqueClassName = undefined,
  uniqueLabelClassName = undefined,
  uniqueFieldClassName = undefined,
  uniqueStateValueClassName = undefined,
  disabled = false,
  tooltipDescription = '',
}: TDetailDropdown_P<TOption>): JSX.Element | null {
  /* -- STATE -- */
  const [expanded, setExpanded] = useState<boolean>(false)
  const [displayWarning, setDisplayWarning] = useState<boolean>(false)

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
  const valueDisplayed: string = compute(() => {
    // If the current value is not null
    // or undefined then display it.
    if (stateValue !== null && stateValue !== undefined) {
      return renderDisplayName(stateValue)
    }
    // If the current value is null and a default
    // value is not passed, then display a message
    // that indicates an option should be selected.
    else {
      return 'Select an option'
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

  // If the list of options changes, then
  // determine if the state value is still
  // a valid option.
  useEffect(() => {
    if (displayWarning) {
      setDisplayWarning(false)
    }

    if (fieldType === 'required') {
      setState((prev) => {
        if (!options.includes(prev)) {
          switch (handleInvalidOption.method) {
            case 'setToDefault':
              return handleInvalidOption.defaultValue
            case 'setToFirst':
              return options[0]
            case 'warning':
              setDisplayWarning(true)
              return prev
          }
        }

        // Otherwise, keep the current state value.
        return prev
      })
    } else {
      setState((prev) => {
        if (prev && !options.includes(prev)) {
          switch (handleInvalidOption.method) {
            case 'setToDefault':
              return handleInvalidOption.defaultValue
            case 'setToFirst':
              return options[0]
            case 'warning':
              setDisplayWarning(true)
              return prev
          }
        }

        // Otherwise, keep the current state value.
        return prev
      })
    }
  }, [options, handleInvalidOption])

  /* -- RENDER -- */
  if (options.length > 0) {
    return (
      <div className={rootClassName}>
        <div className='TitleRow'>
          <div className='TitleColumnOne'>
            <div className={labelClassName}>{label}</div>
            <sup className={infoClassName}>
              i
              <Tooltip description={tooltipDescription} />
            </sup>
            <div className={displayWarning ? 'Warning' : 'Hidden'}>!</div>
          </div>
          <div className={`TitleColumnTwo ${optionalClassName}`}>optional</div>
        </div>
        <div className={fieldClassName}>
          <div
            className='Option Selected'
            onClick={() => setExpanded(!expanded)}
          >
            <div className={stateValueClassName}>{valueDisplayed}</div>
            <div className='Indicator'>v</div>
          </div>
          <div className={allOptionsClassName}>
            {options.map((option: NonNullable<TOption>, index: number) => {
              return (
                <div
                  className={'Option'}
                  key={`option_${renderDisplayName(option)}_${index}`}
                  onClick={() => {
                    setState(option)
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

/* ---------------------------- TYPES FOR DETAIL Dropdown ---------------------------- */

/**
 * The base properties for the Detail Dropdown component.
 */
type TDetailDropdownBase_P<TOption> = TDetailBase_P & {
  /**
   * The options available for the detail.
   */
  options: NonNullable<TOption>[]
  /**
   * The boolean that determines if the detail is expanded.
   */
  isExpanded: boolean
  /**
   * The function to render the display name for the option.
   */
  renderDisplayName: (option: NonNullable<TOption>) => string
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
}

/**
 *
 */
export type TRequiredHandleInvalidOption<TOption> =
  | TRequiredSetToDefault<TOption>
  | TSetToFirst
  | TWarning
/**
 *
 */
export type TOptionalHandleInvalidOption<TOption> =
  | TOptionalSetToDefault<TOption>
  | TSetToFirst
  | TWarning

/**
 *
 */
type TRequiredSetToDefault<TOption> = {
  method: 'setToDefault'
  defaultValue: NonNullable<TOption>
}

/**
 *
 */
type TOptionalSetToDefault<TOption> = {
  method: 'setToDefault'
  defaultValue: TOption
}

/**
 *
 */
type TSetToFirst = {
  method: 'setToFirst'
}

/**
 *
 */
type TWarning = {
  method: 'warning'
}

/**
 * The required properties for the Detail Dropdown component.
 */
type TDetailDropdownRequired_P<TOption> = TDetailRequired_P<TOption> &
  TDetailDropdownBase_P<TOption> & {
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
     */
    handleInvalidOption: TRequiredHandleInvalidOption<TOption>
  }

/**
 * The optional properties for the Detail Dropdown component.
 */
type TDetailDropdownOptional_P<TOption> = TDetailOptional_P<TOption> &
  TDetailDropdownBase_P<TOption> & {
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
     */
    handleInvalidOption: TOptionalHandleInvalidOption<TOption>
  }

/**
 * The properties for the Detail Dropdown component.
 */
type TDetailDropdown_P<TOption> =
  | TDetailDropdownRequired_P<TOption>
  | TDetailDropdownOptional_P<TOption | null>
