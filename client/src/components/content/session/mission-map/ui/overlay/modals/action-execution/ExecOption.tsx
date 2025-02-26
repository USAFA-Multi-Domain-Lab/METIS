import { useState } from 'react'
import Tooltip from 'src/components/content/communication/Tooltip'
import ClientMissionAction from 'src/missions/actions'
import { compute } from 'src/toolbox'
import {
  useEventListener,
  useForcedUpdates,
  useObjectFormSync,
} from 'src/toolbox/hooks'
import StringToolbox from '../../../../../../../../../../shared/toolbox/strings'
import './ExecOption.scss'
import SessionClient from 'src/sessions'
import { useGlobalContext } from 'src/context'

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

  /**
   * A description which informs the user whether the action
   * opens a node or not.
   */
  const opensNodeDescription = compute(() =>
    action.opensNode ? '**Opens node.**' : '**Does not open node.**',
  )

  /* -- RENDER -- */
  return (
    <div className={optionClassName} key={action._id} onClick={select}>
      <Tooltip
        description={
          StringToolbox.limit(action.description, 160) +
          `\n\n` +
          `**Time:** ${processTimeFormatted}\n` +
          `**Success Chance:** ${successChanceFormatted}\n` +
          `**Cost:** ${resourceCostFormatted}\n` +
          `**Opens Node:** ${opensNodeFormatted}`
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
