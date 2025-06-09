import { ClientEffect } from 'src/missions/effects'
import { useObjectFormSync } from 'src/toolbox/hooks'
import { TEffectTrigger } from '../../../../../../../shared/missions/effects'
import StringToolbox from '../../../../../../../shared/toolbox/strings'
import { DetailLargeString } from '../../../form/DetailLargeString'
import { DetailLocked } from '../../../form/DetailLocked'
import { DetailString } from '../../../form/DetailString'
import DetailDropdown from '../../../form/dropdown/DetailDropdown'
import { ButtonText } from '../../../user-controls/buttons/ButtonText'
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

  /* -- RENDER -- */

  return (
    <Entry missionComponent={effect}>
      <DetailString
        fieldType='required'
        handleOnBlur='repopulateValue'
        label='Name'
        value={name}
        setValue={setName}
        defaultValue={ClientEffect.DEFAULT_PROPERTIES.name}
        maxLength={ClientEffect.MAX_NAME_LENGTH}
        placeholder='Enter name...'
      />
      <DetailDropdown<TEffectTrigger>
        fieldType='required'
        label='Trigger'
        options={ClientEffect.TRIGGERS}
        value={trigger}
        setValue={setTrigger}
        isExpanded={false}
        render={(value: TEffectTrigger) => StringToolbox.capitalize(value)}
        getKey={(value) => value}
        handleInvalidOption={{
          method: 'setToDefault',
          defaultValue: 'success',
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
      {/* -- BUTTON(S) -- */}
      <div className='ButtonContainer'>
        <ButtonText
          text='Duplicate Effect'
          onClick={async () => await onDuplicateEffectRequest(effect, true)}
          tooltipDescription='Duplicate this effect.'
        />
        <ButtonText
          text='Delete Effect'
          onClick={async () => await onDeleteEffectRequest(effect, true)}
          tooltipDescription='Delete this effect.'
        />
      </div>
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
  effect: ClientEffect
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
   * A callback that will be called when a
   * change has been made.
   * @param effect The same effect passed.
   */
  onChange: (effect: ClientEffect) => void
}
