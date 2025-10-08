import { useButtonSvgEngine } from 'src/components/content/user-controls/buttons/panels/hooks'
import ClientActionExecution from 'src/missions/actions/executions'
import { ClientEffect, TClientTriggerDataExec } from 'src/missions/effects'
import { useObjectFormSync } from 'src/toolbox/hooks'
import {
  TEffectExecutionTriggered,
  TEffectTrigger,
} from '../../../../../../../shared/missions/effects'
import StringToolbox from '../../../../../../../shared/toolbox/strings'
import { DetailLargeString } from '../../../form/DetailLargeString'
import { DetailLocked } from '../../../form/DetailLocked'
import { DetailString } from '../../../form/DetailString'
import DetailDropdown from '../../../form/dropdown/DetailDropdown'
import ArgEntry from '../../target-effects/ArgEntry'
import Entry from '../Entry'

/**
 * Entry fields for an effect.
 */
export default function EffectEntry({
  effect,
  effect: { target, environment },
  onDuplicateEffectRequest,
  onDeleteEffectRequest,
  onChange,
}: TEffectEntry_P): JSX.Element | null {
  /* -- STATE -- */

  const effectState = useObjectFormSync(
    effect,
    ['name', 'trigger', 'description', 'args'],
    { onChange: () => onChange(effect) },
  )
  const [name, setName] = effectState.name
  const [trigger, setTrigger] = effectState.trigger
  const [description, setDescription] = effectState.description
  const [effectArgs, setEffectArgs] = effectState.args
  const svgEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'copy',
        type: 'button',
        icon: 'copy',
        description: 'Duplicate effect',
        permissions: ['missions_write'],
        onClick: async () => await onDuplicateEffectRequest(effect, true),
      },
      {
        key: 'remove',
        type: 'button',
        icon: 'remove',
        description: 'Delete effect',
        permissions: ['missions_write'],
        onClick: async () => await onDeleteEffectRequest(effect, true),
      },
    ],
  })

  /* -- RENDER -- */

  return (
    <Entry missionComponent={effect} svgEngines={[svgEngine]}>
      <DetailString
        fieldType='required'
        handleOnBlur='repopulateValue'
        label='Name'
        value={name}
        setValue={setName}
        defaultValue={ClientEffect.DEFAULT_EXEC_PROPERTIES.name}
        maxLength={ClientEffect.MAX_NAME_LENGTH}
        placeholder='Enter name...'
      />
      <DetailDropdown<TEffectExecutionTriggered>
        fieldType='required'
        label='Trigger'
        options={ClientActionExecution.EFFECT_TRIGGERS}
        value={trigger}
        setValue={setTrigger}
        isExpanded={false}
        render={(value: TEffectTrigger) => StringToolbox.toTitleCase(value)}
        getKey={(value) => value}
        handleInvalidOption={{
          method: 'setToDefault',
          defaultValue: 'execution-success',
        }}
      />
      <DetailLargeString
        fieldType='optional'
        handleOnBlur='none'
        label='Description'
        value={description}
        setValue={setDescription}
        placeholder='Enter description...'
      />
      <DetailLocked
        label='Target Environment'
        stateValue={environment?.name ?? 'No target environment selected.'}
      />
      <DetailLocked
        label='Target'
        stateValue={target?.name ?? 'No target selected.'}
      />
      <ArgEntry
        effect={effect}
        effectArgs={effectArgs}
        setEffectArgs={setEffectArgs}
      />
    </Entry>
  )
}

/* ---------------------------- TYPES FOR EFFECT ENTRY ---------------------------- */

/**
 * Props for EffectEntry component.
 */
export type TEffectEntry_P = {
  /**
   * The effect to apply to the target.
   */
  effect: ClientEffect<TClientTriggerDataExec>
  /**
   * Handles the request to duplicate an effect.
   */
  onDuplicateEffectRequest: (
    effect: ClientEffect<TClientTriggerDataExec>,
    selectNewEffect?: boolean,
  ) => Promise<void>
  /**
   * Handles the request to delete an effect.
   */
  onDeleteEffectRequest: (
    effect: ClientEffect<TClientTriggerDataExec>,
    navigateBack?: boolean,
  ) => Promise<void>
  /**
   * A callback that will be called when a
   * change has been made.
   * @param effect The same effect passed.
   */
  onChange: (effect: ClientEffect<TClientTriggerDataExec>) => void
}
