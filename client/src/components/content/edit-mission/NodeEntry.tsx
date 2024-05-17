import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMissionAction from 'src/missions/actions'
import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import { ReactSetter } from 'src/toolbox/types'
import { SingleTypeObject } from '../../../../../shared/toolbox/objects'
import Tooltip from '../communication/Tooltip'
import {
  DetailDropDown,
  DetailLargeString,
  DetailNumber,
  DetailString,
  DetailToggle,
} from '../form/Form'
import List, { ESortByMethod } from '../general-layout/List'
import ButtonSvgPanel, {
  TValidPanelButton,
} from '../user-controls/ButtonSvgPanel'
import { ButtonText } from '../user-controls/ButtonText'
import { TToggleLockState } from '../user-controls/Toggle'
import './NodeEntry.scss'

/**
 * This will render the entry fields for a mission-node
 * within the MissionPage component.
 */
export default function NodeEntry({
  node,
  setSelectedAction,
  handleChange,
  handleAddRequest,
  handleDeleteRequest,
}: TNodeEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const globalContext = useGlobalContext()
  const [colorOptions] = globalContext.missionNodeColors
  const { notify, forceUpdate } = globalContext.actions

  /* -- STATE -- */
  const [nodeName, setNodeName] = useState<string>(node.name)
  const [color, setColor] = useState<string>(node.color)
  const [description, setDescription] = useState<string>(node.description)
  const [preExecutionText, setPreExecutionText] = useState<string>(
    node.preExecutionText,
  )
  const [depthPadding, setDepthPadding] = useState<string>(
    `${node.depthPadding}`,
  )
  const [executable, setExecutable] = useState<boolean>(node.executable)
  const [device, setDevice] = useState<boolean>(node.device)

  /* -- COMPUTED -- */
  /**
   * The name of the mission.
   */
  const missionName: string = compute(() => node.mission.name)
  /**
   * The current location within the mission.
   */
  const missionPath: string[] = compute(() => [missionName, nodeName])
  /**
   * The class name for the list of actions.
   */
  const actionClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['AltDesign2']

    // If the node is not executable then hide the list of actions.
    if (!executable) {
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
    let classList: string[] = ['ButtonContainer', 'New']

    // If the node is not executable then hide the add action container.
    if (!executable) {
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
    let classList: string[] = []

    // If the mission has only one node, add the disabled class.
    if (node && node.mission.nodes.length < 2) {
      classList.push('Disabled')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The lock state for the device toggle.
   */
  const deviceLockState: TToggleLockState = compute(() => {
    // If the node is executable then the device toggle
    // should be unlocked.
    if (executable) {
      return 'unlocked'
    }
    // If the node is not executable, but it's a device
    // then the device toggle should be locked for activation.
    else if (!executable && device) {
      return 'locked-activation'
    }
    // If the node is not executable and it's not a device
    // then the device toggle should be locked for deactivation.
    else if (!executable && !device) {
      return 'locked-deactivation'
    }
    // Otherwise, the device toggle should be locked for deactivation.
    else {
      return 'locked-deactivation'
    }
  })

  /* -- EFFECTS -- */

  // Sync the component state with the node.
  usePostInitEffect(() => {
    node.name = nodeName
    node.color = color
    node.description = description
    node.preExecutionText = preExecutionText
    node.depthPadding = parseInt(depthPadding)
    node.executable = executable
    node.device = device

    // If the node is not executable, then the device
    // status should be false.
    if (!executable && device) setDevice(false)
    // Allow the user to save the changes.
    handleChange()
  }, [
    nodeName,
    color,
    description,
    preExecutionText,
    depthPadding,
    executable,
    device,
  ])

  // Auto-generate an action if the node becomes executable.
  usePostInitEffect(() => {
    if (executable) {
      autoGenerateAction()
    }
  }, [executable])

  /* -- FUNCTIONS -- */

  /**
   * This handles deleting an action from the selected node.
   */
  const handleDeleteActionRequest = (action: ClientMissionAction) => {
    // Remove the action from the node.
    node.actions.delete(action._id)
    // Display the changes.
    forceUpdate()
    // Allow the user to save the changes.
    handleChange()
  }

  /**
   * This will handle the click event for the path position.
   * @param index The index of the path position that was clicked.
   */
  const handlePathPositionClick = (index: number) => {
    // If the index is 0 then take the user
    // back to the mission entry.
    if (index === 0) {
      node.mission.deselectNode()
    }
  }

  /**
   * Handles creating a new action.
   */
  const createAction = () => {
    // Create a new action object.
    let newAction: ClientMissionAction = new ClientMissionAction(node)
    // Update the action stored in the state.
    setSelectedAction(newAction)
    // Add the action to the node.
    node.actions.set(newAction._id, newAction)
    // Display the changes.
    forceUpdate()
    // Allow the user to save the changes.
    handleChange()
  }

  /**
   * Automatically generates an action for the node if it is executable
   * and has no actions to execute.
   */
  const autoGenerateAction = () => {
    if (node.executable && node.actions.size === 0) {
      // Checks to make sure the selected node has
      // at least one action to choose from. If the
      // selected node does not have at least one
      // action then it will auto-generate one for
      // that node.
      let newAction: ClientMissionAction = new ClientMissionAction(node)

      node.actions.set(newAction._id, newAction)

      notify(
        `Auto-generated an action for ${node.name} because it is an executable node with no actions to execute.`,
      )
    }
  }

  /**
   * Renders JSX for the back button.
   */
  const renderBackButtonJsx = (): JSX.Element | null => {
    return (
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
    )
  }

  /**
   * Renders JSX for the path of the mission.
   */
  const renderPathJsx = (): JSX.Element | null => {
    return (
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
    )
  }

  /**
   * Renders JSX for an action list item.
   */
  const renderActionListItemJsx = (action: ClientMissionAction) => {
    {
      /* -- COMPUTED -- */
      /**
       * The buttons for the action list.
       */
      const actionButtons = compute(() => {
        // Create a default list of buttons.
        let buttons: TValidPanelButton[] = []

        // If the action is available then add the edit and remove buttons.
        let availableMiniActions: SingleTypeObject<TValidPanelButton> = {
          edit: {
            icon: 'edit',
            key: 'edit',
            onClick: () => setSelectedAction(action),
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
        <div className='Row' key={`action-row-${action._id}`}>
          <div className='RowContent'>
            {action.name} <Tooltip description={action.description ?? ''} />
          </div>
          <ButtonSvgPanel buttons={actionButtons} size={'small'} />
        </div>
      )
    }
  }

  /* -- RENDER -- */

  return (
    <div className='NodeEntry SidePanel'>
      <div className='BorderBox'>
        {/* -- TOP OF BOX -- */}
        <div className='BoxTop'>
          {renderBackButtonJsx()}
          {renderPathJsx()}
        </div>

        {/* -- MAIN CONTENT -- */}
        <div className='SidePanelSection'>
          <DetailString
            fieldType='required'
            handleOnBlur='repopulateValue'
            label='Name'
            stateValue={nodeName}
            setState={setNodeName}
            defaultValue={ClientMissionNode.DEFAULT_PROPERTIES.name}
            key={`${node._id}_name`}
          />
          <DetailDropDown<string>
            fieldType='required'
            label='Color'
            options={colorOptions}
            stateValue='Choose a color'
            setState={setColor}
            isExpanded={false}
            renderDisplayName={() => 'Choose a color'}
            uniqueClassName='Color'
            uniqueOptionStyling={(newColor: string) => {
              if (color === newColor) {
                return {
                  backgroundColor: `${newColor}`,
                  width: '65%',
                  height: '62%',
                  margin: '4px 3px 3px 4px',
                  border: '2px solid black',
                }
              } else {
                return {
                  backgroundColor: `${newColor}`,
                }
              }
            }}
            key={`${node._id}_color`}
          />
          <div className='ColorInfo'>
            <div className='SelectedColorText'>
              Selected color:{' '}
              <span
                className='SelectedColorBox'
                style={{ backgroundColor: `${color}` }}
              ></span>
            </div>
            <ButtonText
              text={'Fill'}
              onClick={() => {
                node.applyColorFill()
                handleChange()
              }}
            />
          </div>
          <DetailLargeString
            fieldType='optional'
            handleOnBlur='none'
            label='Description'
            stateValue={description}
            setState={setDescription}
            elementBoundary='.BorderBox'
            placeholder='Enter description...'
            key={`${node._id}_description`}
          />
          <DetailLargeString
            fieldType='optional'
            handleOnBlur='none'
            label='Pre-Execution Text'
            stateValue={preExecutionText}
            setState={setPreExecutionText}
            elementBoundary='.BorderBox'
            placeholder='Enter pre-execution text...'
            key={`${node._id}_preExecutionText`}
          />
          <DetailNumber
            fieldType='required'
            label='Depth Padding'
            stateValue={depthPadding}
            setState={setDepthPadding}
            integersOnly={true}
            key={`${node._id}_depthPadding`}
          />
          <DetailToggle
            fieldType='required'
            label='Executable'
            stateValue={executable}
            setState={setExecutable}
            key={`${node._id}_executable`}
          />
          <DetailToggle
            fieldType='required'
            label='Device'
            stateValue={device}
            setState={setDevice}
            lockState={deviceLockState}
            key={`${node._id}_device`}
          />

          {/* -- ACTIONS -- */}
          <List<ClientMissionAction>
            items={Array.from(node.actions.values())}
            renderItemDisplay={(action) => renderActionListItemJsx(action)}
            headingText={'Actions:'}
            sortByMethods={[ESortByMethod.Name]}
            nameProperty={'name'}
            alwaysUseBlanks={false}
            searchableProperties={['name']}
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
          <div className={newActionClassName}>
            <ButtonText
              text='New Action'
              onClick={createAction}
              tooltipDescription='Create a new action.'
            />
          </div>

          {/* -- BUTTON(S) -- */}
          <div className='ButtonContainer'>
            <ButtonText
              text='Add adjacent node'
              onClick={handleAddRequest}
              tooltipDescription='Add one or multiple nodes adjacent to this node.'
            />
            <ButtonText
              text='Delete node'
              onClick={handleDeleteRequest}
              tooltipDescription='Delete this node.'
              uniqueClassName={deleteNodeClassName}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------- TYPES FOR NODE ENTRY ---------------------------- */

// The props for the NodeEntry component.
export type TNodeEntry_P = {
  /**
   * The mission-node to be edited.
   */
  node: ClientMissionNode
  /**
   * React setter function used to update the value stored
   * in a component's state.
   */
  setSelectedAction: ReactSetter<ClientMissionAction | null>
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
