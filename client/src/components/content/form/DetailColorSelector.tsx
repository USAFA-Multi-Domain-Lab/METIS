import { useState } from 'react'
import type { TDetail_P } from '.'
import type { TButtonText_P } from '../user-controls/buttons/ButtonText'
import { ButtonText } from '../user-controls/buttons/ButtonText'
import If from '../util/If'
import './DetailColorSelector.scss'
import DetailTitleRow from './DetailTitleRow'
import { useDetailClassNames } from './useDetailClassNames'

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

  const { rootClasses, labelClasses, fieldClasses } = useDetailClassNames({
    componentName: 'DetailColorSelector',
    disabled,
    displayError: false,
    errorType: 'default',
    uniqueLabelClassName,
    uniqueFieldClassName,
  })
  fieldClasses.add('FieldColorSelector')
  fieldClasses.set('IsExpanded', expanded)
  /* -- RENDER -- */
  return (
    <div className={rootClasses.value}>
      <DetailTitleRow
        label={label}
        labelClassName={labelClasses.value}
        tooltipDescription={tooltipDescription}
        fieldType={fieldType}
      />

      <div className={fieldClasses.value}>
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
