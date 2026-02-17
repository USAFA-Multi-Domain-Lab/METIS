import { compute } from '@client/toolbox'
import type { TDetailRequired_P } from '.'
import Tooltip from '../communication/Tooltip'
import type { TToggleLockState } from '../user-controls/Toggle'
import Toggle from '../user-controls/Toggle'
import './DetailToggle.scss'

/**
 * This will render a detail for a form,
 * with a label and a toggle switch
 * for turning a feature on or off.
 */
export function DetailToggle({
  label,
  value: stateValue,
  setValue: setState,
  // Optional Properties
  lockState = 'unlocked',
  tooltipDescription = '',
  uniqueClassName = undefined,
  uniqueLabelClassName = undefined,
  uniqueFieldClassName = undefined,
  errorMessage = undefined,
  errorType = 'default',
  disabled = false,
}: TDetailToggle_P): TReactElement | null {
  /* -- COMPUTED -- */
  /**
   * The boolean that determines if the
   * error message should be displayed.
   */
  const displayError: boolean = compute(() => errorMessage !== undefined)
  /**
   * The class name for the detail.
   */
  const rootClassName: string = compute(() => {
    let classList: string[] = ['Detail', 'DetailToggle']

    if (uniqueClassName) classList.push(uniqueClassName)
    if (disabled) classList.push('Disabled')

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

    if (displayError) {
      if (errorType === 'default') {
        classList.push('Error')
      } else if (errorType === 'warning') {
        classList.push('Warning')
      }
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

    if (displayError) {
      if (errorType === 'default') {
        classList.push('Error')
      } else if (errorType === 'warning') {
        classList.push('Warning')
      }
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

    if (errorType === 'warning') {
      classList.push('Warning')
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
        <div className='TitleColumnTwo'>
          <div className={fieldClassName}>
            <Toggle
              stateValue={stateValue}
              setState={!disabled ? setState : () => {}}
              lockState={lockState}
            />
          </div>
        </div>
      </div>
      <div className={fieldErrorClassName}>{errorMessage}</div>
    </div>
  )
}

// Set default props for the DetailToggle
// component.
DetailToggle.defaultProps = {
  fieldType: 'required',
}

/* ---------------------------- TYPES FOR DETAIL TOGGLE ---------------------------- */

/**
 * The properties for the Detail Toggle component..
 */
export type TDetailToggle_P = TDetailRequired_P<boolean> & {
  /**
   * The toggle lock state of the toggle.
   * @default 'unlocked'
   */
  lockState?: TToggleLockState
  /**
   * The description displayed when hovered over.
   * @default ''
   */
  tooltipDescription?: string
  /**
   * Class name to apply to the root element.
   */
  uniqueClassName?: string
}
