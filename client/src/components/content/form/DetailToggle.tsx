import { compute } from 'src/toolbox'
import { TDetailRequired_P } from '.'
import Tooltip from '../communication/Tooltip'
import Toggle, { TToggleLockState } from '../user-controls/Toggle'
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
  disabled = false,
}: TDetailToggle_P): JSX.Element | null {
  /* -- COMPUTED -- */
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
              setState={setState}
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
