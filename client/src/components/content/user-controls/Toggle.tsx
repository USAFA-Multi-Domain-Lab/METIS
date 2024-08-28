import { compute } from 'src/toolbox'
import './Toggle.scss'

/**
 * Renders a toggle switch.
 */
export default function Toggle({
  stateValue,
  setState,
  // Optional Properties
  lockState = 'unlocked',
}: TToggle_P): JSX.Element {
  /* -- COMPUTED -- */
  /**
   * The class name for the toggle.
   */
  const className: string = compute(() => {
    // Default class names
    let classList: string[] = ['Toggle']

    // Add activated class if activated.
    if (stateValue) {
      classList.push('Activated')
    }

    // Add locked class if locked.
    if (lockState !== 'unlocked') {
      classList.push('Locked')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })

  /* -- FUNCTIONS -- */
  /**
   * Handles the click event for the toggle.
   */
  const handleClick = () => {
    if (lockState === 'unlocked') {
      setState(!stateValue)
    } else if (lockState === 'locked-activation') {
      setState(true)
    } else if (lockState === 'locked-deactivation') {
      setState(false)
    }
  }

  /* -- RENDER -- */
  return (
    <div className={className} onClick={handleClick}>
      <div className='Switch'></div>
    </div>
  )
}

/* ---------------------------- TYPES FOR TOGGLE ---------------------------- */

/**
 * The lock state for a toggle.
 */
export type TToggleLockState =
  | 'unlocked'
  | 'locked-activation'
  | 'locked-deactivation'

type TToggle_P = {
  /**
   * The value stored in a component's state that
   * will be displayed in the detail.
   * @default false
   */
  stateValue: boolean
  /**
   * React setter function used to update the value stored
   * in a component's state.
   */
  setState: ReactSetter<boolean>
  /**
   * The lock state of the toggle.
   * @default 'unlocked'
   */
  lockState?: TToggleLockState
}
