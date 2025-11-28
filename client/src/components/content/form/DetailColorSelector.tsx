import { compute } from '@client/toolbox'
import { useState } from 'react'
import type { TDetail_P } from '.'
import Tooltip from '../communication/Tooltip'
import type { TButtonText_P } from '../user-controls/buttons/ButtonText'
import { ButtonText } from '../user-controls/buttons/ButtonText'
import If from '../util/If'
import './DetailColorSelector.scss'

/**
 * This will render a detail for
 * a form, with a label and a grid
 * of color options for selecting
 * a color.
 */
export function DetailColorSelector({
  fieldType,
  label,
  colors,
  value: stateValue,
  setValue: setState,
  // Optional Properties
  buttons = [],
  isExpanded = false,
  uniqueLabelClassName = '',
  uniqueFieldClassName = '',
  disabled = false,
  tooltipDescription = '',
}: TDetailColorSelector_P): TReactElement {
  /* -- STATE -- */
  const [expanded, setExpanded] = useState<boolean>(isExpanded)

  /* -- COMPUTED -- */

  /**
   * The class name for the detail.
   */
  const rootClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Detail', 'DetailColorSelector']

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
    let classList: string[] = ['Field', 'FieldColorSelector']

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
   * The class name for the optional text.
   */
  const optionalClassName: string = compute(() => {
    return fieldType === 'optional' ? 'Optional' : 'Optional Hidden'
  })
  /**
   * The class name for the info icon.
   */
  const infoClassName: string = compute(() =>
    tooltipDescription ? 'DetailInfo' : 'Hidden',
  )

  /* -- RENDER -- */
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
          className='Dropdown'
          onClick={() => (!disabled ? setExpanded(!expanded) : null)}
        >
          <div className='Text' style={{ color: stateValue }}>
            {stateValue}
          </div>
          <div className='Indicator' style={{ color: stateValue }}>
            v
          </div>
        </div>

        <If condition={expanded}>
          <div className='AllColors'>
            {colors.map((color: string, index: number) => {
              return (
                <div
                  className={stateValue === color ? 'Color Selected' : 'Color'}
                  style={{ backgroundColor: color }}
                  key={`color_${color}_${index}`}
                  onClick={() => (!disabled ? setState(color) : null)}
                ></div>
              )
            })}
          </div>
        </If>

        <div className='ButtonContainer'>
          {buttons.map((button: TButtonText_P, index: number) => {
            const buttonProps = {
              ...button,
              onClick: !disabled ? button.onClick : () => {},
            }
            return (
              <ButtonText
                key={`button_${button.text}_${index}`}
                {...buttonProps}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ---------------------------- TYPES FOR DETAIL COLOR SELECTOR ---------------------------- */

/**
 * Props for the DetailColorSelector component.
 */
type TDetailColorSelector_P = TDetail_P<string> & {
  /**
   * The list of colors to choose from.
   */
  colors: string[]
  /**
   * Buttons to render at the bottom of the detail.
   * @default []
   */
  buttons?: TButtonText_P[]
  /**
   * The boolean that determines if the detail is expanded.
   * @default false
   */
  isExpanded?: boolean
  /**
   * @note This is disabled for drop down details.
   */
  errorMessage?: undefined
}
