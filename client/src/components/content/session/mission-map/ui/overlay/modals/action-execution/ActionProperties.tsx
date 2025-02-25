import RichText from 'src/components/content/general-layout/RichText'
import ClientMissionAction from 'src/missions/actions'
import { compute } from 'src/toolbox'
import { TExecutionCheats } from '../../../../../../../../../../shared/missions/actions/executions'
import { TSessionConfig } from '../../../../../../../../../../shared/sessions'
import './ActionProperties.scss'
import ActionProperty from './ActionProperty'

/* -- CONSTANTS -- */

/**
 * What display to the user as a value for a hidden
 * property.
 */
const HIDDEN_VALUE: string = '???'

/**
 * Displays the properties of the given action.
 */
export default function ActionProperties({
  action,
  cheats,
  config,
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
    // If the success chance is hidden, return `HIDDEN_VALUE`.
    if (action.successChanceHidden) return HIDDEN_VALUE
    // Convert the value to a percentage format.
    return `${value * 100}%`
  }

  /**
   * Callback function for rendering the process time
   * for its respective `ActionProperty` instance.
   */
  const renderProcessTime = (value: number) => {
    // If the process time is hidden, return `HIDDEN_VALUE`.
    if (action.processTimeHidden) return HIDDEN_VALUE
    // Convert the value to a seconds format.
    return `${value / 1000}s`
  }

  /**
   * Callback function for rendering the resource cost
   * for its respective `ActionProperty` instance.
   */
  const renderResourceCost = (value: number) => {
    // If the resource cost is hidden, return `HIDDEN_VALUE`.
    if (action.resourceCostHidden) return HIDDEN_VALUE
    // Convert the value to a negative format.
    return `${-value} ${resourceLabel}`
  }

  /**
   * Callback function for rendering the opens node
   * for its respective `ActionProperty` instance.
   */
  const renderOpensNode = (value: boolean) => {
    // If the opens node is hidden, return `HIDDEN_VALUE`.
    if (action.opensNodeHidden) return HIDDEN_VALUE

    // Return 'Yes' if the value is true, otherwise 'No'.
    return value ? 'Yes' : 'No'
  }

  // Render the root component.
  return (
    <div className='ActionProperties'>
      <div className={descriptionClassName}>
        <RichText options={{ content: action.description, editable: false }} />
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
        label='Cost'
        cheatsApplied={cheats.zeroCost}
        renderValue={renderResourceCost}
      />
      <ActionProperty
        action={action}
        actionKey='opensNode'
        label='Opens Node'
        renderValue={renderOpensNode}
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
  /**
   * The session configuration.
   */
  config: TSessionConfig
}
