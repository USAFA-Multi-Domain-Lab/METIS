import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMission from 'src/missions'
import ClientMissionAction from 'src/missions/actions'
import { ClientInternalEffect } from 'src/missions/effects/internal'
import ClientMissionForce from 'src/missions/forces'
import ClientTarget from 'src/target-environments/targets'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import { DetailLargeString } from '../../form/DetailLargeString'
import { DetailLocked } from '../../form/DetailLocked'
import { DetailString } from '../../form/DetailString'
import { ButtonText } from '../../user-controls/ButtonText'
import Args from '../target-effects/Args'
import './index.scss'
import EntryNavigation from './navigation/EntryNavigation'

/**
 * Entry fields for an internal effect.
 */
export default function InternalEffectEntry({
  effect,
  handleChange,
}: TInternalEffectEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */

  const { forceUpdate } = useGlobalContext().actions

  /* -- STATE -- */

  const [name, setName] = useState<ClientInternalEffect['name']>(effect.name)
  const [description, setDescription] = useState<
    ClientInternalEffect['description']
  >(effect.description)
  const [effectArgs, setEffectArgs] = useState<ClientInternalEffect['args']>(
    effect.args,
  )
  const [target] = useState<ClientTarget | null>(effect.target)
  const [targetParams] = useState<ClientInternalEffect['targetParams']>(
    effect.targetParams,
  )
  const [targetForce] = useState<ClientMissionForce | null>(effect.targetForce)

  /* -- COMPUTED -- */

  /**
   * The action to execute.
   */
  const action: ClientMissionAction = compute(() => effect.action)

  /**
   * The mission for the effect.
   */
  const mission: ClientMission = compute(() => action.mission)

  /**
   * The value to display as the target.
   */
  const targetValue: string = compute(() => {
    // Initialize the value to display.
    let value: string = 'No target selected.'

    // If the target parameters are set and the target
    // paramter is not a ClientMissionForce then use the
    // target parameter's name.
    if (targetParams && !(targetParams instanceof ClientMissionForce)) {
      value = targetParams.name
    }
    // Otherwise, if the target is set then use the target's name.
    else if (target) {
      value = target.name
    }

    // Return the value to display.
    return value
  })

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
   * Handles the request to delete the internal effect.
   */
  const handleDeleteInternalEffectRequest = () => {
    // Select back to the action.
    mission.selectBack()
    // Filter out the internal effect from the action.
    action.internalEffects = action.internalEffects.filter(
      (actionEffect: ClientInternalEffect) => actionEffect._id !== effect._id,
    )
    // Allow the user to save the changes.
    handleChange()
  }

  /* -- RENDER -- */

  return (
    <div className='Entry InternalEffectEntry SidePanel'>
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
            defaultValue={ClientInternalEffect.DEFAULT_PROPERTIES.name}
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
          <DetailLocked label='Target Environment' stateValue='METIS' />
          <DetailLocked
            label='Force'
            stateValue={targetForce?.name ?? 'No force selected.'}
          />
          <DetailLocked label='Target' stateValue={targetValue} />
          <Args
            target={target}
            effectArgs={effectArgs}
            setEffectArgs={setEffectArgs}
          />
          {/* -- BUTTON(S) -- */}
          <div className='ButtonContainer'>
            <ButtonText
              text='Delete Internal Effect'
              onClick={handleDeleteInternalEffectRequest}
              tooltipDescription='Delete this internal effect.'
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------- TYPES FOR INTERNAL EFFECT ENTRY ---------------------------- */

/**
 * Props for InternalEffectEntry component.
 */
export type TInternalEffectEntry_P = {
  /**
   * The internal effect to apply to the target.
   */
  effect: ClientInternalEffect
  /**
   * A function that will be called when a change has been made.
   */
  handleChange: () => void
}
