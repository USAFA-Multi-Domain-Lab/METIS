import RichText from 'src/components/content/general-layout/rich-text/RichText'
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

  // Render the root component.
  return (
    <div className='ActionProperties'>
      <div className={descriptionClassName}>
        <RichText options={{ content: action.description, editable: false }} />
      </div>
      <ActionProperty
        action={action}
        actionKey='successChanceFormatted'
        label='Success Chance'
        cheatsApplied={cheats.guaranteedSuccess}
      />
      <ActionProperty
        action={action}
        actionKey='processTimeFormatted'
        label='Time'
        cheatsApplied={cheats.instantaneous}
      />
      <ActionProperty
        action={action}
        actionKey='resourceCostFormatted'
        label='Cost'
        cheatsApplied={cheats.zeroCost}
      />
      <ActionProperty
        action={action}
        actionKey='opensNodeFormatted'
        label='Opens Node'
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
