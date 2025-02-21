import { useEffect, useRef, useState } from 'react'
import {
  ButtonText,
  TButtonText_P,
} from 'src/components/content/user-controls/buttons/ButtonText'
import { useGlobalContext } from 'src/context'
import ClientMissionAction from 'src/missions/actions'
import ClientMissionNode from 'src/missions/nodes'
import SessionClient from 'src/sessions'
import { compute } from 'src/toolbox'
import { useEventListener, useMountHandler } from 'src/toolbox/hooks'
import MapToolbox from '../../../../../../../../../../shared/toolbox/maps'
import { TWithKey } from '../../../../../../../../../../shared/toolbox/objects'
import Tooltip from '../../../../../../communication/Tooltip'
import './ActionExecModal.scss'
import ActionProperties from './ActionProperties'
import ExecCheats from './ExecCheats'
import ExecOption from './ExecOption'

// todo: Ensure that if there is only one action, and
// todo: that action is not ready to execute, that the
// todo: execution modal will not render the execution
// todo: properties.

/**
 * Prompt for a session participant to select an action to execute on a node.
 */
export default function ActionExecModal({
  node,
  session,
  close,
}: TActionExecModal_P) {
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
        return node.actions.values().next().value!
      }
      // Otherwise, select nothing.
      else {
        return null
      }
    },
  )
  const [blocked, setBlocked] = useState<boolean>(node.blocked)
  const globalContext = useGlobalContext()
  const [cheats, setCheats] = globalContext.cheats
  const [showCheats, setShowCheats] = useState<boolean>(false)
  // Whether the output has been sent.
  const [pendingOutputSent, setPendingOutputSent] = useState<boolean>(
    node.pendingOutputSent,
  )
  const { handleError } = globalContext.actions

  /* -- HOOKS -- */

  useEventListener(node, ['update-block', 'output-sent'], () => {
    setBlocked(node.blocked)
    setPendingOutputSent(node.pendingOutputSent)
  })

  /* -- COMPUTED -- */

  /**
   * Whether the modal is ready for execution.
   */
  const ready = compute<boolean>(() => {
    return (
      !!selectedAction && !dropDownExpanded && !blocked && !pendingOutputSent
    )
  })

  /**
   * The buttons to display in the modal.
   */
  const buttons = compute<TButtonText_P[]>(() => {
    let buttons: TWithKey<TButtonText_P>[] = []

    // Determine buttons based on whether cheats
    // are showing.
    if (showCheats) {
      buttons.push({
        text: 'BACK',
        onClick: () => setShowCheats(false),
        key: 'back',
      })
    }
    // If there is no selected action or the
    // drop down is expanded, return an empty array.
    else if (selectedAction && !dropDownExpanded) {
      buttons.push({
        text: 'EXECUTE ACTION',
        disabled: blocked ? 'full' : 'none',
        onClick: () => execute(),
        key: 'execute',
      })

      // If the member is authorized to use cheats,
      // add the cheats button.
      if (session.member.isAuthorized('cheats')) {
        buttons.push({
          text: 'CHEATS',
          onClick: () => setShowCheats(true),
          key: 'cheats',
        })
      }
    }

    return buttons
  })

  /**
   * The text for the selected portion of the drop down.
   */
  const selectionText = compute<string>(() => {
    if (selectedAction) return selectedAction.name
    else return 'Choose an action'
  })

  /**
   * Root class name for the component.
   */
  const rootClass = compute<string>(() => {
    let classes: string[] = ['ActionExecModal', 'MapModal']

    // Add selection class based on whether
    // an action is selected.
    if (selectedAction) classes.push('ActionSelected')
    else classes.push('ActionUnselected')

    return classes.join(' ')
  })

  /**
   * Drop down class name for the component.
   */
  const dropDownClass = compute<string>(() => {
    let classes: string[] = ['Dropdown']

    // Disable drop down if there is less than two actions.
    if (node.actions.size < 2) classes.push('Disabled')
    // Add expanded class based on whether the drop down
    // is expanded.
    if (dropDownExpanded) classes.push('Expanded')
    else classes.push('Collapsed')

    return classes.join(' ')
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
      let action: ClientMissionAction = node.actions.values().next().value!

      // Select the action if not already selected.
      if (selectedAction?._id !== action._id) {
        selectAction(node.actions.values().next().value!)
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
    if (ready) {
      session.executeAction(selectedAction!._id, {
        // This will be ignored if the member
        // does not have authorization to use cheats.
        cheats,
        onError: (message) => handleError({ message, notifyMethod: 'bubble' }),
      })
      close()
    }
  }

  /* -- RENDER -- */

  /**
   * JSX for the drop down options.
   */
  const optionsJsx = MapToolbox.mapToArray(
    node.actions,
    (action: ClientMissionAction) => {
      return (
        <ExecOption
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

  /**
   * JSX for the drop down.
   */
  const dropDownJsx = compute<JSX.Element | null>(() => {
    // If showing cheats, return null.
    if (showCheats) return null

    // Render default JSX.
    return (
      <div className={dropDownClass}>
        <div className='Selection' onClick={revealOptions}>
          <div className='Text'>{selectionText}</div>
          <div className='Arrow'>^</div>
        </div>
        <div className='Options' ref={optionsRef}>
          {optionsJsx}
        </div>
      </div>
    )
  })

  /**
   * JSX for the heading.
   */
  const headingJsx = compute<JSX.Element | null>(() => {
    // Render JSX.
    return (
      <div className='Heading'>
        <div className='NodeName'>{node.name}</div>
        {!showCheats ? (
          <div className='DropDownLabel'>{`Available actions:`}</div>
        ) : null}
      </div>
    )
  })

  /**
   * JSX for the close button.
   */
  const closeJsx = compute<JSX.Element | null>(() => {
    // Render JSX.
    return (
      <div className='Close'>
        <div className='CloseButton' onClick={onCloseClick}>
          x
          <Tooltip description='Close window.' />
        </div>
      </div>
    )
  })

  /**
   * JSX for the cheats.
   */
  const cheatsJsx = compute<JSX.Element | null>(() => {
    // If `showCheats` is false, return null.
    if (!showCheats) return null

    // Render JSX.
    return <ExecCheats cheats={cheats} setCheats={setCheats} />
  })

  /**
   * JSX for the action properties.
   */
  const actionPropertiesJsx = compute<JSX.Element | null>(() => {
    // Gather details.
    let authorizedCheats = session.member.isAuthorized('cheats')
      ? cheats
      : {
          zeroCost: false,
          instantaneous: false,
          guaranteedSuccess: false,
        }

    // If the modal is not ready, return null.
    if (!ready) return null
    // If the cheats are showing, return null.
    if (showCheats) return null

    // Render JSX.
    return (
      <ActionProperties action={selectedAction!} cheats={authorizedCheats} />
    )
  })

  /**
   * JSX for the buttons.
   */
  const buttonsJsx = compute<JSX.Element | null>(() => {
    // If the modal is not ready, return null.
    if (!ready) return null

    // Render JSX.
    return (
      <div className='Buttons'>
        {buttons.map((props) => (
          <ButtonText {...props} />
        ))}
      </div>
    )
  })

  // Render root JSX.
  return (
    <div className={rootClass}>
      {headingJsx}
      {closeJsx}
      {dropDownJsx}
      {actionPropertiesJsx}
      {cheatsJsx}
      {buttonsJsx}
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
