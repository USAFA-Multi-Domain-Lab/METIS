import { useEffect, useRef, useState } from 'react'
import RichTextOutputBox from 'src/components/content/communication/RichTextOutputBox'
import { ButtonText } from 'src/components/content/user-controls/ButtonText'
import { useGlobalContext } from 'src/context'
import ClientMissionAction from 'src/missions/actions'
import ClientMissionNode from 'src/missions/nodes'
import SessionClient from 'src/sessions'
import { compute } from 'src/toolbox'
import { useEventListener, useMountHandler } from 'src/toolbox/hooks'
import MapToolbox from '../../../../../../../../../shared/toolbox/maps'
import StringToolbox from '../../../../../../../../../shared/toolbox/strings'
import Tooltip from '../../../../../communication/Tooltip'
import './ActionExecModal.scss'

/**
 * Prompt for a session participant to select an action to execute on a node.
 */
export default function ActionExecModal({
  node,
  session,
  close,
}: TActionExecModal_P) {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()
  const { handleError } = globalContext.actions

  /* -- REFS -- */

  /**
   * The scrollable container for the action list.
   */
  const optionsRef = useRef<HTMLDivElement>(null)

  /* -- STATE -- */

  // Whether the drop-down is expanded.
  const [dropDownExpanded, setDropDownExpanded] = useState<boolean>(false)
  // The action selected by the user from the
  // drop down.
  const [selectedAction, selectAction] = useState<ClientMissionAction | null>(
    () => {
      // If there is only one action, select it.
      if (node.actions.size === 1) {
        return node.actions.values().next().value
      }
      // Otherwise, select nothing.
      else {
        return null
      }
    },
  )
  // Whether the node is blocked.
  const [blocked, setBlocked] = useState<boolean>(node.blocked)

  /* -- HOOKS -- */
  useEventListener(node, 'activity', () => {
    setBlocked(node.blocked)
  })

  /* -- EFFECTS -- */

  // Handle component mount.
  useMountHandler((done) => {
    let scrollRefElement: HTMLDivElement | null = optionsRef.current

    if (scrollRefElement !== null) {
      scrollRefElement.scrollTop = 0
    }

    done()
  })

  useEffect(() => {
    // If there are ever no actions to choose from,
    // close the modal.
    if (node.actions.size === 0) {
      close()
    }
    // If there is ever only one action to choose from,
    // select it.
    else if (node.actions.size === 1) {
      // Get the action.
      let action: ClientMissionAction = node.actions.values().next().value

      // Select the action if not already selected.
      if (selectedAction?._id !== action._id) {
        selectAction(node.actions.values().next().value)
      }
    }
  }, [node.actions.size])

  /* -- FUNCTIONS -- */

  /**
   * Handles a request to close the prompt window.
   */
  const onCloseClick = () => {
    setDropDownExpanded(false)
    close()
  }

  /**
   * Toggles drop down of actions to choose from.
   */
  const revealOptions = () => {
    // Toggle drop down.
    setDropDownExpanded(!dropDownExpanded)
    // Reset scroll position of the drop-down options.
    if (optionsRef.current) optionsRef.current.scrollTop = 0
  }

  /**
   * Executes the selected action.
   */
  const execute = () => {
    if (selectedAction && !node.blocked) {
      session.executeAction(selectedAction._id, {
        onError: (message) => handleError({ message, notifyMethod: 'bubble' }),
      })
      close()
    }
  }

  /* -- RENDER -- */

  let executionReady: boolean = !!selectedAction && !dropDownExpanded
  let rootClasses: string[] = ['ActionExecModal', 'MapModal']
  let dropDownClasses: string[] = ['DropDown']
  let selectionText: string = 'Choose an action'

  // Determine dynamic classes.

  // Add class for when an action is selected,
  // and make the selection text the name of the
  // selected action.
  if (selectedAction) {
    rootClasses.push('ActionSelected')
    selectionText = selectedAction.name
  }
  // Add class for when an action is not selected.
  else {
    rootClasses.push('ActionUnselected')
  }
  // Disable drop down if there is less than two actions.
  if (node.actions.size < 2) {
    dropDownClasses.push('Disabled')
  }
  // Add class for when the drop down is expanded.
  if (dropDownExpanded) {
    dropDownClasses.push('Expanded')
  }
  // Add class for when the drop down is collapsed.
  else {
    dropDownClasses.push('Collapsed')
  }

  // Render the JSX for the options in the drop
  // down.
  const optionJsx = MapToolbox.mapToArray(
    node.actions,
    (action: ClientMissionAction) => {
      return (
        <Option
          key={action._id}
          session={session}
          action={action}
          select={() => {
            selectAction(action)
            setDropDownExpanded(false)
          }}
        />
      )
    },
  )

  // Render the JSX for the action property display.
  const actionPropertyDisplayJsx = executionReady ? (
    <ActionPropertyDisplay action={selectedAction!} />
  ) : null

  // Render the JSX for the buttons.
  const buttonsJsx = executionReady ? (
    <div className='Buttons'>
      <ButtonText text='EXECUTE ACTION' disabled={blocked} onClick={execute} />
    </div>
  ) : null

  // Render root JSX.
  return (
    <div className={rootClasses.join(' ')}>
      <div className='Heading'>
        <div className='NodeName'>{node.name}</div>
        <div className='DropDownLabel'>{`Available actions:`}</div>
      </div>
      <div className='Close'>
        <div className='CloseButton' onClick={onCloseClick}>
          x
          <Tooltip description='Close window.' />
        </div>
      </div>
      <div className={dropDownClasses.join(' ')}>
        <div className='Selection' onClick={revealOptions}>
          <div className='Text'>{selectionText}</div>
          <div className='Arrow'>^</div>
        </div>
        <div className='Options' ref={optionsRef}>
          {optionJsx}
        </div>
      </div>
      {actionPropertyDisplayJsx}
      {buttonsJsx}
    </div>
  )
}

