import ClientMissionNode from 'src/missions/nodes'
import ClientMissionAction from 'src/missions/actions'
import { ButtonSVG, EButtonSVGPurpose } from '../user-controls/ButtonSVG'
import NodeActionEntry from './NodeActionEntry'
import './NodeActionDetails.scss'
import { useGlobalContext } from 'src/context'

/**
 * This will render the details of the action(s) available to a node.
 */
export default function NodeActionDetails(props: {
  /**
   * The mission-node to be edited.
   */
  node: ClientMissionNode
  /**
   * A boolean that will be used to determine if the
   * field has been left empty.
   */
  isEmptyString: boolean
  /**
   * The current action being displayed. This is used for
   * pagination purposes.
   */
  displayedAction: number
  /**
   * An array that will be used to determine if a
   * field has been left empty.
   */
  actionEmptyStringArray: string[]
  /**
   * A function that will be used to set the state of
   * the actionEmptyStringArray.
   */
  setActionEmptyStringArray: (actionEmptyStringArray: string[]) => void
  /**
   * A function that will be used to update the
   * action that is being displayed.
   */
  setDisplayedAction: (displayedAction: number) => void
  /**
   * Remounts the component.
   */
  remount: () => void
  /**
   * A function that will be used to notify the parent
   * component that this component has changed.
   */
  handleChange: () => void
}): JSX.Element | null {
  let node: ClientMissionNode = props.node
  let isEmptyString: boolean = props.isEmptyString
  let displayedAction: number = props.displayedAction
  let actionEmptyStringArray: string[] = props.actionEmptyStringArray
  let setActionEmptyStringArray = props.setActionEmptyStringArray
  let setDisplayedAction = props.setDisplayedAction
  let remount = props.remount
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
          remount()
        } else {
          setDisplayedAction(displayedAction + 1)
          remount()
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
            remount={remount}
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
