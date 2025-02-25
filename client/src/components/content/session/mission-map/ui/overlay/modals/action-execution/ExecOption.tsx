import { useState } from 'react'
import Tooltip from 'src/components/content/communication/Tooltip'
import ClientMissionAction from 'src/missions/actions'
import SessionClient from 'src/sessions'
import { compute } from 'src/toolbox'
import { useEventListener } from 'src/toolbox/hooks'
import StringToolbox from '../../../../../../../../../../shared/toolbox/strings'
import './ExecOption.scss'

/* -- COMPONENT -- */

/**
 * An option in the drop down of actions to choose from.
 */
export default function ExecOption({
  action,
  session: { member, config },
  select,
}: TExecOption_P) {
  /* -- STATE -- */
  const [successChance, setSuccessChance] = useState<number>(
    action.successChance,
  )
  const [resourceCost, setResourceCost] = useState<number>(action.resourceCost)
  const [processTime, setProcessTime] = useState<number>(action.processTime)

  /* -- HOOKS -- */

  useEventListener(action.node, 'modify-actions', () => {
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
    if (
      resourceCost > action.force.resourcesRemaining &&
      !member.isAuthorized('cheats') &&
      !config.infiniteResources
    ) {
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
 * Props for `ExecOption` component.
 */
export type TExecOption_P = {
  /**
   * The action serving as an option in the drop down.
   */
  action: ClientMissionAction
  /**
   * The session that the member is a part of.
   */
  session: SessionClient
  /**
   * Selects the action as the selected option.
   */
  select: () => void
}
