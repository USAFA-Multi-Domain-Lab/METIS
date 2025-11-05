import { compute } from 'metis/client/toolbox'
import { TDetailBase_P } from '.'
import Tooltip from '../communication/Tooltip'
import './DetailLocked.scss'

/**
 * This will render a detail for a form,
 * with a label and a value that is locked
 * from being edited.
 */
export function DetailLocked({
  label,
  stateValue,
  // Optional Properties
  disabled = false,
  uniqueLabelClassName = undefined,
  uniqueFieldClassName = undefined,
  errorMessage = undefined,
  tooltipDescription = '',
}: TDetailLocked_P): TReactElement | null {
  /* -- COMPUTED -- */

  /**
   * The class name for the detail.
   */
  const rootClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Detail', 'DetailLocked']

    // If disabled is true then add the
    // disabled class name.
    if (disabled) {
      classList.push('Disabled')
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
   * The class name for the input field.
   */
  const fieldClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Field']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueFieldClassName) {
      classList.push(uniqueFieldClassName)
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * Class name for the error message field.
   */
  const fieldErrorClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['FieldErrorMessage']

    // Hide the error message if the
    // error message is not passed.
    if (errorMessage === undefined) {
      classList.push('Hidden')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the info icon.
   */
  const infoClassName: string = compute(() =>
    tooltipDescription ? 'DetailInfo' : 'Hidden',
  )

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
      </div>
      <div className={fieldClassName}>
        <span className='Text'>{stateValue}</span>
        <span className='Lock'>
          <Tooltip description='This is locked and cannot be changed.' />
        </span>
      </div>
      <div className={fieldErrorClassName}>{errorMessage}</div>
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
  stateValue: string
}
