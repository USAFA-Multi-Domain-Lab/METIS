import { ClientEffect } from 'src/missions/effects'
import { useObjectFormSync } from 'src/toolbox/hooks'
import { DetailLargeString } from '../../form/DetailLargeString'
import { DetailLocked } from '../../form/DetailLocked'
import { DetailString } from '../../form/DetailString'
import { ButtonText } from '../../user-controls/buttons/ButtonText'
import ArgEntry from '../target-effects/ArgEntry'
import './index.scss'
import EntryNavigation from './navigation/EntryNavigation'
import { TEffectTrigger } from '../../../../../../shared/missions/effects'
import { DetailDropdown } from '../../form/DetailDropdown'
import StringToolbox from '../../../../../../shared/toolbox/strings'

/**
 * Entry fields for an effect.
 */
export default function EffectEntry({
  effect,
  effect: { target, targetEnvironment: targetEnv },
  handleDeleteEffectRequest,
  onChange,
}: TEffectEntry_P): JSX.Element | null {
  /* -- STATE -- */

  const effectState = useObjectFormSync(
    effect,
    ['name', 'trigger', 'description', 'args'],
    { onChange },
  )
  const [name, setName] = effectState.name
  const [trigger, setTrigger] = effectState.trigger
  const [description, setDescription] = effectState.description
  const [effectArgs, setEffectArgs] = effectState.args

  /* -- RENDER -- */

  return (
    <div className='Entry EffectEntry SidePanel'>
      <div className='BorderBox'>
        {/* -- TOP OF BOX -- */}
        <div className='BoxTop'>
          <EntryNavigation object={effect} />
        </div>

        {/* -- MAIN CONTENT -- */}
        <div className='SidePanelContent'>
          <DetailString
            fieldType='required'
            handleOnBlur='repopulateValue'
            label='Name'
            stateValue={name}
            setState={setName}
            defaultValue={ClientEffect.DEFAULT_PROPERTIES.name}
            maxLength={ClientEffect.MAX_NAME_LENGTH}
            placeholder='Enter name...'
          />
          <DetailDropdown<TEffectTrigger>
            fieldType='required'
            label='Trigger'
            options={ClientEffect.TRIGGERS}
            stateValue={trigger}
            setState={setTrigger}
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
            stateValue={description}
            setState={setDescription}
            placeholder='Enter description...'
          />
          <DetailLocked
            label='Target Environment'
            stateValue={targetEnv?.name ?? 'No target environment selected.'}
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
              text='Delete Effect'
              onClick={async () =>
                await handleDeleteEffectRequest(effect, true)
              }
              tooltipDescription='Delete this effect.'
            />
          </div>
        </div>
      </div>
    </div>
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
   * Handles the request to delete an effect.
   */
  handleDeleteEffectRequest: (
    effect: ClientEffect,
    navigateBack?: boolean,
  ) => Promise<void>
  /**
   * A function that will be called when a change has been made.
   */
  onChange: () => void
}
