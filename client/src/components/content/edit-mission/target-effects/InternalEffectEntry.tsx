import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMissionAction from 'src/missions/actions'
import { ClientInternalEffect } from 'src/missions/effects/internal'
import ClientTarget from 'src/target-environments/targets'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import Tooltip from '../../communication/Tooltip'
import { DetailLargeString } from '../../form/DetailLargeString'
import { DetailLocked } from '../../form/DetailLocked'
import { DetailString } from '../../form/DetailString'
import { ButtonText } from '../../user-controls/ButtonText'
import Args from './Args'
import './InternalEffectEntry.scss'

/**
 * Entry fields for an internal effect.
 */
export default function InternalEffectEntry({
  effect,
  setSelectedAction,
  setSelectedInternalEffect,
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

  /* -- COMPUTED -- */
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
   * Handles the request to delete the internal effect.
   */
  const handleDeleteInternalEffectRequest = () => {
    // Set the selected internal effect to null.
    setSelectedInternalEffect(null)
    // Filter out the internal effect from the action.
    action.internalEffects = action.internalEffects.filter(
      (actionEffect: ClientInternalEffect) => actionEffect._id !== effect._id,
    )
    // Display the changes.
    forceUpdate()
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
      action.mission.deselectNode()
      setSelectedAction(null)
      setSelectedInternalEffect(null)
    }
    // If the index is 1 then take the user
    // back to the node entry.
    else if (index === 1) {
      setSelectedAction(null)
      setSelectedInternalEffect(null)
    }
    // If the index is 2 then take the user
    // back to the action entry.
    else if (index === 2) {
      setSelectedInternalEffect(null)
    }
  }

  /**
   * Renders JSX for the back button.
   */
  const renderBackButtonJsx = (): JSX.Element | null => {
    return (
      <div className='BackContainer'>
        <div
          className='BackButton'
          onClick={() => setSelectedInternalEffect(null)}
        >
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
    <div className='InternalEffectEntry SidePanel'>
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
          {/* 
          // todo: uncomment when force is implemented
          <DetailLocked label='Force' stateValue={effect.force} />
          */}
          <DetailLocked
            label='Target'
            stateValue={targetParams?.name ?? 'No target selected.'}
          />
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
   * A function that will set the action that is selected.
   */
  setSelectedAction: (action: ClientMissionAction | null) => void
  /**
   * A function that will set the selected internal effect.
   */
  setSelectedInternalEffect: (effect: ClientInternalEffect | null) => void
  /**
   * A function that will be called when a change has been made.
   */
  handleChange: () => void
}
