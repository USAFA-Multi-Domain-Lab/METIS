import { DetailDropdown } from '@client/components/content/form/dropdown'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'
import { useMissionPageContext } from '@client/components/pages/missions/context'
import useActionItemButtonCallbacks from '@client/components/pages/missions/hooks/mission-components/actions'
import { ClientMissionAction } from '@client/missions/actions/ClientMissionAction'
import { compute } from '@client/toolbox'
import { useObjectFormSync, usePostInitEffect } from '@client/toolbox/hooks'
import type { TActionType } from '@shared/missions/actions/MissionAction'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { useState } from 'react'
import { DetailLargeString } from '../../../../content/form/DetailLargeString'
import { DetailNumber } from '../../../../content/form/DetailNumber'
import { DetailString } from '../../../../content/form/DetailString'
import { DetailToggle } from '../../../../content/form/DetailToggle'
import Divider from '../../../../content/form/Divider'
import { EffectTimeline } from '../../target-effects/timelines/'
import Entry from '../Entry'

/**
 * This will render the entry fields for an action.
 */
export default function ActionEntry({
  action,
  action: { node },
}: TActionEntry_P): TReactElement | null {
  /* -- STATE -- */

  const { onChange, viewMode } = useMissionPageContext()
  const {
    onDuplicateRequest: onDuplicateActionRequest,
    onDeleteRequest: onDeleteActionRequest,
  } = useActionItemButtonCallbacks(node)
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
        disabled={viewMode === 'preview'}
        key={`${action._id}_name`}
      />
      <DetailLargeString
        fieldType='optional'
        handleOnBlur='none'
        label='Description'
        value={description}
        setValue={setDescription}
        placeholder='Enter description...'
        disabled={viewMode === 'preview'}
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
        disabled={viewMode === 'preview'}
        key={`${action._id}_type`}
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
        disabled={viewMode === 'preview'}
        key={`${action._id}_successChance`}
      />
      <DetailToggle
        fieldType='required'
        label='Hide'
        tooltipDescription='If enabled, the success chance will be hidden from the executor.'
        value={successChanceHidden}
        setValue={hideSuccessChance}
        disabled={viewMode === 'preview'}
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
        integersOnly={true}
        unit='hour(s)'
        disabled={viewMode === 'preview'}
        key={`${action._id}_processTimeHours`}
      />
      <DetailNumber
        fieldType='required'
        label=''
        value={minutes}
        setValue={setMinutes}
        minimum={0}
        maximum={59}
        integersOnly={true}
        unit='minute(s)'
        disabled={viewMode === 'preview'}
        key={`${action._id}_processTimeMinutes`}
      />
      <DetailNumber
        fieldType='required'
        label=''
        value={seconds}
        setValue={setSeconds}
        minimum={0}
        maximum={59}
        integersOnly={true}
        unit='second(s)'
        disabled={viewMode === 'preview'}
        key={`${action._id}_processTimeSeconds`}
      />
      <DetailToggle
        fieldType='required'
        label='Hide'
        tooltipDescription='If enabled, the process time will be hidden from the executor.'
        value={processTimeHidden}
        setValue={hideProcessTime}
        disabled={viewMode === 'preview'}
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
        disabled={viewMode === 'preview'}
        key={`${action._id}_resourceCost`}
      />
      <DetailToggle
        fieldType='required'
        label='Hide'
        tooltipDescription='If enabled, the resource cost will be hidden from the executor.'
        value={resourceCostHidden}
        setValue={hideResourceCost}
        disabled={viewMode === 'preview'}
        key={`${action._id}_resourceCostHidden`}
      />
      <Divider />
      <DetailToggle
        fieldType='required'
        label='Opens Node'
        tooltipDescription='If enabled, this action will open the node if successfully executed.'
        value={opensNode}
        setValue={setOpensNode}
        disabled={viewMode === 'preview'}
        key={`${action._id}_opensNode`}
      />
      <DetailToggle
        fieldType='required'
        label='Hide'
        tooltipDescription='If enabled, the opens node option will be hidden from the executor.'
        value={opensNodeHidden}
        setValue={hideOpensNode}
        disabled={viewMode === 'preview'}
        key={`${action._id}_opensNodeHidden`}
      />
      <Divider />
      <EffectTimeline<'executionTriggeredEffect'> host={action} />
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
}
