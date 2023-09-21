import ClientMissionNode from 'src/missions/nodes'
import ClientMissionAction from 'src/missions/actions'
import { ButtonSVG, EButtonSVGPurpose } from '../user-controls/ButtonSVG'
import NodeActionEntry from './NodeActionEntry'
import './NodeActionDetails.scss'
import { useGlobalContext } from 'src/context'

export default function NodeActionDetails(props: {
  node: ClientMissionNode
  isEmptyString: boolean
  displayedAction: number
  actionEmptyStringArray: Array<string>
  setActionEmptyStringArray: (actionEmptyStringArray: Array<string>) => void
  setDisplayedAction: (displayedAction: number) => void
  setMountHandled: (mountHandled: boolean) => void
  handleChange: () => void
}): JSX.Element | null {
  let node: ClientMissionNode = props.node
  let isEmptyString: boolean = props.isEmptyString
  let displayedAction: number = props.displayedAction
  let actionEmptyStringArray: Array<string> = props.actionEmptyStringArray
  let setActionEmptyStringArray = props.setActionEmptyStringArray
  let setDisplayedAction = props.setDisplayedAction
  let setMountHandled = props.setMountHandled
  let handleChange = props.handleChange
  let totalActions: number | undefined = node.actions.size
  let actionKey: string = ''
  let addNewActionClassName: string = 'Action add'
  let selectorContainerClassName: string = 'SelectorContainer'

  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()
  const { notify } = globalContext.actions

  /* -- COMPONENT FUNCTIONS -- */

  const displayNextAction = () => {
    if (node.actions !== undefined) {
      let lastAction: number = node.actions.size - 1

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
        notify(
          `**Error:** The node called "${node.name.toLowerCase()}" has at least one field that was left empty. These fields must contain at least one character.`,
          { duration: null, errorMessage: true },
        )
      }
    }
  }

  const displayPreviousAction = () => {
    if (!isEmptyString) {
      if (displayedAction === 0 && node.actions !== undefined) {
        setDisplayedAction(node.actions.size - 1)
      } else {
        setDisplayedAction(displayedAction - 1)
      }
      setActionEmptyStringArray([])
    } else {
      notify(
        `**Error:** The node called "${node.name.toLowerCase()}" has at least one field that was left empty. These fields must contain at least one character.`,
        { duration: null, errorMessage: true },
      )
    }
  }

  /* -- RENDER -- */

  // Logic that hides the buttons that select which action is being
  // displayed because there is 1 action or less for the selected node.
  if (node.actions.size <= 1) {
    actionKey = 'no_action_id_to_choose_from'
    selectorContainerClassName += ' Hidden'
  }

  // Logic that keeps the app from crashing by making the key for the
  // individual action that is being displayed under the action(s) section
  // change dynamically.
  if (node.actions.size > 1) {
    actionKey = Array.from(node.actions.keys())[displayedAction]
  } else if (node.actions.size <= 0) {
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
          <NodeActionEntry
            action={Array.from(node.actions.values())[displayedAction]}
            isEmptyString={isEmptyString}
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
                let action: ClientMissionAction = new ClientMissionAction(node)
                node.actions.set(action.actionID, action)
                handleChange()
              }
            }}
            tooltipDescription={'Add a new action to this node.'}
            uniqueClassName={addNewActionClassName}
          />
        </div>
      </>
    )
  } else {
    return null
  }
}
