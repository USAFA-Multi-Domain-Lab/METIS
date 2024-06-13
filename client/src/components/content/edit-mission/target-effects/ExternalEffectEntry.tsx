import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMissionAction from 'src/missions/actions'
import { ClientExternalEffect } from 'src/missions/effects/external'
import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import Tooltip from '../../communication/Tooltip'
import { DetailLargeString } from '../../form/DetailLargeString'
import { DetailLocked } from '../../form/DetailLocked'
import { DetailString } from '../../form/DetailString'
import { ButtonText } from '../../user-controls/ButtonText'
import Args from './Args'
import './ExternalEffectEntry.scss'

/**
 * Entry fields for an external effect.
 */
export default function ExternalEffectEntry({
  effect,
  handleChange,
}: TExternalEffectEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

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
  const mission = compute(() => effect.mission)
  /**
   * The action to execute.
   */
  const action: ClientMissionAction = compute(() => effect.action)
  /**
   * The name of the mission.
   */
  const missionName: string = compute(() => effect.mission.name)
  /**
   * The name of the node.
   */
  const nodeName: string = compute(() => effect.node.name)
  /**
   * The name of the action.
   */
  const actionName: string = compute(() => action.name)
  /**
   * The current location within the mission.
   */
  const missionPath: string[] = compute(() => [
    missionName,
    nodeName,
    actionName,
    name,
  ])

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
    action.externalEffects = action.externalEffects.filter(
      (actionEffect: ClientExternalEffect) => actionEffect._id !== effect._id,
    )
    // Allow the user to save the changes.
    handleChange()
  }

  /**
   * This will handle the click event for the path position.
   * @param index The index of the path position that was clicked.
   */
  const handlePathPositionClick = (index: number) => {
    // If the index is 0 then take the user
    // back to the mission entry.
    if (index === 0) {
      mission.deselect()
    }
    // If the index is 1 then take the user
    // back to the node entry.
    else if (index === 1) {
      mission.select(action.node)
    }
    // If the index is 2 then take the user
    // back to the action entry.
    else if (index === 2) {
      mission.select(action)
    }
  }

  /**
   * Renders JSX for the back button.
   */
  const renderBackButtonJsx = (): JSX.Element | null => {
    return (
      <div className='BackContainer'>
        <div className='BackButton' onClick={() => mission.selectBack()}>
          &lt;
          <Tooltip description='Go back.' />
        </div>
      </div>
    )
  }
  /**
   * Renders JSX for the path of the mission.
   */
  const renderPathJsx = (): JSX.Element | null => {
    return (
      <div className='Path'>
        Location:{' '}
        {missionPath.map((position: string, index: number) => {
          return (
            <span className='Position' key={`position-${index}`}>
              <span
                className='PositionText'
                onClick={() => handlePathPositionClick(index)}
              >
                {position}
              </span>{' '}
              {index === missionPath.length - 1 ? '' : ' > '}
            </span>
          )
        })}
      </div>
    )
  }

  /* -- RENDER -- */
  return (
    <div className='ExternalEffectEntry SidePanel'>
      <div className='BorderBox'>
        {/* -- TOP OF BOX -- */}
        <div className='BoxTop'>
          {renderBackButtonJsx()}
          {renderPathJsx()}
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
