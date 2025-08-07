import { useRef, useState } from 'react'
import List from 'src/components/content/data/lists/List'
import { DetailDropdown } from 'src/components/content/form/dropdown'
import { useButtonSvgEngine } from 'src/components/content/user-controls/buttons/panels/hooks'
import { useMissionPageContext } from 'src/components/pages/missions/MissionPage'
import { useGlobalContext } from 'src/context/global'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
import { compute } from 'src/toolbox'
import {
  useObjectFormSync,
  usePostInitEffect,
  useRequireLogin,
} from 'src/toolbox/hooks'
import { TActionType } from '../../../../../../../shared/missions/actions'
import MissionComponent from '../../../../../../../shared/missions/component'
import StringToolbox from '../../../../../../../shared/toolbox/strings'
import { DetailLargeString } from '../../../form/DetailLargeString'
import { DetailNumber } from '../../../form/DetailNumber'
import { DetailString } from '../../../form/DetailString'
import { DetailToggle } from '../../../form/DetailToggle'
import Divider from '../../../form/Divider'
import Entry from '../Entry'

/**
 * This will render the entry fields for an action.
 */
export default function ActionEntry({
  action,
  action: { node, mission },
  setIsNewEffect,
  onDuplicateActionRequest,
  onDeleteActionRequest,
  onDuplicateEffectRequest,
  onDeleteEffectRequest,
  onChange,
}: TActionEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { showButtonMenu } = useGlobalContext().actions
  const { state } = useMissionPageContext()

  /* -- REFS -- */
  const listRef = useRef<HTMLDivElement>(null)

  /* -- STATE -- */

  const actionState = useObjectFormSync(
    action,
    [
      'name',
      'description',
      'type',
      'successChanceHidden',
      'processTimeHidden',
      'resourceCost',
      'resourceCostHidden',
      'opensNode',
      'opensNodeHidden',
    ],
    { onChange: () => onChange(action) },
  )
  const [name, setName] = actionState.name
  const [description, setDescription] = actionState.description
  const [type, setType] = actionState.type
  const [successChance, setSuccessChance] = useState<number>(
    parseFloat(`${(action.successChance * 100.0).toFixed(2)}`),
  )
  const [successChanceHidden, hideSuccessChance] =
    actionState.successChanceHidden
  const [processTimeHidden, hideProcessTime] = actionState.processTimeHidden
  const [resourceCost, setResourceCost] = actionState.resourceCost
  const [resourceCostHidden, hideResourceCost] = actionState.resourceCostHidden
  const [opensNode, setOpensNode] = actionState.opensNode
  const [opensNodeHidden, hideOpensNode] = actionState.opensNodeHidden
  const [hours, setHours] = useState<number>(action.processTimeHours)
  const [minutes, setMinutes] = useState<number>(action.processTimeMinutes)
  const [seconds, setSeconds] = useState<number>(action.processTimeSeconds)
  const [localFiles] = state.localFiles
  const { isAuthorized } = useRequireLogin()
  const svgEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'copy',
        type: 'button',
        icon: 'copy',
        description: 'Duplicate action',
        permissions: ['missions_write'],
        onClick: async () => await onDuplicateActionRequest(action, true),
      },
      {
        key: 'remove',
        type: 'button',
        icon: 'remove',
        description: compute(() => {
          if (node.actions.size < 2) {
            return 'This action cannot be deleted because the node must have at least one action if it is executable.'
          } else {
            return 'Delete action'
          }
        }),
        disabled: node.actions.size < 2,
        permissions: ['missions_write'],
        onClick: async () => await onDeleteActionRequest(action, true),
      },
    ],
  })
  const createEffectEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'shell',
        type: 'button',
        icon: 'shell',
        label: 'Output Message',
        permissions: ['missions_write'],
        onClick: () => onCreateEffect(ClientTarget.METIS_TARGET_IDS.OUTPUT),
      },
      {
        key: 'ban',
        type: 'button',
        icon: 'ban',
        label: 'Block Status',
        permissions: ['missions_write'],
        onClick: () =>
          onCreateEffect(ClientTarget.METIS_TARGET_IDS.BLOCK_STATUS),
      },
      {
        key: 'file',
        type: 'button',
        icon: 'file',
        label: 'File Access',
        permissions: ['missions_write'],
        disabled: localFiles.length === 0,
        onClick: () =>
          onCreateEffect(ClientTarget.METIS_TARGET_IDS.FILE_ACCESS),
      },
      {
        key: 'open',
        type: 'button',
        icon: 'door',
        label: 'Open Status',
        permissions: ['missions_write'],
        onClick: () => onCreateEffect(ClientTarget.METIS_TARGET_IDS.OPEN_NODE),
      },
      {
        key: 'add',
        type: 'button',
        icon: 'add',
        label: 'Custom Effect',
        permissions: ['missions_write'],
        onClick: () => setIsNewEffect(true),
      },
    ],
    options: {
      revealLabels: true,
      flow: 'column',
    },
    dependencies: [localFiles.length],
  })

  /* -- EFFECTS -- */

  // Sync the component state with the action.
  usePostInitEffect(() => {
    // Update the success chance.
    action.successChance = successChance / 100

    // Convert and update the process time.
    const processTime = ClientMissionAction.convertProcessTime(
      hours,
      minutes,
      seconds,
    )
    action.processTime = processTime

    // Allow the user to save the changes.
    onChange(action)
  }, [successChance, hours, minutes, seconds])

  /* -- FUNCTIONS -- */

  /**
   * Gets the tooltip description for the effect list item.
   * @param effect The effect to get the tooltip description for.
   * @returns The tooltip description for the effect list item.
   */
  const getEffectDescription = (effect: ClientEffect) => {
    if (!effect.environment || !effect.target) {
      return 'This effect cannot be edited because either the target environment or the target associated with this effect is not available.'
    } else if (isAuthorized('missions_write')) {
      return 'Edit effect.'
    } else if (isAuthorized('missions_read')) {
      return 'View effect.'
    } else {
      return ''
    }
  }

  /**
   * Handles creating a new effect.
   */
  const onCreateEffect = (targetId: string) => {
    const target = ClientTargetEnvironment.REGISTRY.inferTarget(targetId)
    if (!target) {
      console.warn('ActionEntry: No target found for output effect.')
      return
    }

    // Create a new effect.
    const effect = ClientEffect.createBlankEffect(target, action)
    // Set the effect's target and environment.
    // Push the new effect to the action.
    action.effects.push(effect)
    // Select the new effect.
    mission.select(effect)
    // Allow the user to save the changes.
    onChange(effect)
  }

  /**
   * Shows the effect preset menu.
   */
  const showEffectPresetMenu = () => {
    const listElm = listRef.current

    if (!listElm) {
      console.warn('ActionEntry: listRef is null')
      return
    }

    const createEffectButton = listElm.querySelector<HTMLDivElement>(
      '.ListNav .ButtonSvgPanel .ButtonSvg_add',
    )

    if (!createEffectButton) {
      console.warn('ActionEntry: createEffectButton is null')
      return
    }

    showButtonMenu(createEffectEngine, {
      positioningTarget: createEffectButton,
    })
  }

  /* -- RENDER -- */

  // Render nothing if the action is not executable.
  if (!node.executable) return null

  return (
    <Entry missionComponent={action} svgEngines={[svgEngine]}>
      <DetailString
        fieldType='required'
        handleOnBlur='repopulateValue'
        label='Name'
        value={name}
        setValue={setName}
        defaultValue={ClientMissionAction.DEFAULT_PROPERTIES.name}
        maxLength={ClientMissionAction.MAX_NAME_LENGTH}
        placeholder='Enter name...'
        key={`${action._id}_name`}
      />
      <DetailLargeString
        fieldType='optional'
        handleOnBlur='none'
        label='Description'
        value={description}
        setValue={setDescription}
        placeholder='Enter description...'
        key={`${action._id}_description`}
      />
      <DetailDropdown<TActionType>
        fieldType='required'
        label='Type'
        options={ClientMissionAction.TYPES}
        value={type}
        setValue={setType}
        isExpanded={false}
        getKey={(type) => type}
        render={(type) => StringToolbox.capitalize(type)}
        handleInvalidOption={{
          method: 'setToDefault',
          defaultValue: ClientMissionAction.DEFAULT_PROPERTIES.type,
        }}
      />
      <Divider />
      <DetailNumber
        fieldType='required'
        label='Success Chance'
        value={successChance}
        setValue={setSuccessChance}
        // Convert to percentage.
        minimum={ClientMissionAction.SUCCESS_CHANCE_MIN * 100}
        // Convert to percentage.
        maximum={ClientMissionAction.SUCCESS_CHANCE_MAX * 100}
        integersOnly={true}
        unit='%'
        key={`${action._id}_successChance`}
      />
      <DetailToggle
        fieldType='required'
        label='Hide'
        tooltipDescription='If enabled, the success chance will be hidden from the executor.'
        value={successChanceHidden}
        setValue={hideSuccessChance}
        key={`${action._id}_successChanceHidden`}
      />
      <Divider />
      {/* -- PROCESS TIME -- */}
      <DetailNumber
        fieldType='required'
        label='Process Time'
        value={hours}
        setValue={setHours}
        minimum={0}
        maximum={1}
        unit='hours'
        key={`${action._id}_processTimeHours`}
      />
      <DetailNumber
        fieldType='required'
        label=''
        value={minutes}
        setValue={setMinutes}
        minimum={0}
        maximum={59}
        unit='minutes'
        key={`${action._id}_processTimeMinutes`}
      />
      <DetailNumber
        fieldType='required'
        label=''
        value={seconds}
        setValue={setSeconds}
        minimum={0}
        maximum={59}
        unit='seconds'
        key={`${action._id}_processTimeSeconds`}
      />
      <DetailToggle
        fieldType='required'
        label='Hide'
        tooltipDescription='If enabled, the process time will be hidden from the executor.'
        value={processTimeHidden}
        setValue={hideProcessTime}
        key={`${action._id}_processTimeHidden`}
      />
      <Divider />
      <DetailNumber
        fieldType='required'
        label='Resource Cost'
        value={resourceCost}
        setValue={setResourceCost}
        minimum={ClientMissionAction.RESOURCE_COST_MIN}
        integersOnly={true}
        key={`${action._id}_resourceCost`}
      />
      <DetailToggle
        fieldType='required'
        label='Hide'
        tooltipDescription='If enabled, the resource cost will be hidden from the executor.'
        value={resourceCostHidden}
        setValue={hideResourceCost}
        key={`${action._id}_resourceCostHidden`}
      />
      <Divider />
      <DetailToggle
        fieldType='required'
        label='Opens Node'
        tooltipDescription='If enabled, this action will open the node if successfully executed.'
        value={opensNode}
        setValue={setOpensNode}
        key={`${action._id}_opensNode`}
      />
      <DetailToggle
        fieldType='required'
        label='Hide'
        tooltipDescription='If enabled, the opens node option will be hidden from the executor.'
        value={opensNodeHidden}
        setValue={hideOpensNode}
        key={`${action._id}_opensNodeHidden`}
      />

      {/* -- EFFECTS -- */}
      <div ref={listRef}>
        <List<ClientEffect>
          name={'Effects'}
          items={action.effects}
          itemsPerPageMin={5}
          listButtonIcons={['add']}
          itemButtonIcons={['open', 'copy', 'remove']}
          getItemTooltip={getEffectDescription}
          getCellText={(effect) => effect.name}
          getListButtonLabel={() => 'Create a new effect'}
          getListButtonPermissions={(button) => {
            switch (button) {
              default:
                return ['missions_write']
            }
          }}
          getItemButtonLabel={(button) => {
            switch (button) {
              case 'open':
                return 'View effect'
              case 'copy':
                return 'Duplicate effect'
              case 'remove':
                return 'Delete effect'
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
          onItemDblClick={(effect) => mission.select(effect)}
          onListButtonClick={(button) => {
            switch (button) {
              case 'add':
                showEffectPresetMenu()
                break
            }
          }}
          onItemButtonClick={async (button, effect) => {
            switch (button) {
              case 'open':
                mission.select(effect)
                break
              case 'copy':
                await onDuplicateEffectRequest(effect)
                break
              case 'remove':
                await onDeleteEffectRequest(effect)
                break
            }
          }}
        />
      </div>
    </Entry>
  )
}

/* ---------------------------- TYPES FOR ACTION ENTRY ---------------------------- */

/**
 * Props for ActionEntry component
 */
export type TActionEntry_P = {
  /**
   * The action to be edited.
   */
  action: ClientMissionAction
  /**
   * Function that updates the isNewEffect state.
   */
  setIsNewEffect: TReactSetter<boolean>
  /**
   * Handles the request to duplicate an action.
   */
  onDuplicateActionRequest: (
    action: ClientMissionAction,
    selectNewAction?: boolean,
  ) => Promise<void>
  /**
   * Handles the request to delete an action.
   */
  onDeleteActionRequest: (
    action: ClientMissionAction,
    navigateBack?: boolean,
  ) => Promise<void>
  /**
   * Handles the request to duplicate an effect.
   */
  onDuplicateEffectRequest: (
    effect: ClientEffect,
    selectNewEffect?: boolean,
  ) => Promise<void>
  /**
   * Handles the request to delete an effect.
   */
  onDeleteEffectRequest: (
    effect: ClientEffect,
    navigateBack?: boolean,
  ) => Promise<void>
  /**
   * Callback for when a change is made that would
   * require saving.
   * @param component The mission component that was changed.
   */
  onChange: (component: MissionComponent<any, any>) => void
}
