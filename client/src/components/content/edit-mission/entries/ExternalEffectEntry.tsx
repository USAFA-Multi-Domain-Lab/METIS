import { useState } from 'react'
import ClientMissionAction from 'src/missions/actions'
import { ClientExternalEffect } from 'src/missions/effects/external'
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
 * Entry fields for an external effect.
 */
export default function ExternalEffectEntry({
  effect,
  handleChange,
}: TExternalEffectEntry_P): JSX.Element | null {
  /* -- STATE -- */
  const [name, setName] = useState<ClientExternalEffect['name']>(effect.name)
  const [description, setDescription] = useState<
    ClientExternalEffect['description']
  >(effect.description)
  const [targetEnv] = useState<ClientTargetEnvironment | null>(
    effect.targetEnvironment,
  )
  const [target] = useState<ClientTarget | null>(effect.target)
  const [effectArgs, setEffectArgs] = useState<ClientExternalEffect['args']>(
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
   * Handles the request to delete the external effect.
   */
  const handleDeleteExternalEffectRequest = () => {
    // Go back to the previous selection.
    mission.selectBack()

    // Filter out the external effect from the action.
    effect.action.externalEffects = action.externalEffects.filter(
      (actionEffect: ClientExternalEffect) => actionEffect._id !== effect._id,
    )
    // Allow the user to save the changes.
    handleChange()
  }

  /* -- RENDER -- */
  return (
    <div className='Entry ExternalEffectEntry SidePanel'>
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
            defaultValue={ClientExternalEffect.DEFAULT_PROPERTIES.name}
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
              text='Delete External Effect'
              onClick={handleDeleteExternalEffectRequest}
              tooltipDescription='Delete this external effect.'
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------- TYPES FOR EXTERNAL EFFECT ENTRY ---------------------------- */

/**
 * Props for ExternalEffectEntry component.
 */
export type TExternalEffectEntry_P = {
  /**
   * The external effect to apply to the target.
   */
  effect: ClientExternalEffect
  /**
   * A function that will be called when a change has been made.
   */
  handleChange: () => void
}