/**
 * Displays the properties of the given action.
 */
const ActionPropertyDisplay = ({ action }: TActionPropertyDisplay_P) => {
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
    let classList: string[] = []

    // Add the updated class if the success chance has been updated.
    if (successChanceUpdated) {
      classList.push('Updated')
    }

    // Return the class list as a string.
    return classList.join(' ')
  })

  /**
   * The class name for the process time.
   */
  const processTimeClassName: string = compute(() => {
    // Initialize the class list.
    let classList: string[] = []

    // Add the updated class if the process time has been updated.
    if (processTimeUpdated) {
      classList.push('Updated')
    }

    // Return the class list as a string.
    return classList.join(' ')
  })

  /**
   * The class name for the resource cost.
   */
  const resourceCostClassName: string = compute(() => {
    // Initialize the class list.
    let classList: string[] = []

    // Add the updated class if the resource cost has been updated.
    if (resourceCostUpdated) {
      classList.push('Updated')
    }

    // Return the class list as a string.
    return classList.join(' ')
  })

  /* -- RENDER -- */
  return (
    <ul className='ActionPropertyDisplay'>
      <li className='Property'>
        <span className='Label'>Probability of success:</span>
        <span className={successChanceClassName}> {successChance * 100}%</span>
      </li>
      <li className='Property'>
        <span className='Label'>Time to execute:</span>
        <span className={processTimeClassName}>
          {' '}
          {processTime / 1000} second(s)
        </span>
      </li>
      <li className='Property'>
        <span className='Label'>Resource cost:</span>
        <span className={resourceCostClassName}>
          {' '}
          {resourceCost} resource(s)
        </span>
      </li>
      <li className='Property Description'>
        <span className='Label'>Description:</span>{' '}
        <RichTextOutputBox Element={action.description} />
      </li>
    </ul>
  )
}

/**
 * An option in the drop down of actions to choose from.
 */
function Option({ session, action, select }: TOption_P) {
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
    let classList: string[] = ['Option']

    // Disable the option if there are not enough resources
    // to execute the particular action.
    if (resourceCost > session.resources) {
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

/**
 * Props for `ActionExecModal` component.
 */
export type TActionExecModal_P = {
  /**
   * The node on which to execute an action.
   */
  node: ClientMissionNode
  /**
   * The session client of which the node is a part.
   */
  session: SessionClient
  /**
   * Closes the modal.
   * @note This should stop the modal from rendering statefully.
   */
  close: () => void
}

/**
 * Props for `DropDownOption` component.
 */
export type TOption_P = {
  /**
   * The session client of which the node is a part.
   */
  session: SessionClient
  /**
   * The action serving as an option in the drop down.
   */
  action: ClientMissionAction
  /**
   * Selects the action as the selected option.
   */
  select: () => void
}

/**
 * Props for `ActionPropertyDisplay` component.
 */
type TActionPropertyDisplay_P = {
  action: ClientMissionAction
}
