import { useState } from 'react'
import Tooltip from 'src/components/content/communication/Tooltip'
import ClientMissionAction from 'src/missions/actions'
import { compute } from 'src/toolbox'
import { useEventListener } from 'src/toolbox/hooks'
import StringToolbox from '../../../../../../../../../../shared/toolbox/strings'
import './ExecOption.scss'

/* -- COMPONENT -- */

/**
 * An option in the drop down of actions to choose from.
 */
export default function ExecOption({ action, select }: TOption_P) {
  /* -- STATE -- */
  const [successChance, setSuccessChance] = useState<number>(
    action.successChance,
  )
  const [resourceCost, setResourceCost] = useState<number>(action.resourceCost)
  const [processTime, setProcessTime] = useState<number>(action.processTime)

  /* -- HOOKS -- */
  useEventListener(action.node, 'activity', () => {
    setSuccessChance(action.successChance)
    setResourceCost(action.resourceCost)
    setProcessTime(action.processTime)
  })

  /* -- COMPUTED -- */

  /**
   * The class name for the option.
   */
  const optionClassName: string = compute(() => {
    // Initialize the class list.
    let classList: string[] = ['ExecOption']

    // Disable the option if there are not enough resources
    // to execute the particular action.
    if (resourceCost > action.force.resourcesRemaining) {
      classList.push('Disabled')
    }

    // Return the class list as a string.
    return classList.join(' ')
  })

  /* -- RENDER -- */
  return (
    <div className={optionClassName} key={action._id} onClick={select}>
      <Tooltip
        description={
          `**Time to execute:** ${processTime / 1000} second(s)\n` +
          `**Probability of success:** ${successChance * 100}%\n` +
          `**Resource cost:** ${resourceCost} resource(s)\n` +
          `**Description:** ${StringToolbox.limit(action.description, 160)}`
        }
      />
      {action.name}
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for `DropDownOption` component.
 */
export type TOption_P = {
  /**
   * The action serving as an option in the drop down.
   */
  action: ClientMissionAction
  /**
   * Selects the action as the selected option.
   */
  select: () => void
}
