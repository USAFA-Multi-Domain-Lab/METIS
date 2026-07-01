import { compute } from '@client/toolbox'
import type { TDetailBase_P } from '.'
import Tooltip from '../communication/Tooltip'
import './DetailLocked.scss'
import DetailTitleRow from './DetailTitleRow'
import { useDetailClassNames } from './hooks/useDetailClassNames'
import { useErrorMessages } from './hooks/useErrorMessages'

/**
 * This will render a detail for a form,
 * with a label and a value that is locked
 * from being edited.
 */
export function DetailLocked({
  label,
  value,
  // Optional Properties
  color = undefined,
  disabled = false,
  uniqueLabelClassName = undefined,
  uniqueFieldClassName = undefined,
  errorMessage = '',
  errorType = 'default',
  tooltipDescription = '',
}: TDetailLocked_P): TReactElement | null {
  /* -- COMPUTED -- */

  let { displayError, activeErrorMessage } = useErrorMessages({
    errorMessage,
    fieldType: 'required',
    inputValue: value,
    focused: false,
  })

  const { rootClasses, labelClasses, fieldClasses, fieldErrorClasses } =
    useDetailClassNames({
      componentName: 'DetailLocked',
      disabled,
      displayError,
      errorType,
      uniqueLabelClassName,
      uniqueFieldClassName,
    })

  let textStyle: React.CSSProperties = compute<React.CSSProperties>(() => {
    if (color) return { color, opacity: 1 }
    else return {}
  })

  return (
    <div className={rootClasses.value}>
      <DetailTitleRow
        label={label}
        labelClassName={labelClasses.value}
        tooltipDescription={tooltipDescription}
        fieldType='required'
      />
      <div className={fieldClasses.value}>
        <span className='Text' style={textStyle}>
          {value}
        </span>
        <span className='Lock'>
          <Tooltip description='This is locked and cannot be changed.' />
        </span>
      </div>
      <div className={fieldErrorClasses.value}>{activeErrorMessage}</div>
    </div>
  )
}

/* ---------------------------- TYPES FOR DETAIL LOCKED ---------------------------- */

/**
 * The properties for the Detail Locked component.
 */
export type TDetailLocked_P = TDetailBase_P & {
  /**
   * The value displayed in the detail.
   */
  value: string
  /**
   * An optional color to apply to the value text.
   * When provided, overrides the default dimmed appearance.
   * @note The opacity effect will be reverted, so do not expect
   * the resulting color to be dimmed. This is for flexibility reasons.
   * If you would like to have a dimmed color, you can use a color
   * with opacity in the hex code or rgba format.
   */
  color?: string
}
