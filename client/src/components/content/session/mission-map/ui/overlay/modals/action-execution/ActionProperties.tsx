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
        renderValue={(value) => `${value * 100}%`}
      />
      <ActionProperty
        action={action}
        actionKey='processTime'
        label='Time'
        cheatsApplied={cheats.instantaneous}
        renderValue={(value) => `${value / 1000}s`}
      />
      <ActionProperty
        action={action}
        actionKey='resourceCost'
        label={resourceLabel}
        cheatsApplied={cheats.zeroCost}
        renderValue={(value) => `${-value}`}
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
