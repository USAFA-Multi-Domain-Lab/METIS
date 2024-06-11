import { compute } from 'src/toolbox'
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
}: TDetailLocked_P): JSX.Element | null {
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

  return (
    <div className={rootClassName}>
      <div className='TitleContainer'>
        <div className={labelClassName}>{label}:</div>
      </div>
      <div className={fieldClassName}>
        <span className='Text Disabled'>{stateValue}</span>
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
