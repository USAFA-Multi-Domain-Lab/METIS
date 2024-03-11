import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import { ClientTargetEnvironment } from 'src/target-environments'
import { compute } from 'src/toolbox'
import Tooltip from '../../communication/Tooltip'
import { Detail, DetailBox } from '../../form/Form'
import './EffectEntry.scss'
import TargetEnvEntry from './TargetEnvEntry'

/**
 * Prompt modal for creating a list of effects to apply to a target
 */
export default function EffectEntry({
  action,
  effect,
  missionPath,
  targetEnvironments,
  setMissionPath,
  setSelectedAction,
  setSelectedEffect,
  handleChange,
}: TEffectEntry_P): JSX.Element | null {
  /* -- COMPUTED -- */
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

  /* -- FUNCTIONS -- */

  /**
   * Handles the request to delete the effect.
   */
  const handleDeleteEffectRequest = () => {
    // Set the selected effect to null.
    setSelectedEffect(null)
    // Remove the effect from the action.
    action.effects.splice(action.effects.indexOf(effect), 1)
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
      setSelectedEffect(null)
    }
    // If the index is 1 then take the user
    // back to the node entry.
    else if (index === 1) {
      setSelectedAction(null)
      setSelectedEffect(null)
    }
    // If the index is 2 then take the user
    // back to the action entry.
    else if (index === 2) {
      setSelectedEffect(null)
    }
  }

  /* -- RENDER -- */
  return (
    <div className='EffectEntry SidePanel'>
      <div className='BorderBox'>
        {/* -- TOP OF BOX -- */}
        <div className='BoxTop'>
          <div className='BackContainer'>
            <div className='BackButton' onClick={() => setSelectedEffect(null)}>
              &lt;
              <Tooltip description='Go back.' />
            </div>
          </div>
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
        </div>

        {/* -- MAIN CONTENT -- */}
        <div className='SidePanelSection'>
          <Detail
            label='Name'
            currentValue={effect.name}
            defaultValue={ClientEffect.DEFAULT_PROPERTIES.name}
            deliverValue={(name: string) => {
              effect.name = name
              setMissionPath([missionName, nodeName, actionName, name])
              handleChange()
            }}
            placeholder='Enter name...'
          />
          <DetailBox
            label='Description'
            currentValue={effect.description}
            deliverValue={(description: string) => {
              effect.description = description
              handleChange()
            }}
            elementBoundary='.BorderBox'
            placeholder='Enter description...'
            displayOptionalText={true}
          />
          <TargetEnvEntry
            action={action}
            effect={effect}
            targetEnvironments={targetEnvironments}
          />
          {/* -- BUTTON(S) -- */}
          <div className='ButtonContainer'>
            <div className='FormButton DeleteEffect'>
              <span className='Text' onClick={handleDeleteEffectRequest}>
                <span className='LeftBracket'>[</span> Delete Effect{' '}
                <span className='RightBracket'>]</span>
                <Tooltip description='Delete this effect.' />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------- TYPES FOR EFFECTS ---------------------------- */

/**
 * Props for Effects component.
 */
export type TEffectEntry_P = {
  /**
   * The action to execute.
   */
  action: ClientMissionAction
  /**
   * The effect to apply to the target.
   */
  effect: ClientEffect
  /**
   * The path showing the user's location in the side panel.
   * @note This will help the user understand what they are editing.
   */
  missionPath: string[]
  /**
   * List of target environments to apply effects to.
   */
  targetEnvironments: ClientTargetEnvironment[]
  /**
   * A function that will set the mission path.
   */
  setMissionPath: (missionPath: string[]) => void
  /**
   * A function that will set the action that is selected.
   */
  setSelectedAction: (action: ClientMissionAction | null) => void
  /**
   * A function that will set the selected effect.
   */
  setSelectedEffect: (effect: ClientEffect | null) => void
  /**
   * A function that will be called when a change has been made.
   */
  handleChange: () => void
}
