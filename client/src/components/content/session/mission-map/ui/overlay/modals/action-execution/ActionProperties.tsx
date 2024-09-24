import { useState } from 'react'
import RichTextOutputBox from 'src/components/content/communication/RichTextOutputBox'
import ClientMissionAction from 'src/missions/actions'
import { compute } from 'src/toolbox'
import { useEventListener } from 'src/toolbox/hooks'
import { TExecutionCheats } from '../../../../../../../../../../shared/missions/actions/executions'
import './ActionProperties.scss'

/**
 * Displays the properties of the given action.
 */
export default function ActionProperties({
  action,
  cheats,
}: TActionProperties_P): JSX.Element | null {
  /* -- STATE -- */

  const [successChance, setSuccessChance] = useState<number>(
    action.successChance,
  )
  const [processTime, setProcessTime] = useState<number>(action.processTime)
  const [resourceCost, setResourceCost] = useState<number>(action.resourceCost)
  const [successChanceUpdated, setSuccessChanceUpdated] =
    useState<boolean>(false)
  const [processTimeUpdated, setProcessTimeUpdated] = useState<boolean>(false)
  const [resourceCostUpdated, setResourceCostUpdated] = useState<boolean>(false)

  /* -- HOOKS -- */

  useEventListener(action.node, 'activity', () => {
    // Update the action's chance of success.
    setSuccessChance((prev) => {
      // If the chance of success has changed...
      if (prev !== action.successChance) {
        // ...set the updated state to true.
        setSuccessChanceUpdated(true)
        // ...and reset the updated state after a delay
        setTimeout(() => setSuccessChanceUpdated(false), 500)
        // ...and return the new chance of success.
        return action.successChance
      }
      // Otherwise, return the previous chance of success.
      return prev
    })
    // Update the action's process time.
    setProcessTime((prev) => {
      // If the process time has changed...
      if (prev !== action.processTime) {
        // ...set the updated state to true.
        setProcessTimeUpdated(true)
        // ...and reset the updated state after a delay.
        setTimeout(() => setProcessTimeUpdated(false), 500)
        // ...and return the new process time.
        return action.processTime
      }
      // Otherwise, return the previous process time.
      return prev
    })
    // Update the action's resource cost.
    setResourceCost((prev) => {
      // If the resource cost has changed...
      if (prev !== action.resourceCost) {
        // ...set the updated state to true.
        setResourceCostUpdated(true)
        // ...and reset the updated state after a delay.
        setTimeout(() => setResourceCostUpdated(false), 500)
        // ...and return the new resource cost.
        return action.resourceCost
      }
      // Otherwise, return the previous resource cost.
      return prev
    })
  })

  /* -- COMPUTED -- */

  /**
   * The class name for the success chance.
   */
  const successChanceClassName: string = compute(() => {
    // Initialize the class list.
    let classList: string[] = ['Property', 'SuccessChance']

    // Add the updated class if the success chance has been updated.
    if (successChanceUpdated) {
      classList.push('Updated')
    }

    // Add the 'CheatsApplied' class if the success chance
    // is disabled by cheats.
    if (cheats.guaranteedSuccess) {
      classList.push('CheatsApplied')
    }

    // Return the class list as a string.
    return classList.join(' ')
  })

  /**
   * The class name for the process time.
   */
  const processTimeClassName: string = compute(() => {
    // Initialize the class list.
    let classList: string[] = ['Property', 'ProcessTime']

    // Add the updated class if the process time has been updated.
    if (processTimeUpdated) {
      classList.push('Updated')
    }

    // Add the 'CheatsApplied' class if the process time
    // is disabled by cheats.
    if (cheats.instantaneous) {
      classList.push('CheatsApplied')
    }

    // Return the class list as a string.
    return classList.join(' ')
  })

  /**
   * The class name for the resource cost.
   */
  const resourceCostClassName: string = compute(() => {
    // Initialize the class list.
    let classList: string[] = ['Property', 'ResourceCost']

    // Add the updated class if the resource cost has been updated.
    if (resourceCostUpdated) {
      classList.push('Updated')
    }

    // Add the 'CheatsApplied' class if the resource cost
    // is disabled by cheats.
    if (cheats.zeroCost) {
      classList.push('CheatsApplied')
    }

    // Return the class list as a string.
    return classList.join(' ')
  })

  /* -- RENDER -- */

  // Render the root component.
  return (
    <ul className='ActionProperties'>
      <li className={successChanceClassName}>
        <span className='Label'>Probability of success:</span>
        <span className='Value'> {successChance * 100}%</span>
      </li>
      <li className={processTimeClassName}>
        <span className='Label'>Time to execute:</span>
        <span className='Value'> {processTime / 1000} second(s)</span>
      </li>
      <li className={resourceCostClassName}>
        <span className='Label'>Resource cost:</span>
        <span className='Value'> {resourceCost} resource(s)</span>
      </li>
      <li className='Property Description'>
        <span className='Label'>Description:</span>{' '}
        <RichTextOutputBox text={action.description} />
      </li>
    </ul>
  )
}

/* -- TYPES -- */

/**
 * Props for `ActionPropertyDisplay` component.
 */
type TActionProperties_P = {
  /**
   * The action of which to display properties.
   */
  action: ClientMissionAction
  /**
   * The cheats that will be applied to the action.
   */
  cheats: TExecutionCheats
}
