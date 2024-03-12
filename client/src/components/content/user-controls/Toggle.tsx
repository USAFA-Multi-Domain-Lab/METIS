import { compute } from 'src/toolbox'
import './Toggle.scss'

/**
 * Renders a toggle switch.
 */
export default function Toggle({
  currentValue,
  deliverValue,
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
    if (currentValue) {
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
      deliverValue(!currentValue)
    } else if (lockState === 'locked-activation') {
      deliverValue(true)
    } else if (lockState === 'locked-deactivation') {
      deliverValue(false)
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
   * The current value of the toggle.
   */
  currentValue: boolean
  /**
   * A function that will deliver the value of the toggle.
   */
  deliverValue: (activated: boolean) => void
  /**
   * The lock state of the toggle.
   * @default 'unlocked'
   */
  lockState?: TToggleLockState
}
