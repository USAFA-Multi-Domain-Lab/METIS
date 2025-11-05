import Tooltip from 'metis/client/components/content/communication/Tooltip'
import { useGlobalContext } from 'metis/client/context/global'
import ClientMissionAction from 'metis/client/missions/actions'
import SessionClient from 'metis/client/sessions'
import { compute } from 'metis/client/toolbox'
import { useEventListener } from 'metis/client/toolbox/hooks'
import { StringToolbox } from 'metis/toolbox'
import { useState } from 'react'
import './ExecOption.scss'

/* -- COMPONENT -- */

/**
 * An option in the drop down of actions to choose from.
 */
export default function ExecOption({ action, session, select }: TExecOption_P) {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const [cheats] = globalContext.cheats
  const [successChanceFormatted, setSuccessChanceFormatted] = useState<string>(
    action.successChanceFormatted,
  )
  const [processTimeFormatted, setProcessTimeFormatted] = useState<string>(
    action.processTimeFormatted,
  )
  const [resourceCostFormatted, setResourceCostFormatted] = useState<string>(
    action.resourceCostFormatted,
  )
  const [opensNodeFormatted, setOpensNodeFormatted] = useState<string>(
    action.opensNodeFormatted,
  )

  /* -- EFFECTS -- */

  // Update the formatted values when the action is modified.
  useEventListener(action.node, 'modify-actions', () => {
    setSuccessChanceFormatted(action.successChanceFormatted)
    setProcessTimeFormatted(action.processTimeFormatted)
    setResourceCostFormatted(action.resourceCostFormatted)
    setOpensNodeFormatted(action.opensNodeFormatted)
  })

  /* -- COMPUTED -- */

  /**
   * The class name for the option.
   */
  const optionClassName: string = compute(() => {
    // Initialize the class list.
    let classList: string[] = ['ExecOption']

    // Disable the option if the action is
    // not ready to execute.
    if (!session.readyToExecute(action, cheats)) {
      classList.push('Disabled')
    }

    // Return the class list as a string.
    return classList.join(' ')
  })

  const descriptionTooltipPortion = compute(() => {
    let result = StringToolbox.limit(action.description, 160)

    // Add line breaks if there is a description.
    if (result) result += `\n \n`

    return result
  })

  /* -- RENDER -- */
  return (
    <div className={optionClassName} key={action._id} onClick={select}>
      <Tooltip
        description={
          `${descriptionTooltipPortion}` +
          `**Success Chance:** ${successChanceFormatted}\n` +
          `**Time:** ${processTimeFormatted}\n` +
          `**Cost:** ${resourceCostFormatted}\n` +
          `**Opens Node:** ${opensNodeFormatted}\n` +
          `**${StringToolbox.toTitleCase(action.type)}**`
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
   * The session where the action is being executed.
   */
  session: SessionClient
  /**
   * Selects the action as the selected option.
   */
  select: () => void
}
