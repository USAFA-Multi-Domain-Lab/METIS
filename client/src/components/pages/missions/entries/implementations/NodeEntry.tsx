import { useState } from 'react'
import List from 'src/components/content/data/lists/List'
import { useButtonSvgEngine } from 'src/components/content/user-controls/buttons/panels/hooks'
import If from 'src/components/content/util/If'
import { useMissionPageContext } from 'src/components/pages/missions/context'
import useActionItemButtonCallbacks from 'src/components/pages/missions/hooks/mission-components/actions'
import { useGlobalContext } from 'src/context/global'
import ClientMission from 'src/missions'
import ClientMissionAction from 'src/missions/actions'
import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import { useObjectFormSync, usePostInitEffect } from 'src/toolbox/hooks'
import { TNonEmptyArray } from '../../../../../../../shared/toolbox/arrays'
import Prompt from '../../../../content/communication/Prompt'
import { DetailColorSelector } from '../../../../content/form/DetailColorSelector'
import { DetailLargeString } from '../../../../content/form/DetailLargeString'
import { DetailString } from '../../../../content/form/DetailString'
import { DetailToggle } from '../../../../content/form/DetailToggle'
import { TButtonText_P } from '../../../../content/user-controls/buttons/ButtonText'
import { TToggleLockState } from '../../../../content/user-controls/Toggle'
import Entry from '../Entry'

/**
 * This will render the entry fields for a mission-node
 * within the MissionPage component.
 */
export default function NodeEntry({
  node,
  node: { mission },
}: TNodeEntry_P): TReactElement | null {
  /* -- GLOBAL CONTEXT -- */
  const globalContext = useGlobalContext()
  const { notify, prompt } = globalContext.actions

  /* -- STATE -- */

  const { onChange } = useMissionPageContext()
  const {
    onDuplicateRequest: onDuplicateActionRequest,
    onDeleteRequest: onDeleteActionRequest,
  } = useActionItemButtonCallbacks(node)

  const nodeState = useObjectFormSync(
    node,
    [
      'name',
      'description',
      'color',
      'preExecutionText',
      'executable',
      'device',
      'exclude',
      'initiallyBlocked',
    ],
    {
      onChange: () => {
        // On the mission page, the initial block
        // state should be reflected actively on
        // the mission map to aid the designer
        // in visualizing the mission.
        node.blocked = node.initiallyBlocked
        onChange(node)
      },
    },
  )
  const [name, setName] = nodeState.name
  const [description, setDescription] = nodeState.description
  const [color, setColor] = nodeState.color
  const [preExecutionText, setPreExecutionText] = nodeState.preExecutionText
  const [executable, setExecutable] = nodeState.executable
  const [device, setDevice] = nodeState.device
  const [exclude, setExclude] = nodeState.exclude
  const [initiallyBlocked, setInitiallyBlocked] = nodeState.initiallyBlocked
  const [applyColorFill, setApplyColorFill] = useState<boolean>(false)
  const svgEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'divider',
        type: 'button',
        icon: 'divider',
        description: compute(() => {
          let excludeButton = node.buttons.find(
            ({ icon }) => icon === 'divider',
          )
          return (
            excludeButton?.description ??
            'Exclude this node from the force (Closes panel view also).'
          )
        }),
        permissions: ['missions_write'],
        onClick: () => setExclude(true),
      },
    ],
  })

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
  const actionListItemButtons: TMetisIcon[] = compute(() => {
    let buttons: TMetisIcon[] = ['open', 'copy']

    if (node.executable && node.actions.size > 1) {
      buttons.push('remove')
    }

    return buttons
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
    let newAction = ClientMissionAction.create(node)
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
      let newAction = ClientMissionAction.create(node)
      node.actions.set(newAction._id, newAction)
      notify(
        `Auto-generated an action for ${node.name} because it is an executable node with no actions to execute.`,
      )
    }
  }

  /* -- RENDER -- */

  return (
    <Entry missionComponent={node} svgEngines={[svgEngine]}>
      <DetailString
        fieldType='required'
        handleOnBlur='repopulateValue'
        label='Name'
        value={name}
        setValue={setName}
        defaultValue={ClientMissionNode.DEFAULT_PROPERTIES.name}
        maxLength={ClientMissionNode.MAX_NAME_LENGTH}
        tooltipDescription='General title for the node, which will be displayed on the node itself in the mission map.'
        key={`${node._id}_name`}
      />
      <DetailColorSelector
        fieldType='required'
        label='Color'
        colors={ClientMission.COLOR_OPTIONS}
        isExpanded={false}
        value={color}
        setValue={setColor}
        buttons={colorButtons}
        tooltipDescription='This applies a border color to the node, which can be used to visually distinguish it from other nodes.'
        key={`${node._id}_color`}
      />
      <DetailLargeString
        fieldType='optional'
        handleOnBlur='none'
        label='Description'
        value={description}
        setValue={setDescription}
        placeholder='Enter description...'
        tooltipDescription='This is general text used to describe this node and provide additional context to the user.'
        key={`${node._id}_description`}
      />
      <DetailLargeString
        fieldType='optional'
        handleOnBlur='none'
        label='Pre-Execution Text'
        value={preExecutionText}
        setValue={setPreExecutionText}
        placeholder='Enter text...'
        tooltipDescription='This text that will be outputted to the force whenever the node is clicked.'
        key={`${node._id}_preExecutionText`}
      />
      <DetailToggle
        fieldType='required'
        label='Executable'
        value={executable}
        setValue={setExecutable}
        tooltipDescription='If enabled, this node can host actions which can be executed on the node. This will disable the default click to open behavior of the node.'
        key={`${node._id}_executable`}
      />
      <DetailToggle
        fieldType='required'
        label='Device'
        value={device}
        setValue={setDevice}
        lockState={deviceLockState}
        tooltipDescription={
          'Purely visual. If enabled, a device icon will be shown on the node instead of a lightning bolt.'
        }
        key={`${node._id}_device`}
      />
      <DetailToggle
        fieldType='required'
        label='Initially Blocked'
        value={initiallyBlocked}
        setValue={setInitiallyBlocked}
        tooltipDescription='If enabled, this node will be blocked by default when the mission starts. It can only then be unblocked by an effect targeting this node.'
        key={`${node._id}_initiallyBlocked`}
      />
      {/* -- ACTIONS -- */}
      <If condition={node.executable}>
        <List<ClientMissionAction>
          name={'Actions'}
          items={Array.from(node.actions.values())}
          itemsPerPageMin={5}
          listButtonIcons={['add']}
          itemButtonIcons={actionListItemButtons}
          getCellText={(action) => action.name}
          getListButtonLabel={(button) => {
            switch (button) {
              case 'add':
                return 'Create a new action'
              default:
                return ''
            }
          }}
          getListButtonPermissions={(button) => {
            switch (button) {
              default:
                return ['missions_write']
            }
          }}
          getItemButtonLabel={(button) => {
            switch (button) {
              case 'open':
                return 'View action'
              case 'copy':
                return 'Duplicate action'
              case 'remove':
                return 'Delete action'
              default:
                return ''
            }
          }}
          getItemButtonPermissions={(button) => {
            switch (button) {
              case 'open':
                return ['missions_read']
              default:
                return ['missions_write']
            }
          }}
          onItemDblClick={(action) => mission.select(action)}
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
              case 'copy':
                await onDuplicateActionRequest(action)
                break
              case 'remove':
                await onDeleteActionRequest(action)
                break
            }
          }}
          key={node.actions.size}
        />
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
}
