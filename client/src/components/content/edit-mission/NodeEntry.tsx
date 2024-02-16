import { useState } from 'react'
import ClientMissionNode from 'src/missions/nodes'
import ClientMissionAction from 'src/missions/actions'
import ClientMission from 'src/missions'
import Tooltip from '../communication/Tooltip'
import {
  Detail,
  DetailBox,
  DetailDropDown,
  DetailNumber,
  DetailToggle,
} from '../form/Form'
import { EToggleLockState } from '../user-controls/Toggle'
import NodeActionDetails from './NodeActionDetails'
import './NodeEntry.scss'
import { useGlobalContext } from 'src/context'
import { useMountHandler } from 'src/toolbox/hooks'
import { compute } from 'src/toolbox'

/**
 * This will render the entry fields for a mission-node
 * within the MissionFormPage component.
 */
export default function NodeEntry(props: TNodeEntryProps): JSX.Element | null {
  /* -- PROPS -- */
  const {
    node,
    displayedAction,
    nodeEmptyStringArray,
    actionEmptyStringArray,
    setDisplayedAction,
    setNodeEmptyStringArray,
    setActionEmptyStringArray,
    handleChange,
    handleAddRequest: handleAddNodeRequest,
    handleDeleteRequest,
    handleCloseRequest,
  } = props

  /* -- GLOBAL CONTEXT -- */
  const globalContext = useGlobalContext()
  const [colorOptions] = globalContext.missionNodeColors
  const { notify } = globalContext.actions

  /* -- STATE -- */
  const [deliverNameError, setDeliverNameError] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>(
    'At least one character is required here.',
  )

  /* -- COMPUTED -- */

  /**
   * If the node has at least one empty field.
   */
  const isEmptyString: boolean = compute(() => {
    return nodeEmptyStringArray.length > 0 || actionEmptyStringArray.length > 0
  })
  /**
   * The class name for the top of the box.
   */
  const boxTopClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['BoxTop']

    // If there is at least one empty field, add the error class.
    if (isEmptyString) {
      classList.push('IsError')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The class name for the close button.
   */
  const closeClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['Close']

    // If there is at least one empty field, add the disabled class.
    if (isEmptyString) {
      classList.push('Disabled')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The class name for the delete node button.
   */
  const deleteNodeClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['FormButton', 'DeleteNode']

    // If the mission has only one node, add the disabled class.
    if (node && node.mission.nodes.size < 2) {
      classList.push('Disabled')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The class name for the add node button.
   */
  const addNodeClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['FormButton', 'AddNode']

    // If there is at least one empty field, add the disabled class.
    if (isEmptyString) {
      classList.push('Disabled')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The error message for the close button.
   */
  const toggleErrorMessage: string | undefined = compute(() => {
    if (isEmptyString) {
      return 'The button above is locked until there are no empty fields.'
    } else {
      return undefined
    }
  })

  /* -- EFFECTS -- */

  const [mountHandled, remount] = useMountHandler(async (done) => {
    done()
  })

  /* -- FUNCTIONS -- */

  /**
   * If a field that was previously left empty meets the
   * requirements then this will remove the key that was
   * stored when the field was empty which will let the
   * user know that the field has met its requirements
   * when the state updates.
   * @param field The field that was previously left empty.
   */
  const removeNodeEmptyString = (field: string) => {
    nodeEmptyStringArray.map((nodeEmptyString: string, index: number) => {
      if (
        node !== null &&
        nodeEmptyString === `nodeID=${node.nodeID}_field=${field}`
      ) {
        nodeEmptyStringArray.splice(index, 1)
      }
    })
  }

  /* -- RENDER -- */

  if (node !== null) {
    return (
      <div className='NodeEntry SidePanel'>
        <div className='BorderBox'>
          <div className={boxTopClassName}>
            <div className='ErrorMessage'>
              Fix all errors before closing panel.
            </div>
            <div
              className={closeClassName}
              onClick={() => {
                if (!isEmptyString) {
                  handleCloseRequest()
                } else if (node !== null) {
                  notify(
                    `**Error:** The node called "${node.name.toLowerCase()}" has at least one field that was left empty. These fields must contain at least one character.`,
                    { duration: null, errorMessage: true },
                  )
                }
                remount()
              }}
              key={'close-node-side-panel'}
            >
              <div className='CloseButton'>
                x
                <Tooltip description='Close panel.' />
              </div>
            </div>
          </div>
          <div className='SidePanelSection'>
            <Detail
              label='Name'
              initialValue={node.name}
              deliverValue={(name: string) => {
                if (node !== null && name !== '') {
                  node.name = name
                  removeNodeEmptyString('name')
                  setDeliverNameError(false)
                  remount()
                  handleChange()
                } else if (node !== null && name === '') {
                  setDeliverNameError(true)
                  setNodeEmptyStringArray([
                    ...nodeEmptyStringArray,
                    `nodeID=${node.nodeID}_field=name`,
                  ])
                  remount()
                }
              }}
              options={{
                deliverError: deliverNameError,
                deliverErrorMessage: errorMessage,
              }}
              key={`${node.nodeID}_name`}
            />
            <DetailDropDown<string>
              label={'Color'}
              options={colorOptions}
              currentValue={`Choose a color`}
              isExpanded={true}
              uniqueDropDownStyling={{}}
              uniqueOptionStyling={(color) => {
                if (node && node.color === color) {
                  return {
                    backgroundColor: `${color}`,
                    width: '65%',
                    height: '62%',
                    margin: '4px 3px 3px 4px',
                    border: '2px solid black',
                  }
                } else {
                  return {
                    backgroundColor: `${color}`,
                  }
                }
              }}
              renderOptionClassName={(color) => {
                return ''
              }}
              renderDisplayName={(color) => color}
              deliverValue={(color: string) => {
                if (node !== null) {
                  node.color = color

                  handleChange()
                }
              }}
              optional={{
                uniqueClassName: 'Color',
              }}
              key={`${node.nodeID}_color`}
            />
            <div className='ColorInfo'>
              <div className='SelectedColorText'>
                Selected color:{' '}
                <span
                  className='SelectedColorBox'
                  style={{ backgroundColor: `${node.color}` }}
                >
                  {node.color}
                </span>
              </div>
              <div className='ButtonContainer'>
                <div
                  className='ColorFill Detail FormButton'
                  onClick={() => {
                    if (node !== null) {
                      node.applyColorFill()
                      handleChange()
                    }
                  }}
                >
                  <span className='Text'>
                    <span className='LeftBracket'>[</span> Fill{' '}
                    <span className='RightBracket'>]</span>
                    <Tooltip description='Shade all descendant nodes this color as well.' />
                  </span>
                </div>
              </div>
            </div>
            <DetailBox
              label='Description (optional)'
              initialValue={node.description}
              deliverValue={(description: string) => {
                if (node !== null) {
                  node.description = description
                  handleChange()
                }
              }}
              options={{
                emptyStringAllowed: true,
                elementBoundary: '.BorderBox',
              }}
              key={`${node.nodeID}_description`}
            />
            <DetailBox
              label='Pre-Execution Text (optional)'
              initialValue={node.preExecutionText}
              deliverValue={(preExecutionText: string) => {
                if (node !== null) {
                  node.preExecutionText = preExecutionText
                  handleChange()
                }
              }}
              options={{
                emptyStringAllowed: true,
                elementBoundary: '.BorderBox',
              }}
              key={`${node.nodeID}_preExecutionText`}
            />
            <DetailNumber
              label='Depth Padding'
              initialValue={node.depthPadding}
              deliverValue={(depthPadding: number | null | undefined) => {
                if (
                  node !== null &&
                  depthPadding !== null &&
                  depthPadding !== undefined
                ) {
                  node.depthPadding = depthPadding
                  handleChange()
                }
              }}
              key={`${node.nodeID}_depthPadding`}
            />
            <DetailToggle
              label={'Executable'}
              initialValue={node.executable}
              deliverValue={(executable: boolean) => {
                if (node !== null) {
                  node.executable = executable

                  if (executable && node.actions.size === 0) {
                    // Checks to make sure the selected node has
                    // at least one action to choose from. If the
                    // selected node does not have at least one
                    // action then it will auto-generate one for
                    // that node.
                    let newAction: ClientMissionAction =
                      new ClientMissionAction(node)

                    node.actions.set(newAction.actionID, newAction)

                    notify(
                      `Auto-generated an action for ${node.name} because it is an executable node with no actions to execute.`,
                    )
                  }
                }

                handleChange()
              }}
              lockState={
                // Locks the toggle if there are empty fields.
                !isEmptyString
                  ? EToggleLockState.Unlocked
                  : isEmptyString && node.executable
                  ? EToggleLockState.LockedActivation
                  : isEmptyString && !node.executable
                  ? EToggleLockState.LockedDeactivation
                  : EToggleLockState.Unlocked
              }
              options={{
                errorMessage:
                  'The button above is locked until there are no empty fields.',
              }}
              key={`${node.nodeID}_executable`}
            />
            <DetailToggle
              label={'Device'}
              initialValue={node.device}
              lockState={
                // Locks the toggle if there are empty fields.
                !isEmptyString && node.executable
                  ? EToggleLockState.Unlocked
                  : isEmptyString && node.executable && node.device
                  ? EToggleLockState.LockedActivation
                  : isEmptyString && node.executable && !node.device
                  ? EToggleLockState.LockedDeactivation
                  : EToggleLockState.LockedDeactivation
              }
              deliverValue={(device: boolean) => {
                if (node !== null) {
                  node.device = device
                  handleChange()
                }
              }}
              options={{
                errorMessage: toggleErrorMessage,
              }}
              key={`${node.nodeID}_device`}
            />
            <div className='ButtonContainer'>
              <div className={addNodeClassName}>
                <span className='Text' onClick={handleAddNodeRequest}>
                  <span className='LeftBracket'>[</span> Add adjacent node{' '}
                  <span className='RightBracket'>]</span>
                  <Tooltip description='Add one or multiple nodes adjacent to this node.' />
                </span>
              </div>
              <div className={deleteNodeClassName}>
                <span className='Text' onClick={handleDeleteRequest}>
                  <span className='LeftBracket'>[</span> Delete node{' '}
                  <span className='RightBracket'>]</span>
                  <Tooltip description='Delete this node.' />
                </span>
              </div>
            </div>
          </div>
          <NodeActionDetails
            node={node}
            isEmptyString={isEmptyString}
            displayedAction={displayedAction}
            actionEmptyStringArray={actionEmptyStringArray}
            setActionEmptyStringArray={setActionEmptyStringArray}
            setDisplayedAction={setDisplayedAction}
            remount={remount}
            handleChange={handleChange}
          />
        </div>
      </div>
    )
  } else {
    return null
  }
}

/* ---------------------------- TYPES FOR NODE ENTRY ---------------------------- */

// The props for the NodeEntry component.
export type TNodeEntryProps = {
  /**
   * The mission-node to be edited.
   */
  node: ClientMissionNode | null
  /**
   * The current action being displayed. This is used for
   * pagination purposes. ***This is passed down to the
   * NodeActionDetails component.***
   */
  displayedAction: number
  /**
   * An array of strings that will be used to determine
   * if a field has been left empty.
   */
  nodeEmptyStringArray: Array<string>
  /**
   * An array of strings that will be used to determine
   * if a field has been left empty. ***This is passed down
   * to the NodeActionDetails component.***
   */
  actionEmptyStringArray: Array<string>
  /**
   * A function that will set the current action being
   * displayed. ***This is passed down to the
   * NodeActionDetails component.***
   */
  setDisplayedAction: (displayedAction: number) => void
  /**
   * A function that will set the array of strings that
   * will be used to determine if a field has been left empty.
   */
  setNodeEmptyStringArray: (nodeEmptyStringArray: Array<string>) => void
  /**
   * A function that will set the array of strings that
   * will be used to determine if a field has been left empty.
   * ***This is passed down to the NodeActionDetails component.***
   */
  setActionEmptyStringArray: (actionEmptyStringArray: Array<string>) => void
  /**
   * A function that will be called when a change has been made.
   */
  handleChange: () => void
  /**
   * A function that will be called when the user wants to
   * add a new mission-node.
   */
  handleAddRequest: () => void
  /**
   * A function that will be called when the user wants to
   * delete a mission-node.
   */
  handleDeleteRequest: () => void
  /**
   * A function that will be called when the user wants to
   * close the mission-node side panel.
   */
  handleCloseRequest: () => void
}
