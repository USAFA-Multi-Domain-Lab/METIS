import RichTextOutputBox from 'src/components/content/communication/RichTextOutputBox'
import ClientMissionAction from 'src/missions/actions'
import { compute } from 'src/toolbox'
import { TExecutionCheats } from '../../../../../../../../../../shared/missions/actions/executions'
import './ActionProperties.scss'
import ActionProperty from './ActionProperty'

/**
 * Displays the properties of the given action.
 */
export default function ActionProperties({
  action,
  cheats,
}: TActionProperties_P): JSX.Element | null {
  /* -- COMPUTED -- */

  const resourceLabel = action.mission.resourceLabel

  /**
   * The class name for the description.
   */
  const descriptionClassName: string = compute(() => {
    // Initialize the class list.
    let classList: string[] = ['ActionDescription']

    // Hide the description if it is empty.
    if (!action.description) classList.push('Hidden')

    // Return the class list as a string.
    return classList.join(' ')
  })

  /* -- RENDER -- */

  /**
   * Callback function for rendering the success chance
   * for its respective `ActionProperty` instance.
   */
  const renderSuccessChance = (value: number) => {
    // If the success chance is hidden, return '???'.
    if (action.successChanceHidden) return '???'
    // Convert the value to a percentage format.
    return `${value * 100}%`
  }

  /**
   * Callback function for rendering the process time
   * for its respective `ActionProperty` instance.
   */
  const renderProcessTime = (value: number) => {
    // If the process time is hidden, return '???'.
    if (action.processTimeHidden) return '???'
    // Convert the value to a seconds format.
    return `${value / 1000}s`
  }

  /**
   * Callback function for rendering the resource cost
   * for its respective `ActionProperty` instance.
   */
  const renderResourceCost = (value: number) => {
    // If the resource cost is hidden, return '???'.
    if (action.resourceCostHidden) return '???'
    // Convert the value to a negative format.
    return `${-value}`
  }

  // Render the root component.
  return (
    <div className='ActionProperties'>
      <div className={descriptionClassName}>
        <RichTextOutputBox text={action.description} />
      </div>
      <ActionProperty
        action={action}
        actionKey='successChance'
        label='Success Chance'
        cheatsApplied={cheats.guaranteedSuccess}
        renderValue={renderSuccessChance}
      />
      <ActionProperty
        action={action}
        actionKey='processTime'
        label='Time'
        cheatsApplied={cheats.instantaneous}
        renderValue={renderProcessTime}
      />
      <ActionProperty
        action={action}
        actionKey='resourceCost'
        label={resourceLabel}
        cheatsApplied={cheats.zeroCost}
        renderValue={renderResourceCost}
      />
      <ActionProperty
        action={action}
        actionKey='opensNode'
        label='Opens Node'
        renderValue={(value) => (value ? 'Yes' : 'No')}
      />
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for `ActionPropertyDisplay` component.
 */
export type TActionProperties_P = {
  /**
   * The action of which to display properties.
   */
  action: ClientMissionAction
  /**
   * The cheats that will be applied to the action.
   */
  cheats: TExecutionCheats
}
