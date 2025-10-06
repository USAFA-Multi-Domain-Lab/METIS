import { useRef, useState } from 'react'
import EffectList, {
  TEffectList_P,
} from 'src/components/content/data/lists/implementations/EffectList'
import { TList_E } from 'src/components/content/data/lists/List'
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
import { TEffectTrigger } from '../../../../../../../shared/missions/effects'
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
  onDuplicateActionRequest,
  onDeleteActionRequest,
  onDuplicateEffectRequest,
  onDeleteEffectRequest,
  onChange,
}: TActionEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { showButtonMenu } = useGlobalContext().actions
  const { state, activateEffectModal } = useMissionPageContext()

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
        onClick: () => activateEffectModal(newEffectTrigger),
      },
    ],
    options: {
      revealLabels: true,
      flow: 'column',
    },
    dependencies: [localFiles.length],
  })
  const [newEffectTrigger, setNewEffectTrigger] = useState<TEffectTrigger>(
    'execution-initiation',
  )
  const immediateListRef = useRef<TList_E | null>(null)
  const successListRef = useRef<TList_E | null>(null)
  const failureListRef = useRef<TList_E | null>(null)

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
    // Update the trigger.
    effect.trigger = newEffectTrigger
    // Set the effect's target and environment.
    // Push the new effect to the action.
    action.effects.push(effect)
    // Select the new effect.
    mission.select(effect)
    // Allow the user to save the changes.
    onChange(effect)
  }

  /**
   * Shows the effect preset menu, presenting various options
   * for creating a new effect.
   * @param newEffectTrigger The trigger for the new effect.
   */
  const showEffectPresetMenu = (newEffectTrigger: TEffectTrigger) => {
    let listElm: HTMLDivElement | null | undefined = null

    // Determine which list to use based on the effect trigger.
    switch (newEffectTrigger) {
      case 'execution-initiation':
        listElm = immediateListRef.current?.root.current
        break
      case 'execution-success':
        listElm = successListRef.current?.root.current
        break
      case 'execution-failure':
        listElm = failureListRef.current?.root.current
        break
      default:
        console.warn(
          `ActionEntry: Unknown effect trigger "${newEffectTrigger}"`,
        )
        return
    }

    if (!listElm) {
      throw new Error('List ref is null')
    }

    // Get the create effect button then confirm
    // it is present.
    const createEffectButton = listElm.querySelector<HTMLDivElement>(
      '.ListNav .ButtonSvgPanel .ButtonSvg_add',
    )

    if (!createEffectButton) {
      console.warn('ActionEntry: createEffectButton is null')
      return
    }

    // Activate the effect preset menu.
    showButtonMenu(createEffectEngine, {
      positioningTarget: createEffectButton,
    })
    setNewEffectTrigger(newEffectTrigger)
  }

  /* -- COMPUTED -- */

  /**
   * Props common to all effect lists in
   * the entry.
   */
  const commonEffectProps: Omit<
    TEffectList_P,
    'name' | 'items' | 'onCreateRequest'
  > = {
    initialSorting: { method: 'unsorted', fixedConfig: true },
    ordering: { mode: 'maleable' },
    itemsPerPageMin: 5,
    getItemTooltip: (effect) => {
      if (!effect.environment || !effect.target) {
        return 'This effect cannot be edited because either the target environment or the target associated with this effect is not available.'
      } else if (isAuthorized('missions_write')) {
        return 'Edit effect.'
      } else if (isAuthorized('missions_read')) {
        return 'View effect.'
      } else {
        return ''
      }
    },
    onOpenRequest: (effect) => {
      mission.select(effect)
    },
    onDuplicateRequest: (effect) => {
      onDuplicateEffectRequest(effect, false)
    },
    onDeleteRequest: (effect) => {
      onDeleteEffectRequest(effect)
    },
  }

  /**
   * Effects that trigger immediately upon action execution.
   */
  const [immediateEffects] = useState(() => {
    return action.effects.filter(
      (effect) => effect.trigger === 'execution-initiation',
    )
  })

  /**
   * Effects that trigger upon successful action execution.
   */
  const [successEffects] = useState(() => {
    return action.effects.filter(
      (effect) => effect.trigger === 'execution-success',
    )
  })

  /**
   * Effects that trigger upon failed action execution.
   */
  const [failureEffects] = useState(() => {
    return action.effects.filter(
      (effect) => effect.trigger === 'execution-failure',
    )
  })

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
      <Divider />

      {/* -- EFFECTS -- */}

      <h3>Effects</h3>

      <div>
        <EffectList
          name='Immediate'
          items={immediateEffects}
          elementAccess={immediateListRef}
          onCreateRequest={() => {
            showEffectPresetMenu('execution-initiation')
          }}
          {...commonEffectProps}
        />
        <EffectList
          name='Success'
          items={successEffects}
          elementAccess={successListRef}
          onCreateRequest={() => {
            showEffectPresetMenu('execution-success')
          }}
          {...commonEffectProps}
        />
        <EffectList
          name='Failure'
          items={failureEffects}
          elementAccess={failureListRef}
          onCreateRequest={() => {
            showEffectPresetMenu('execution-failure')
          }}
          {...commonEffectProps}
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
