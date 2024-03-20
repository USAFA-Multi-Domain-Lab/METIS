import { useGlobalContext } from 'src/context'
import ClientMission from 'src/missions'
import ClientMissionAction from 'src/missions/actions'
import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import { SingleTypeObject } from '../../../../../shared/toolbox/objects'
import Tooltip from '../communication/Tooltip'
import {
  Detail,
  DetailBox,
  DetailDropDown,
  DetailNumber,
  DetailToggle,
} from '../form/Form'
import List, { ESortByMethod } from '../general-layout/List'
import ButtonSvgPanel, {
  TValidPanelButton,
} from '../user-controls/ButtonSvgPanel'
import { ButtonText } from '../user-controls/ButtonText'
import './NodeEntry.scss'

/**
 * This will render the entry fields for a mission-node
 * within the MissionPage component.
 */
export default function NodeEntry({
  node,
  missionPath,
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
   * The name of the mission.
   */
  const missionName: string = compute(
    () => node?.mission.name ?? ClientMission.DEFAULT_PROPERTIES.name,
  )
  /**
   * The class name for the list of actions.
   */
  const actionClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['AltDesign2']

    // If the node is not executable then hide the list of actions.
    if (!node?.executable) {
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

    // If the node is not executable then hide the add action container.
    if (node && !node.executable) {
      classList.push('Hidden')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The classes for the remove action button.
   */
  const removeActionClassList = compute((): string[] => {
    // Create a default list of class names.
    let classList: string[] = ['']

    // If there is only one action then add the disabled class.
    if (node && node.actions.size < 2) {
      classList.push('Disabled')
    }

    // Return the class list.
    return classList
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

  /* -- FUNCTIONS -- */

  /**
   * This handles deleting an action from the selected node.
   */
  const handleDeleteActionRequest = (action: ClientMissionAction) => {
    if (node) {
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
    if (node && index === 0) {
      node.mission.deselectNode()
    }
  }

  /**
   * Handles creating a new action.
   */
  const createAction = () => {
    // If the node is available then create a new action.
    if (node) {
      // Create a new action object.
      let newAction: ClientMissionAction = new ClientMissionAction(node)
      // Update the action stored in the state.
      setSelectedAction(newAction)
      // Add the action to the node.
      node.actions.set(newAction.actionID, newAction)
      // Allow the user to save the changes.
      handleChange()
    }
  }

  /* -- RENDER -- */

  if (node) {
    return (
      <div className='NodeEntry SidePanel'>
        <div className='BorderBox'>
          {/* -- TOP OF BOX -- */}
          <div className='BoxTop'>
            <div className='BackContainer'>
              <div
                className='BackButton'
                onClick={() => {
                  missionPath.pop()
                  node.mission.deselectNode()
                }}
              >
                &lt;
                <Tooltip description='Go back.' />
              </div>
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
              currentValue={node.name}
              defaultValue={ClientMissionNode.DEFAULT_PROPERTIES.name}
              deliverValue={(name: string) => {
                node.name = name
                setMissionPath([missionName, name])
                handleChange()
              }}
              key={`${node.nodeID}_name`}
            />
            <DetailDropDown<string>
              label={'Color'}
              options={colorOptions}
              currentValue={`Choose a color`}
              isExpanded={false}
              renderDisplayName={(color) => color}
              deliverValue={(color: string) => {
                node.color = color
                handleChange()
              }}
              uniqueClassName='Color'
              uniqueOptionStyling={(color) => {
                if (node.color === color) {
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
              <ButtonText
                text={'Fill'}
                onClick={() => {
                  node.applyColorFill()
                  handleChange()
                }}
              />
            </div>
            <DetailBox
              label='Description'
              currentValue={node.description}
              deliverValue={(description: string) => {
                node.description = description
                handleChange()
              }}
              elementBoundary='.BorderBox'
              placeholder='Enter description...'
              displayOptionalText={true}
              key={`${node.nodeID}_description`}
            />
            <DetailBox
              label='Pre-Execution Text'
              currentValue={node.preExecutionText}
              deliverValue={(preExecutionText: string) => {
                node.preExecutionText = preExecutionText
                handleChange()
              }}
              elementBoundary='.BorderBox'
              placeholder='Enter pre-execution text...'
              displayOptionalText={true}
              key={`${node.nodeID}_preExecutionText`}
            />
            <DetailNumber
              label='Depth Padding'
              currentValue={node.depthPadding}
              defaultValue={ClientMissionNode.DEFAULT_PROPERTIES.depthPadding}
              emptyValueAllowed={false}
              integersOnly={true}
              deliverValue={(depthPadding: number | null) => {
                if (depthPadding !== null) {
                  node.depthPadding = depthPadding
                  handleChange()
                }
              }}
              key={`${node.nodeID}_depthPadding`}
            />
            <DetailToggle
              label={'Executable'}
              currentValue={node.executable}
              deliverValue={(executable: boolean) => {
                node.executable = executable

                if (executable && node.actions.size === 0) {
                  // Checks to make sure the selected node has
                  // at least one action to choose from. If the
                  // selected node does not have at least one
                  // action then it will auto-generate one for
                  // that node.
                  let newAction: ClientMissionAction = new ClientMissionAction(
                    node,
                  )

                  node.actions.set(newAction.actionID, newAction)

                  notify(
                    `Auto-generated an action for ${node.name} because it is an executable node with no actions to execute.`,
                  )
                }

                handleChange()
              }}
              key={`${node.nodeID}_executable`}
            />
            <DetailToggle
              label={'Device'}
              currentValue={node.device}
              lockState={
                // Locks the toggle if the node is not executable.
                node.executable
                  ? 'unlocked'
                  : !node.executable && node.device
                  ? 'locked-activation'
                  : !node.executable && !node.device
                  ? 'locked-deactivation'
                  : 'locked-deactivation'
              }
              deliverValue={(device: boolean) => {
                node.device = device
                handleChange()
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
                  let buttons: TValidPanelButton[] = []

                  // If the action is available then add the edit and remove buttons.
                  let availableMiniActions: SingleTypeObject<TValidPanelButton> =
                    {
                      edit: {
                        icon: 'edit',
                        key: 'edit',
                        onClick: () => handleEditActionRequest(action),
                        tooltipDescription: 'Edit action.',
                      },
                      remove: {
                        icon: 'remove',
                        key: 'remove',
                        onClick: () => handleDeleteActionRequest(action),
                        tooltipDescription: 'Remove action.',
                        uniqueClassList: removeActionClassList,
                      },
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
                    <ButtonSvgPanel buttons={actionButtons} size={'small'} />
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
                <div className='FormButton AddAction' onClick={createAction}>
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
              <div className='FormButton AddNode'>
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
