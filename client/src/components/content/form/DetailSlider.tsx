import { compute } from '@client/toolbox'
import type { TDetail_P } from '.'
import './DetailSlider.scss'
import DetailTitleRow from './DetailTitleRow'
import { useDetailClassNames } from './useDetailClassNames'

/**
 * This will render a detail for
 * a form, with a label and a range
 * slider for selecting a numeric value.
 */
export function DetailSlider({
  fieldType,
  label,
  value,
  setValue,
  // Optional Properties
  minimum = 0,
  maximum = 100,
  step = 1,
  unit = undefined,
  showValue = true,
  uniqueLabelClassName = undefined,
  uniqueFieldClassName = undefined,
  errorMessage = undefined,
  errorType = 'default',
  disabled = false,
  tooltipDescription = '',
}: TDetailSlider_P): TReactElement | null {
  /* -- COMPUTED -- */

  /**
   * The boolean that determines if the
   * error message should be displayed.
   */
  const displayError: boolean = compute(() => errorMessage !== undefined)
  const { rootClasses, labelClasses, fieldClasses, fieldErrorClasses } =
    useDetailClassNames({
      componentName: 'DetailSlider',
      disabled,
      displayError,
      errorType,
      uniqueLabelClassName,
      uniqueFieldClassName,
    })

  /**
   * The numeric value clamped to the slider's range.
   * Falls back to `minimum` when the value is null (optional field).
   */
  const numericValue: number = compute(() => {
    const resolved = value ?? minimum
    return Math.min(maximum, Math.max(minimum, resolved))
  })

  /**
   * The display text shown in the title row alongside the label.
   * Combines the current value with the optional unit string.
   */
  const valueLabel: string = compute(() =>
    unit ? `${numericValue} ${unit}` : String(numericValue),
  )

  /**
   * The fill percentage (0–100) used to color the track
   * left of the thumb via a CSS custom property.
   */
  const fillPercent: number = compute(() => {
    const range = maximum - minimum
    return range === 0 ? 0 : ((numericValue - minimum) / range) * 100
  })

  /* -- RENDER -- */

  return (
    <div className={rootClasses.value}>
      <DetailTitleRow
        label={label}
        labelClassName={labelClasses.value}
        tooltipDescription={tooltipDescription}
        fieldType={fieldType}
        rightContent={
          showValue ? (
            <span className='SliderValue'>{valueLabel}</span>
          ) : undefined
        }
      />
      <input
        className={fieldClasses.value}
        type='range'
        min={minimum}
        max={maximum}
        step={step}
        value={numericValue}
        disabled={disabled}
        style={{ '--slider-fill': `${fillPercent}%` } as React.CSSProperties}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          const parsed = parseFloat(event.target.value)
          if (!isNaN(parsed)) {
            setValue(parsed as never)
          }
        }}
      />
      <div className={fieldErrorClasses.value}>{errorMessage}</div>
    </div>
  )
}

/* ---------------------------- TYPES FOR DETAIL SLIDER ---------------------------- */

/**
 * The properties for the Detail Slider component.
 */
type TDetailSlider_P = TDetail_P<number | null> & {
  /**
   * The minimum value of the slider.
   * @default 0
   */
  minimum?: number
  /**
   * The maximum value of the slider.
   * @default 100
   */
  maximum?: number
  /**
   * The step increment of the slider.
   * @default 1
   */
  step?: number
  /**
   * An optional unit label displayed alongside the current value
   * (e.g. `'%'`, `'px'`, `'ms'`).
   */
  unit?: string
  /**
   * Whether to display the current numeric value in the title row.
   * @default true
   */
  showValue?: boolean
}
