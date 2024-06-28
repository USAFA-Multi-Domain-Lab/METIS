import { useEffect, useState } from 'react'
import { compute } from 'src/toolbox'
import { TDetailBase_P, TDetailOptional_P, TDetailRequired_P } from '.'
import Tooltip from '../communication/Tooltip'
import './DetailDropDown.scss'

/**
 * This will render a detail for
 * a form, with a label and a drop
 * down box for selecting from various
 * options.
 * @note If `TOption` can be null or undefined, passing null or undefined
 * will leave the drop down box unselected.
 */
export function DetailDropDown<TOption>({
  fieldType,
  label,
  options,
  stateValue,
  setState,
  isExpanded,
  renderDisplayName,
  // Optional Properties
  uniqueClassName = undefined,
  uniqueLabelClassName = undefined,
  uniqueFieldClassName = undefined,
  uniqueStateValueClassName = undefined,
  disabled = false,
  tooltipDescription = '',
  defaultValue = undefined,
}: TDetailDropDown_P<TOption>): JSX.Element | null {
  /* -- STATE -- */
  const [expanded, setExpanded] = useState<boolean>(false)

  /* -- COMPUTED -- */
  /**
   * The class name for the detail.
   */
  const rootClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Detail', 'DetailDropDown']

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
    // If the field type is required, then
    // make sure the state value is a valid
    // option.
    if (fieldType === 'required') {
      setState((prev) => {
        // If the previous state value is not
        // a valid option and a default value
        // is passed, then set the state value
        // to the default value. Otherwise, set
        // the state value to the first
        // option in the list.
        if (!options.includes(prev)) {
          return defaultValue ? defaultValue : options[0]
        }

        // Otherwise, keep the current state value.
        return prev
      })
    } else {
      setState((prev) => {
        // If the previous state value is not
        // a valid option, then set the state
        // value to null.
        if (prev && !options.includes(prev)) {
          return null
        }

        // Otherwise, keep the current state value.
        return prev
      })
    }
  }, [options])

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

/* ---------------------------- TYPES FOR DETAIL DROP DOWN ---------------------------- */

type TDetailDropDownBase_P<TOption> = TDetailBase_P & {
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
   * @note This is disabled for drop down details.
   */
  errorMessage?: undefined
}

type TDetailDropDownRequired_P<TOption> = TDetailRequired_P<TOption> &
  TDetailDropDownBase_P<TOption> & {
    /**
     * The default value for the drop down box.
     */
    defaultValue: TOption
  }

type TDetailDropDownOptional_P<TOption> = TDetailOptional_P<TOption> &
  TDetailDropDownBase_P<TOption> & {
    /**
     * The default value for the drop down box.
     * @default undefined
     */
    defaultValue?: TOption
  }

/**
 * The properties for the Detail Drop Down component.
 */
type TDetailDropDown_P<TOption> =
  | TDetailDropDownRequired_P<TOption>
  | TDetailDropDownOptional_P<TOption | null>
