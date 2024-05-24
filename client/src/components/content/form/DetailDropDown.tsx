import { useState } from 'react'
import { compute } from 'src/toolbox'
import { TDetail_P } from '.'
import { AnyObject } from '../../../../../shared/toolbox/objects'
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
  uniqueDropDownStyling = {},
  uniqueClassName = undefined,
  uniqueLabelClassName = undefined,
  uniqueFieldClassName = undefined,
  uniqueStateValueClassName = undefined,
  disabled = false,
  uniqueOptionStyling = () => ({}),
  renderOptionClassName = () => '',
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
    return fieldType === 'optional' ? 'Optional' : 'Optional Hidden'
  })

  /* -- RENDER -- */
  if (options.length > 0) {
    return (
      <div className={rootClassName} style={uniqueDropDownStyling}>
        <div className='TitleContainer'>
          <div className={labelClassName}>{label}:</div>
          <div className={optionalClassName}>optional</div>
        </div>
        <div className={fieldClassName}>
          <div
            className='Option Selected'
            onClick={() => {
              setExpanded(!expanded)
            }}
          >
            <div className={stateValueClassName}>{valueDisplayed}</div>
            <div className='Indicator'>v</div>
          </div>
          <div className={allOptionsClassName}>
            {options.map((option: NonNullable<TOption>, index: number) => {
              return (
                <div
                  className={`Option ${renderOptionClassName(option)}`}
                  style={uniqueOptionStyling(option)}
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

/**
 * The properties for the Detail Drop Down component.
 */
type TDetailDropDown_P<TOption> = TDetail_P<TOption | null> & {
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
   * The unique CSS styling for the drop down.
   * @default {}
   */
  uniqueDropDownStyling?: AnyObject
  /**
   * The unique class name for the detail.
   */
  uniqueClassName?: string
  /**
   * The unique class name for the current value.
   */
  uniqueStateValueClassName?: string
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
  /**
   * @note This is disabled for drop down details.
   */
  errorMessage?: undefined
}
