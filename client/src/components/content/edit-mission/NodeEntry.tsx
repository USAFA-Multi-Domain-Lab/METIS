import { useGlobalContext } from 'src/context'
import ClientMission from 'src/missions'
import ClientMissionAction from 'src/missions/actions'
import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import Tooltip from '../communication/Tooltip'
import {
  Detail,
  DetailBox,
  DetailDropDown,
  DetailNumber,
  DetailToggle,
} from '../form/Form'
import List, { ESortByMethod } from '../general-layout/List'
import {
  EMiniButtonSVGPurpose,
  MiniButtonSVG,
} from '../user-controls/MiniButtonSVG'
import { MiniButtonSVGPanel } from '../user-controls/MiniButtonSVGPanel'
import { EToggleLockState } from '../user-controls/Toggle'
import './NodeEntry.scss'

/**
 * This will render the entry fields for a mission-node
 * within the MissionFormPage component.
 */
export default function NodeEntry({
  node,
  missionPath,
  isEmptyString,
  nodeEmptyStringArray,
  setNodeEmptyStringArray,
  setMissionPath,
  setSelectedAction,
  handleChange,
  handleAddRequest,
  handleDeleteRequest,
}: TNodeEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const globalContext = useGlobalContext()
  const [colorOptions] = globalContext.missionNodeColors
  const { notify } = globalContext.actions

  /* -- COMPUTED -- */
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
   * The class name for the delete node button.
   */
  const deleteNodeClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['FormButton', 'DeleteNode']

    // If the mission has only one node, add the disabled class.
    if (node && node.mission.nodes.length < 2) {
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
  /**
   * The class name for the list of actions.
   */
  const actionClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['AltDesign2']

    // If there is at least one empty field, add the error class.
    if (isEmptyString) {
      classList.unshift('Disabled')
    }

    // If the node is not executable then hide the list of actions.
    if (node && !node.executable) {
      classList.unshift('Hidden')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The class name for the new action container.
   */
  const newActionClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['NewAction']

    // If there is at least one empty field, add the disabled class.
    if (isEmptyString) {
      classList.push('Disabled')
    }

    // If the node is not executable then hide the add action container.
    if (node && !node.executable) {
      classList.push('Hidden')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The name of the mission.
   */
  const missionName: string = compute(() => {
    return node?.mission.name ?? ClientMission.DEFAULT_PROPERTIES.name
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

  /**
   * This handles deleting an action from the selected node.
   */
  const handleDeleteActionRequest = (action: ClientMissionAction) => {
    if (node !== null) {
      node.actions.delete(action.actionID)
      handleChange()
    }
  }

  /**
   * This handles editing an action from the selected node.
   */
  const handleEditActionRequest = (action: ClientMissionAction) => {
    setSelectedAction(action)
    missionPath.push(action.name)
  }

  /**
   * This will handle the click event for the path position.
   * @param index The index of the path position that was clicked.
   */
  const handlePathPositionClick = (index: number) => {
    // If the index is 0 then take the user
    // back to the mission entry.
    if (index === 0 && node !== null) {
      node.mission.deselectNode()
    }
  }

  /* -- RENDER -- */

  if (node !== null) {
    return (
      <div className='NodeEntry SidePanel'>
        <div className='BorderBox'>
          {/* -- TOP OF BOX -- */}
          <div className={boxTopClassName}>
            <div className='BackContainer'>
              <div
                className='BackButton'
                onClick={() => {
                  missionPath.pop()
                  if (node !== null) {
                    node.mission.deselectNode()
                  }
                }}
              >
                &lt;
                <Tooltip description='Go back.' />
              </div>
            </div>
            <div className='ErrorMessage'>
              Fix all errors before closing panel.
            </div>
            <div className='Path'>
              Location:{' '}
              {missionPath.map((position: string, index: number) => {
                return (
                  <span className='Position' key={`position-${index}`}>
                    <span
                      className='PositionText'
                      onClick={() => handlePathPositionClick(index)}
                    >
                      {position}
                    </span>{' '}
                    {index === missionPath.length - 1 ? '' : ' > '}
                  </span>
                )
              })}
            </div>
          </div>

          {/* -- MAIN CONTENT -- */}
          <div className='SidePanelSection'>
            <Detail
              label='Name'
              initialValue={node.name}
              deliverValue={(name: string) => {
                if (node !== null && name !== '') {
                  node.name = name
                  setMissionPath([missionName, name])
                  removeNodeEmptyString('name')
                  handleChange()
                } else if (node !== null && name === '') {
                  setNodeEmptyStringArray([
                    ...nodeEmptyStringArray,
                    `nodeID=${node.nodeID}_field=name`,
                  ])
                }
              }}
              key={`${node.nodeID}_name`}
            />
            <DetailDropDown<string>
              label={'Color'}
              options={colorOptions}
              currentValue={`Choose a color`}
              isExpanded={true}
              renderDisplayName={(color) => color}
              deliverValue={(color: string) => {
                if (node !== null) {
                  node.color = color

                  handleChange()
                }
              }}
              uniqueClassName='Color'
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

            {/* -- ACTIONS -- */}
            <List<ClientMissionAction>
              items={Array.from(node.actions.values())}
              renderItemDisplay={(action: ClientMissionAction) => {
                /* -- COMPUTED -- */
                /**
                 * The buttons for the action list.
                 */
                const actionButtons = compute(() => {
                  // Create a default list of buttons.
                  let buttons: MiniButtonSVG[] = []

                  // If the action is available then add the edit and remove buttons.
                  let availableMiniActions = {
                    edit: new MiniButtonSVG({
                      ...MiniButtonSVG.defaultProps,
                      purpose: EMiniButtonSVGPurpose.Edit,
                      handleClick: () => handleEditActionRequest(action),
                      tooltipDescription: 'Edit action.',
                    }),
                    remove: new MiniButtonSVG({
                      ...MiniButtonSVG.defaultProps,
                      purpose: EMiniButtonSVGPurpose.Remove,
                      handleClick: () => handleDeleteActionRequest(action),
                      tooltipDescription: 'Remove action.',
                    }),
                  }

                  // Add the buttons to the list.
                  buttons.push(availableMiniActions.edit)
                  buttons.push(availableMiniActions.remove)

                  // Return the buttons.
                  return buttons
                })

                return (
                  <div
                    className='ActionRow'
                    key={`action-row-${action.actionID}`}
                  >
                    <div className='Action'>
                      {action.name}{' '}
                      <Tooltip description={action.description ?? ''} />
                    </div>
                    <MiniButtonSVGPanel buttons={actionButtons} />
                  </div>
                )
              }}
              headingText={'Actions:'}
              sortByMethods={[ESortByMethod.Name]}
              nameProperty={'name'}
              alwaysUseBlanks={false}
              searchableProperties={['actionID']}
              noItemsDisplay={
                <div className='NoContent'>No actions available...</div>
              }
              ajaxStatus={'Loaded'}
              applyItemStyling={() => {
                return {}
              }}
              itemsPerPage={null}
              listSpecificItemClassName={actionClassName}
            />

            {/* -- NEW ACTION BUTTON -- */}
            <div className={newActionClassName}>
              <div className='ButtonContainer'>
                <div
                  className='FormButton AddAction'
                  onClick={() => {
                    let newAction: ClientMissionAction =
                      new ClientMissionAction(node)
                    setSelectedAction(newAction)
                    node.actions.set(newAction.actionID, newAction)
                    missionPath.push(newAction.name)
                    handleChange()
                  }}
                >
                  <span className='Text'>
                    <span className='LeftBracket'>[</span> New Action{' '}
                    <span className='RightBracket'>]</span>
                    <Tooltip description='Create a new action.' />
                  </span>
                </div>
              </div>
            </div>

            {/* -- BUTTON(S) -- */}
            <div className='ButtonContainer'>
              <div className={addNodeClassName}>
                <span className='Text' onClick={handleAddRequest}>
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
        </div>
      </div>
    )
  } else {
    return null
  }
}

/* ---------------------------- TYPES FOR NODE ENTRY ---------------------------- */

// The props for the NodeEntry component.
export type TNodeEntry_P = {
  /**
   * The mission-node to be edited.
   */
  node: ClientMissionNode | null
  /**
   * The path showing the user's location in the side panel.
   * @note This will help the user understand what they are editing.
   */
  missionPath: string[]
  /**
   * A boolean that will determine if a field has been left empty.
   */
  isEmptyString: boolean
  /**
   * An array of strings that will be used to determine
   * if a field has been left empty.
   */
  nodeEmptyStringArray: string[]
  /**
   * A function that will set the array of strings that
   * will be used to determine if a field has been left empty.
   */
  setNodeEmptyStringArray: (nodeEmptyStringArray: string[]) => void
  /**
   * A function that will set the mission path.
   */
  setMissionPath: (missionPath: string[]) => void
  /**
   * A function that will set the action that is selected.
   */
  setSelectedAction: (action: ClientMissionAction | null) => void
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
}
