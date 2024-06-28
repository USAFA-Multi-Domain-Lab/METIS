import { useState } from 'react'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
import { usePostInitEffect } from 'src/toolbox/hooks'
import { DetailLargeString } from '../../form/DetailLargeString'
import { DetailLocked } from '../../form/DetailLocked'
import { DetailString } from '../../form/DetailString'
import { ButtonText } from '../../user-controls/ButtonText'
import Args from '../target-effects/Args'
import './index.scss'
import EntryNavigation from './navigation/EntryNavigation'

/**
 * Entry fields for an effect.
 */
export default function EffectEntry({
  effect,
  handleChange,
}: TEffectEntry_P): JSX.Element | null {
  /* -- STATE -- */
  const [name, setName] = useState<ClientEffect['name']>(effect.name)
  const [description, setDescription] = useState<ClientEffect['description']>(
    effect.description,
  )
  const [targetEnv] = useState<ClientTargetEnvironment | null>(
    effect.targetEnvironment,
  )
  const [target] = useState<ClientTarget | null>(effect.target)
  const [effectArgs, setEffectArgs] = useState<ClientEffect['args']>(
    effect.args,
  )

  /* -- COMPUTED -- */
  /**
   * The mission for the effect.
   */
  const mission = effect.mission
  /**
   * The action to execute.
   */
  const action: ClientMissionAction = effect.action

  /* -- EFFECTS -- */

  // componentDidUpdate
  usePostInitEffect(() => {
    // Update the effect's name.
    effect.name = name
    // Update the effect's description.
    effect.description = description
    // Update the effect's arguments.
    effect.args = effectArgs

    // Allow the user to save the changes.
    handleChange()
  }, [name, description, effectArgs])

  /* -- FUNCTIONS -- */

  /**
   * Handles the request to delete the effect.
   */
  const handleDeleteEffectRequest = () => {
    // Go back to the previous selection.
    mission.selectBack()

    // Filter out the effect from the action.
    effect.action.effects = action.effects.filter(
      (actionEffect: ClientEffect) => actionEffect._id !== effect._id,
    )
    // Allow the user to save the changes.
    handleChange()
  }

  /* -- RENDER -- */
  return (
    <div className='Entry EffectEntry SidePanel'>
      <div className='BorderBox'>
        {/* -- TOP OF BOX -- */}
        <div className='BoxTop'>
          <EntryNavigation object={effect} />
        </div>

        {/* -- MAIN CONTENT -- */}
        <div className='SidePanelSection'>
          <DetailString
            fieldType='required'
            handleOnBlur='repopulateValue'
            label='Name'
            stateValue={name}
            setState={setName}
            defaultValue={ClientEffect.DEFAULT_PROPERTIES.name}
            placeholder='Enter name...'
          />
          <DetailLargeString
            fieldType='optional'
            handleOnBlur='none'
            label='Description'
            stateValue={description}
            setState={setDescription}
            elementBoundary='.SidePanelSection'
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
          <Args
            target={target}
            effectArgs={effectArgs}
            setEffectArgs={setEffectArgs}
          />
          {/* -- BUTTON(S) -- */}
          <div className='ButtonContainer'>
            <ButtonText
              text='Delete Effect'
              onClick={handleDeleteEffectRequest}
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
   * A function that will be called when a change has been made.
   */
  handleChange: () => void
}
