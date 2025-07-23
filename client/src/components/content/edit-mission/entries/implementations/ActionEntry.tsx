import { useState } from 'react'
import List from 'src/components/content/data/lists/List'
import { DetailDropdown } from 'src/components/content/form/dropdown'
import { useButtonSvgEngine } from 'src/components/content/user-controls/buttons/panels/hooks'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import { compute } from 'src/toolbox'
import {
  useObjectFormSync,
  usePostInitEffect,
  useRequireLogin,
} from 'src/toolbox/hooks'
import { TActionType } from '../../../../../../../shared/missions/actions'
import StringToolbox from '../../../../../../../shared/toolbox/strings'
import { DetailLargeString } from '../../../form/DetailLargeString'
import { DetailNumber } from '../../../form/DetailNumber'
import { DetailString } from '../../../form/DetailString'
import { DetailToggle } from '../../../form/DetailToggle'
import Divider from '../../../form/Divider'
import Entry from '../Entry'

/**
 * This will render the entry fields for an action
 * as a part of the NodeActionDetails component.
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
      'postExecutionSuccessText',
      'postExecutionFailureText',
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
  const [postExecutionSuccessText, setPostExecutionSuccessText] =
    actionState.postExecutionSuccessText
  const [postExecutionFailureText, setPostExecutionFailureText] =
    actionState.postExecutionFailureText
  const [hours, setHours] = useState<number>(action.processTimeHours)
  const [minutes, setMinutes] = useState<number>(action.processTimeMinutes)
  const [seconds, setSeconds] = useState<number>(action.processTimeSeconds)
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
      <DetailLargeString
        fieldType='required'
        handleOnBlur='repopulateValue'
        label='Post-Execution Success Text'
        value={postExecutionSuccessText}
        setValue={setPostExecutionSuccessText}
        defaultValue={
          ClientMissionAction.DEFAULT_PROPERTIES.postExecutionSuccessText
        }
        key={`${action._id}_postExecutionSuccessText`}
      />
      <DetailLargeString
        fieldType='required'
        handleOnBlur='repopulateValue'
        label='Post-Execution Failure Text'
        value={postExecutionFailureText}
        setValue={setPostExecutionFailureText}
        defaultValue={
          ClientMissionAction.DEFAULT_PROPERTIES.postExecutionFailureText
        }
        key={`${action._id}_postExecutionFailureText`}
      />

      {/* -- EFFECTS -- */}
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
              setIsNewEffect(true)
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
    </Entry>
  )
}

/* ---------------------------- TYPES FOR NODE ACTION ENTRY ---------------------------- */

/**
 * Props for NodeActionEntry component
 */
export type TActionEntry_P = {
  /**
   * The mission-node-action to be edited.
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
   * @param action The same action passed.
   */
  onChange: (action: ClientMissionAction) => void
}
