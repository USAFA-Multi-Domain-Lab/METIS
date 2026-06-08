import type { TDetailBase_P } from '.'
import Tooltip from '../communication/Tooltip'
import './DetailLocked.scss'
import DetailTitleRow from './DetailTitleRow'
import { useDetailClassNames } from './useDetailClassNames'
import { useErrorMessages } from './useDisplayError'

/**
 * This will render a detail for a form,
 * with a label and a value that is locked
 * from being edited.
 */
export function DetailLocked({
  label,
  value,
  // Optional Properties
  disabled = false,
  uniqueLabelClassName = undefined,
  uniqueFieldClassName = undefined,
  errorMessage = '',
  errorType = 'default',
  tooltipDescription = '',
}: TDetailLocked_P): TReactElement | null {
  /* -- COMPUTED -- */
  let { displayError, activeErrorMessage } = useErrorMessages({
    errorMethod: 'simple',
    errorMessage: errorMessage,
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
  return (
    <div className={rootClasses.value}>
      <DetailTitleRow
        label={label}
        labelClassName={labelClasses.value}
        tooltipDescription={tooltipDescription}
        fieldType='required'
      />
      <div className={fieldClasses.value}>
        <span className='Text'>{value}</span>
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
export type TDetailLocked_P = Omit<TDetailBase_P, 'errorDisplay'> & {
  /**
   * The value displayed in the detail.
   */
  value: string
}
