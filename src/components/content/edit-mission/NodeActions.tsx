import { useStore } from 'react-context-hook'
import { Asset } from '../../../modules/assets'
import { MissionNodeAction } from '../../../modules/mission-node-actions'
import { MissionNode } from '../../../modules/mission-nodes'
import { AppActions } from '../../AppState'
import { ButtonSVG, EButtonSVGPurpose } from '../user-controls/ButtonSVG'
import NodeAction from './NodeAction'
import './NodeActions.scss'

export default function NodeActions(props: {
  node: MissionNode
  appActions: AppActions
  assets: Array<Asset>
  isEmptyString: boolean
  displayedAction: number
  setDisplayedAction: (displayedAction: number) => void
  setMountHandled: (mountHandled: boolean) => void
  actionEmptyStringArray: Array<string>
  setActionEmptyStringArray: (actionEmptyStringArray: Array<string>) => void
  handleChange: () => void
}): JSX.Element | null {
  let node: MissionNode = props.node
  let appActions: AppActions = props.appActions
  let assets: Array<Asset> = props.assets
  let isEmptyString: boolean = props.isEmptyString
  let displayedAction: number = props.displayedAction
  let setDisplayedAction: (displayedAction: number) => void =
    props.setDisplayedAction
  let setMountHandled: (mountHandled: boolean) => void = props.setMountHandled
  let actionEmptyStringArray: Array<string> = props.actionEmptyStringArray
  let setActionEmptyStringArray: (
    actionEmptyStringArray: Array<string>,
  ) => void = props.setActionEmptyStringArray
  let handleChange = props.handleChange
  let totalActions: number | undefined = node.actions.length
  let actionKey: string = ''
  let addNewActionClassName: string = 'Action add'
  let selectorContainerClassName: string = 'SelectorContainer'

  /* -- COMPONENT FUNCTIONS -- */

  const displayNextAction = () => {
    if (node.actions !== undefined) {
      let lastAction: number = node.actions.length - 1

      if (!isEmptyString) {
        if (displayedAction === lastAction) {
          setDisplayedAction(0)
          setMountHandled(false)
        } else {
          setDisplayedAction(displayedAction + 1)
          setMountHandled(false)
        }
        setActionEmptyStringArray([])
      } else {
        appActions.notify(
          `**Error:** The node called "${node.name.toLowerCase()}" has at least one field that was left empty. These fields must contain at least one character.`,
          { duration: null },
        )
      }
    }
  }

  const displayPreviousAction = () => {
    if (!isEmptyString) {
      if (displayedAction === 0 && node.actions !== undefined) {
        setDisplayedAction(node.actions.length - 1)
      } else {
        setDisplayedAction(displayedAction - 1)
      }
      setActionEmptyStringArray([])
    } else {
      appActions.notify(
        `**Error:** The node called "${node.name.toLowerCase()}" has at least one field that was left empty. These fields must contain at least one character.`,
        { duration: null },
      )
    }
  }

  /* -- RENDER -- */

  // Logic that hides the buttons that select which action is being
  // displayed because there is 1 action or less for the selected node.
  if (
    node.actions.length === 0 ||
    node.actions.length === 1 ||
    node.actions[0] === undefined
  ) {
    actionKey = 'no_action_id_to_choose_from'
    selectorContainerClassName += ' Hidden'
  }

  // Logic that keeps the app from crashing by making the key for the
  // individual action that is being displayed under the action(s) section
  // change dynamically.
  if (node.actions.length > 0) {
    actionKey = node.actions[displayedAction].actionID
  } else if (node.actions.length <= 0) {
    actionKey = 'no_action_id_to_choose_from'
  }

  if (node.executable) {
    return (
      <>
        <div className='NodeActionDetails SidePanelSection'>
          <h4 className='ActionInfo'>Action(s):</h4>
          <div className={selectorContainerClassName}>
            <div className='Previous' onClick={displayPreviousAction}>
              previous
            </div>
            <div className='CurrentActionDisplayed'>
              {displayedAction + 1}/{totalActions}
            </div>
            <div className='Next' onClick={displayNextAction}>
              next
            </div>
          </div>
          <NodeAction
            action={node.actions[displayedAction]}
            appActions={appActions}
            assets={assets}
            displayedAction={displayedAction}
            setDisplayedAction={setDisplayedAction}
            actionEmptyStringArray={actionEmptyStringArray}
            setActionEmptyStringArray={setActionEmptyStringArray}
            setMountHandled={setMountHandled}
            handleChange={handleChange}
            key={actionKey}
          />
          <div className={selectorContainerClassName}>
            <div className='Previous' onClick={displayPreviousAction}>
              previous
            </div>
            <div className='CurrentActionDisplayed'>
              {displayedAction + 1}/{totalActions}
            </div>
            <div className='Next' onClick={displayNextAction}>
              next
            </div>
          </div>
        </div>
        <div className='UserActions SidePanelSection'>
          <ButtonSVG
            purpose={EButtonSVGPurpose.Add}
            handleClick={() => {
              if (node !== null) {
                let action: MissionNodeAction =
                  MissionNode.createDefaultAction(node)
                node.actions.push(action)
                handleChange()
              }
            }}
            tooltipDescription={'Add a new action to this node.'}
            uniqueClassName={addNewActionClassName}
            // key={`actual-action_add-new-action_${node.nodeID}`}
          />
        </div>
      </>
    )
  } else {
    return null
  }
}
