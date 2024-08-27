import { useEffect, useState } from 'react'
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
  node: { mission },
  handleDeleteActionRequest,
  handleChange,
}: TNodeEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const globalContext = useGlobalContext()
  const [colorOptions] = globalContext.missionNodeColors
  const { notify, forceUpdate } = globalContext.actions

  /* -- STATE -- */
  const [name, setName] = useState<string>(node.name)
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
    node.name = name
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
    name,
    color,
    description,
    preExecutionText,
    depthPadding,
    executable,
    device,
    applyColorFill,
  ])

  // This displays the change in the mission path found at
  // the top of the side panel.
  useEffect(() => forceUpdate(), [name])

  // Auto-generate an action if the node becomes executable.
  usePostInitEffect(() => {
    if (executable) {
      autoGenerateAction()
    }
  }, [executable])

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
       * The tooltip description for the (action) delete button.
       */
      const deleteTooltipDescription: string = compute(() => {
        if (node.actions.size < 2) {
          return 'This action cannot be deleted because the node must have at least one action if it is executable.'
        } else {
          return 'Delete action.'
        }
      })

      /**
       * The buttons for the action list.
       */
      const actionButtons = compute(() => {
        // Create a default list of buttons.
        let buttons: TValidPanelButton[] = []

        // If the action is available then add the edit and remove buttons.
        let availableMiniActions: SingleTypeObject<TValidPanelButton> = {
          remove: {
            icon: 'remove',
            key: 'remove',
            onClick: async () => await handleDeleteActionRequest(action),
            tooltipDescription: deleteTooltipDescription,
            disabled: node.actions.size < 2 ? 'partial' : 'none',
          },
        }

        // Add the buttons to the list.
        buttons = Object.values(availableMiniActions)

        // Return the buttons.
        return buttons
      })

      return (
        <div className='Row Select' key={`action-row-${action._id}`}>
          <div
            className='RowContent Select'
            onClick={() => mission.select(action)}
          >
            {action.name}
            <Tooltip description='Edit action.' />
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
            stateValue={name}
            setState={setName}
            defaultValue={ClientMissionNode.DEFAULT_PROPERTIES.name}
            maxLength={ClientMissionNode.MAX_NAME_LENGTH}
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
            listStyling={{ borderBottom: 'unset' }}
            listSpecificItemClassName={actionClassName}
          />
          <div className={newActionClassName}>
            <ButtonText
              text='New Action'
              onClick={createAction}
              tooltipDescription='Create a new action.'
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
   * Handles the request to delete an action.
   */
  handleDeleteActionRequest: (
    action: ClientMissionAction,
    navigateBack?: boolean,
  ) => Promise<void>
  /**
   * A function that will be called when a change has been made.
   */
  handleChange: () => void
}
