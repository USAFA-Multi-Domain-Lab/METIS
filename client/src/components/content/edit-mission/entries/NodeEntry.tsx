import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMissionAction from 'src/missions/actions'
import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import { SingleTypeObject } from '../../../../../../shared/toolbox/objects'
import Tooltip from '../../communication/Tooltip'
import { DetailColorSelector } from '../../form/DetailColorSelector'
import { DetailLargeString } from '../../form/DetailLargeString'
import { DetailNumber } from '../../form/DetailNumber'
import { DetailString } from '../../form/DetailString'
import { DetailToggle } from '../../form/DetailToggle'
import List, { ESortByMethod } from '../../general-layout/List'
import ButtonSvgPanel, {
  TValidPanelButton,
} from '../../user-controls/ButtonSvgPanel'
import { ButtonText, TButtonText } from '../../user-controls/ButtonText'
import { TToggleLockState } from '../../user-controls/Toggle'
import './index.scss'
import EntryNavigation from './navigation/EntryNavigation'

/**
 * This will render the entry fields for a mission-node
 * within the MissionPage component.
 */
export default function NodeEntry({
  node,
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
  const [depthPadding, setDepthPadding] = useState<number>(node.depthPadding)
  const [executable, setExecutable] = useState<boolean>(node.executable)
  const [device, setDevice] = useState<boolean>(node.device)
  const [applyColorFill, setApplyColorFill] = useState<boolean>(false)

  /* -- COMPUTED -- */
  /**
   * The mission for the node.
   */
  const mission = compute(() => node.mission)
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

  // todo: Switch to make this work with prototypes.
  /**
   * The class name for the delete node button.
   */
  const deleteNodeClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = []

    // If the mission has only one node, add the disabled class.
    if (node && mission.prototypes.length < 2) {
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
  /**
   * The list of buttons for the node's border color.
   */
  const colorButtons: TButtonText[] = compute(() => {
    // Create a default list of buttons.
    let buttons: TButtonText[] = []

    // Create a button that will fill all of the descendants
    // of the current node with the selected color.
    let fillButton: TButtonText = {
      text: 'Fill',
      onClick: () => setApplyColorFill(true),
      tooltipDescription: `Applies the selected color to all of the node's descendants.`,
    }

    // Add the fill button to the list of buttons.
    buttons.push(fillButton)

    // Return the buttons.
    return buttons
  })

  /* -- EFFECTS -- */

  // Sync the component state with the node.
  usePostInitEffect(() => {
    node.name = nodeName
    node.color = color
    node.description = description
    node.preExecutionText = preExecutionText
    node.depthPadding = depthPadding
    node.executable = executable
    node.device = device

    // If the node is not executable, then the device
    // status should be false.
    if (!executable && device) setDevice(false)

    // If the fill color button has been clicked, then
    // apply the color fill to the node and all of its
    // descendants.
    if (applyColorFill) {
      node.applyColorFill()
      setApplyColorFill(false)
    }

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
    applyColorFill,
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
   * Handles creating a new action.
   */
  const createAction = () => {
    // Create a new action object.
    let newAction: ClientMissionAction = new ClientMissionAction(node)
    // Update the action stored in the state.
    mission.select(newAction)
    // Add the action to the node.
    node.actions.set(newAction._id, newAction)
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
            onClick: () => mission.select(action),
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
    <div className='Entry NodeEntry SidePanel'>
      <div className='BorderBox'>
        {/* -- TOP OF BOX -- */}
        <div className='BoxTop'>
          <EntryNavigation object={node} />
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
          <DetailColorSelector
            fieldType='required'
            label='Border Color'
            colors={colorOptions}
            isExpanded={false}
            stateValue={color}
            setState={setColor}
            buttons={colorButtons}
            key={`${node._id}_color`}
          />
          <DetailLargeString
            fieldType='optional'
            handleOnBlur='none'
            label='Description'
            stateValue={description}
            setState={setDescription}
            elementBoundary='.SidePanelSection'
            placeholder='Enter description...'
            key={`${node._id}_description`}
          />
          <DetailLargeString
            fieldType='optional'
            handleOnBlur='none'
            label='Pre-Execution Text'
            stateValue={preExecutionText}
            setState={setPreExecutionText}
            elementBoundary='.SidePanelSection'
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
            headingText={'Actions'}
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
