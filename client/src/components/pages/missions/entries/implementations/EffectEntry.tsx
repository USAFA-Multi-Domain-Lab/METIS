import { TMetisClientComponents } from 'src'
import { useButtonSvgEngine } from 'src/components/content/user-controls/buttons/panels/hooks'
import { useMissionPageContext } from 'src/components/pages/missions/context'
import useEffectItemButtonCallbacks from 'src/components/pages/missions/hooks/mission-components/effects'
import { ClientEffect } from 'src/missions/effects'
import { useObjectFormSync } from 'src/toolbox/hooks'
import {
  TEffectType,
  TSelectEffectContext,
} from '../../../../../../../shared/missions/effects'
import StringToolbox from '../../../../../../../shared/toolbox/strings'
import { DetailLargeString } from '../../../../content/form/DetailLargeString'
import { DetailLocked } from '../../../../content/form/DetailLocked'
import { DetailString } from '../../../../content/form/DetailString'
import DetailDropdown from '../../../../content/form/dropdown/DetailDropdown'
import ArgEntry from '../../target-effects/args/ArgEntry'
import Entry from '../Entry'

/**
 * Entry fields for an effect.
 */
export default function EffectEntry<TType extends TEffectType>({
  effect,
  effect: { target, environment },
}: TEffectEntry_P<TType>): JSX.Element | null {
  /* -- STATE -- */

  const { onChange } = useMissionPageContext()
  const { onDuplicateRequest, onDeleteRequest } = useEffectItemButtonCallbacks(
    effect.host,
  )
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
        onClick: async () => await onDuplicateRequest(effect, true),
      },
      {
        key: 'remove',
        type: 'button',
        icon: 'remove',
        description: 'Delete effect',
        permissions: ['missions_write'],
        onClick: async () => await onDeleteRequest(effect, true),
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
      <DetailDropdown<TSelectEffectContext<any>[TType]['trigger']>
        fieldType='required'
        label='Trigger'
        options={effect.host.validTriggers}
        value={trigger}
        setValue={setTrigger}
        isExpanded={false}
        render={(value) => StringToolbox.toTitleCase(value)}
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
export type TEffectEntry_P<TType extends TEffectType> = {
  /**
   * The effect to apply to the target.
   */
  effect: TMetisClientComponents[TType]
}
