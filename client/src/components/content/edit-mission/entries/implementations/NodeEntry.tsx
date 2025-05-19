import { useState } from 'react'
import { TMetisClientComponents } from 'src'
import List from 'src/components/content/data/lists/List'
import If from 'src/components/content/util/If'
import { useGlobalContext } from 'src/context'
import ClientMission from 'src/missions'
import ClientMissionAction from 'src/missions/actions'
import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import { usePostInitEffect, useRequireLogin } from 'src/toolbox/hooks'
import { TMissionComponent } from '../../../../../../../shared/missions'
import { TNonEmptyArray } from '../../../../../../../shared/toolbox/arrays'
import Prompt from '../../../communication/Prompt'
import { DetailColorSelector } from '../../../form/DetailColorSelector'
import { DetailLargeString } from '../../../form/DetailLargeString'
import { DetailString } from '../../../form/DetailString'
import { DetailToggle } from '../../../form/DetailToggle'
import Divider from '../../../form/Divider'
import { TButtonSvgType } from '../../../user-controls/buttons/ButtonSvg'
import {
  ButtonText,
  TButtonText_P,
} from '../../../user-controls/buttons/ButtonText'
import { TToggleLockState } from '../../../user-controls/Toggle'
import Entry from '../Entry'

/**
 * This will render the entry fields for a mission-node
 * within the MissionPage component.
 */
export default function NodeEntry({
  node,
  node: { mission },
  handleDeleteActionRequest,
  onChange,
}: TNodeEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const globalContext = useGlobalContext()
  const { notify, prompt } = globalContext.actions

  /* -- STATE -- */
  const [name, setName] = useState<string>(node.name)
  const [color, setColor] = useState<string>(node.color)
  const [description, setDescription] = useState<string>(node.description)
  const [preExecutionText, setPreExecutionText] = useState<string>(
    node.preExecutionText,
  )
  const [executable, setExecutable] = useState<boolean>(node.executable)
  const [device, setDevice] = useState<boolean>(node.device)
  const [exclude, setExclude] = useState<boolean>(node.exclude)
  const [applyColorFill, setApplyColorFill] = useState<boolean>(false)
  const { login } = useRequireLogin()

  /* -- COMPUTED -- */
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
  const colorButtons: TButtonText_P[] = compute(() => {
    // Create a default list of buttons.
    let buttons: TButtonText_P[] = []

    // Create a button that will fill all of the descendants
    // of the current node with the selected color.
    let fillButton: TButtonText_P = {
      text: 'Fill',
      onClick: () => setApplyColorFill(true),
      tooltipDescription: `Applies the selected color to all of the node's descendants.`,
    }

    // Add the fill button to the list of buttons.
    buttons.push(fillButton)

    // Return the buttons.
    return buttons
  })

  /**
   * The buttons for the node action list.
   */
  const itemButtons: TButtonSvgType[] = compute(() => {
    let buttons: TButtonSvgType[] = ['open']

    if (node.executable && node.actions.size > 1) {
      buttons.push('remove')
    }

    // Return the buttons.
    return buttons
  })
  /**
   * The tooltip description for the node exclude button.
   */
  const excludeButtonDescription: string = compute(() => {
    let excludeButton = node.buttons.find(({ type }) => type === 'divider')
    return (
      excludeButton?.description ??
      'Exclude this node from the force (Closes panel view also).'
    )
  })

  /* -- EFFECTS -- */

  // Sync the component state with the node.
  usePostInitEffect(() => {
    node.name = name
    node.color = color
    node.description = description
    node.preExecutionText = preExecutionText
    node.executable = executable
    node.device = device
    node.exclude = exclude

    // If the node is not executable, then the device
    // status should be false.
    if (!executable && device) setDevice(false)

    // If the fill color button has been clicked, then
    // apply the color fill to the node and all of its
    // descendants.
    if (applyColorFill) {
      // Prompt the user to confirm the action.
      prompt(
        `Are you sure you want to apply the color to all of the descending nodes?`,
        Prompt.ConfirmationChoices,
      ).then(({ choice }) => {
        // If the user cancels, abort.
        if (choice === 'Cancel') {
          setApplyColorFill(false)
          return
        }

        // Apply the color fill to the node and its descendants.
        node.applyColorFill()
        setApplyColorFill(false)
      })

      // Allow the user to save the changes.
      if (node.hasChildren) {
        onChange(...(node.descendants as TNonEmptyArray<ClientMissionNode>))
      }
    }

    if (exclude) mission.select(node.force)

    // Allow the user to save the changes.
    onChange(node)
  }, [
    name,
    color,
    description,
    preExecutionText,
    executable,
    device,
    exclude,
    applyColorFill,
  ])

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
    onChange(newAction)
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

  /* -- RENDER -- */

  return (
    <Entry missionComponent={node}>
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
        label='Color'
        colors={ClientMission.COLOR_OPTIONS}
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
        placeholder='Enter description...'
        key={`${node._id}_description`}
      />
      <DetailLargeString
        fieldType='optional'
        handleOnBlur='none'
        label='Pre-Execution Text'
        stateValue={preExecutionText}
        setState={setPreExecutionText}
        placeholder='Enter pre-execution text...'
        key={`${node._id}_preExecutionText`}
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
      <If condition={node.executable}>
        <List<ClientMissionAction>
          name={'Actions'}
          items={Array.from(node.actions.values())}
          itemsPerPageMin={5}
          listButtonIcons={['add']}
          itemButtonIcons={itemButtons}
          getCellText={(action) => action.name}
          getListButtonLabel={(button) => {
            switch (button) {
              case 'add':
                return 'Create a new action'
              default:
                return ''
            }
          }}
          getItemButtonLabel={(button) => {
            switch (button) {
              case 'open':
                return 'View action'
              case 'remove':
                return 'Delete action'
              default:
                return ''
            }
          }}
          onListButtonClick={(button) => {
            switch (button) {
              case 'add':
                createAction()
            }
          }}
          onItemButtonClick={async (button, action) => {
            switch (button) {
              case 'open':
                mission.select(action)
                break
              case 'remove':
                await handleDeleteActionRequest(action)
                break
            }
          }}
        />
      </If>

      {/* -- BUTTON(S) -- */}
      <div className='ButtonContainer'>
        <ButtonText
          text='Exclude Node'
          onClick={() => setExclude(true)}
          tooltipDescription={excludeButtonDescription}
        />
      </div>
      <If condition={node.executable}>
        <Divider />
      </If>
    </Entry>
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
   * A callback that will be called when a change
   * has been made.
   * @param node The same node passed.
   */
  onChange: (
    ...components: TNonEmptyArray<
      TMissionComponent<TMetisClientComponents, any>
    >
  ) => void
}
