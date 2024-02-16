import ClientMissionNode from 'src/missions/nodes'
import ClientMissionAction from 'src/missions/actions'
import { ButtonSVG, EButtonSVGPurpose } from '../user-controls/ButtonSVG'
import NodeActionEntry from './NodeActionEntry'
import './NodeActionDetails.scss'
import { useGlobalContext } from 'src/context'
import { compute } from 'src/toolbox'

/**
 * This will render the details of the action(s) available to a node.
 */
export default function NodeActionDetails(
  props: TNodeActionDetails,
): JSX.Element | null {
  /* -- PROPS -- */
  const {
    node,
    isEmptyString,
    displayedAction,
    actionEmptyStringArray,
    setActionEmptyStringArray,
    setDisplayedAction,
    remount,
    handleChange,
  } = props

  /* -- GLOBAL CONTEXT -- */
  const globalContext = useGlobalContext()
  const { notify } = globalContext.actions

  /* -- COMPUTED -- */

  /**
   * The total number of actions available to the node.
   */
  const totalActions: number | undefined = compute(() => {
    return node.actions.size
  })
  /**
   * The key for the action that is being displayed.
   */
  const actionKey: string = compute(() => {
    // Default value.
    let actionKey: string = ''

    // Logic that hides the buttons that select which action is being
    // displayed because there is 1 action or less for the selected node.
    if (node.actions.size <= 1) {
      actionKey = 'no_action_id_to_choose_from'
    }

    // Logic that keeps the app from crashing by making the key for the
    // individual action that is being displayed under the action(s) section
    // change dynamically.
    if (node.actions.size > 1) {
      actionKey = Array.from(node.actions.keys())[displayedAction]
    }

    // Return the key.
    return actionKey
  })
  /**
   * The class name for the selector container.
   */
  const selectorContainerClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['SelectorContainer']

    // Logic that hides the buttons that select which action is being
    // displayed because there is 1 action or less for the selected node.
    if (node.actions.size <= 1) {
      classList.push('Hidden')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })

  /* -- FUNCTIONS -- */

  /**
   * Display the next action in the list of actions.
   */
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

  /**
   * Display the previous action in the list of actions.
   */
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
            uniqueClassName={'Action add'}
          />
        </div>
      </>
    )
  } else {
    return null
  }
}

/* ---------------------------- TYPES FOR NODE ACTION DETAILS ---------------------------- */

/**
 * Props for NodeActionDetails component.
 */
export type TNodeActionDetails = {
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
}
