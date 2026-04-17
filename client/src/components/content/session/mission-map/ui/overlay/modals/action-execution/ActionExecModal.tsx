import type { TButtonText_P } from '@client/components/content/user-controls/buttons/ButtonText'
import { ButtonText } from '@client/components/content/user-controls/buttons/ButtonText'
import { useGlobalContext } from '@client/context/global'
import type { ClientMissionAction } from '@client/missions/actions/ClientMissionAction'
import type { ClientMissionNode } from '@client/missions/nodes/ClientMissionNode'
import type { SessionClient } from '@client/sessions/SessionClient'
import { compute } from '@client/toolbox'
import { removeKey } from '@client/toolbox/components'
import { useEventListener, useMountHandler } from '@client/toolbox/hooks'
import type { TNodeBlockStatus } from '@shared/missions/nodes/MissionNode'
import { ClassList } from '@shared/toolbox/html/ClassList'
import type { TWithKey } from '@shared/toolbox/objects/ObjectToolbox'
import { useEffect, useRef, useState } from 'react'
import { useModalDisplayLogic } from '..'
import Tooltip from '../../../../../../communication/Tooltip'
import './ActionExecModal.scss'
import ActionProperties from './ActionProperties'
import ExecCheats from './ExecCheats'
import ExecOption from './ExecOption'

/**
 * Prompt for a session participant to select an action to execute on a node.
 * @throws If this component is used outside of a {@link MissionMap} context.
 */
export default function ActionExecModal(props: TActionExecModal_P) {
  /* -- PROPS -- */

  const { session } = props

  /* -- REFS -- */

  /**
   * The scrollable container for the action list.
   */
  const optionsRef = useRef<HTMLDivElement>(null)

  /* -- STATE -- */

  const [node, setNode] = props.node
  const [nodeName, setNodeName] = useState<string>('')
  const [actions, setActions] = useState<ClientMissionAction[]>([])
  const [blockStatus, setBlockStatus] = useState<TNodeBlockStatus>('unblocked')
  const [pendingOutputSent, setPendingOutputSent] = useState<boolean>(false)
  const globalContext = useGlobalContext()
  const [cheats, setCheats] = globalContext.cheats
  const [showCheats, setShowCheats] = useState<boolean>(false)
  // Whether the drop-down is expanded.
  const [dropDownExpanded, setDropDownExpanded] = useState<boolean>(false)
  // The action selected by the user from the
  // drop down.
  const [selectedAction, selectAction] = useState<ClientMissionAction | null>(
    null,
  )
  const { handleError } = globalContext.actions

  /* -- HOOKS -- */

  // Reset node-dependent state values when node
  // changes.
  useEffect(() => {
    if (node) {
      let actions = Array.from(node.actions.values())
      setNodeName(node.name)
      setActions(actions)
      setBlockStatus(node.blockStatus)
      setPendingOutputSent(node.pendingOutputSent)
      selectAction(() => {
        // If there is only one action, select it.
        if (actions.length === 1) {
          return actions[0]
        }
        // Otherwise, select nothing.
        else {
          return null
        }
      })
    } else {
      setNodeName('')
      setActions([])
      setBlockStatus('unblocked')
      setPendingOutputSent(false)
      selectAction(null)
    }
  }, [node])

  useEventListener(node, ['set-blocked', 'output-sent'], () => {
    if (node) {
      setBlockStatus(node.blockStatus)
      setPendingOutputSent(node.pendingOutputSent)
    }
  })

  /* -- COMPUTED -- */

  /**
   * Whether the node is directly blocked.
   */
  const blocked = compute<boolean>(() => blockStatus === 'blocked')

  /**
   * Whether the node is cut-off from being accessed
   * because one of its ancestors is blocked.
   */
  const cutOff = compute<boolean>(() => blockStatus === 'cut-off')

  /**
   * Whether the modal is ready for execution.
   */
  const ready = compute<boolean>(() => {
    return (
      !!selectedAction &&
      !dropDownExpanded &&
      !blocked &&
      !cutOff &&
      !pendingOutputSent
    )
  })

  /**
   * The buttons to display in the modal.
   */
  const buttons = compute<TWithKey<TButtonText_P>[]>(() => {
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
  const rootClasses = new ClassList('ActionExecModal', 'MapModal').switch(
    'ActionSelected',
    'ActionUnselected',
    selectedAction,
  )

  /**
   * Drop down class name for the component.
   */
  const dropDownClass = compute<string>(() => {
    let classes: string[] = ['Dropdown']

    // Disable drop down if there is less than two actions.
    if (actions.length < 2) classes.push('Disabled')
    // Add expanded class based on whether the drop down
    // is expanded.
    if (dropDownExpanded) classes.push('Expanded')
    else classes.push('Collapsed')

    return classes.join(' ')
  })

  /* -- EFFECTS CONTINUED -- */

  useModalDisplayLogic(Boolean(node), rootClasses)

  // Handle component mount.
  useMountHandler((done) => {
    let scrollRefElement: HTMLDivElement | null = optionsRef.current

    if (scrollRefElement !== null) {
      scrollRefElement.scrollTop = 0
    }

    done()
  })

  /* -- FUNCTIONS -- */

  /**
   * Handles a request to close the prompt window.
   */
  const onCloseClick = () => {
    setDropDownExpanded(false)
    setNode(null)
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
      setNode(null)
    }
  }

  /* -- RENDER -- */

  /**
   * JSX for the drop down options.
   */
  const optionsJsx = actions.map((action: ClientMissionAction) => {
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
  })

  /**
   * JSX for the drop down.
   */
  const dropDownJsx = compute<TReactElement | null>(() => {
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
  const headingJsx = compute<TReactElement | null>(() => {
    // Render JSX.
    return (
      <div className='Heading'>
        <div className='NodeName'>{nodeName}</div>
        {!showCheats ? (
          <div className='DropDownLabel'>{`Available actions:`}</div>
        ) : null}
      </div>
    )
  })

  /**
   * JSX for the close button.
   */
  const closeJsx = compute<TReactElement | null>(() => {
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
  const cheatsJsx = compute<TReactElement | null>(() => {
    // If `showCheats` is false, return null.
    if (!showCheats) return null

    // Render JSX.
    return <ExecCheats cheats={cheats} setCheats={setCheats} />
  })

  /**
   * JSX for the action properties.
   */
  const actionPropertiesJsx = compute<TReactElement | null>(() => {
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
      <ActionProperties
        action={selectedAction!}
        cheats={authorizedCheats}
        config={session.config}
      />
    )
  })

  /**
   * JSX for the buttons.
   */
  const buttonsJsx = compute<TReactElement | null>(() => {
    // If the modal is not ready, return null.
    if (!ready) return null

    // Render JSX.
    return (
      <div className='Buttons'>
        {buttons.map((props) => (
          <ButtonText key={props.key} {...removeKey(props)} />
        ))}
      </div>
    )
  })

  // Render root JSX.
  return (
    <div className={rootClasses.value}>
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
 * Props for {@link ActionExecModal} component.
 */
export interface TActionExecModal_P {
  /**
   * The node on which to execute an action.
   */
  node: TReactState<ClientMissionNode | null>
  /**
   * The session client of which the node is a part.
   */
  session: SessionClient
}
