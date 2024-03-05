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
  isEmptyString,
  areDefaultValues,
  effectEmptyStringArray,
  setEffectEmptyStringArray,
  setMissionPath,
  setSelectedAction,
  setSelectedEffect,
  handleChange,
}: TEffectEntry_P): JSX.Element | null {
  /* -- COMPUTED -- */
  /**
   * The class name for the top of the box.
   */
  const boxTopClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['BoxTop']

    // If there is at least one empty field, add the error class.
    if (isEmptyString) {
      classList.push('IsError')
    }

    if (!action.effects.includes(effect)) {
      classList.push('New')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The class name for the back arrow.
   */
  const backButtonClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['BackButton']

    // If the effect is new then hide the back button.
    if (!action.effects.includes(effect)) {
      classList.push('Hidden')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The class name for the close button.
   */
  const closeButtonClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['Close']

    // If the effect is new then hide the close button.
    if (action.effects.includes(effect)) {
      classList.push('Hidden')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The class name for the delete button.
   */
  const deleteButtonClassName: string = compute(() => {
    let classList: string[] = ['FormButton DeleteEffect']

    if (!action.effects.includes(effect)) {
      classList.push('Hidden')
    }

    return classList.join(' ')
  })
  /**
   * The name of the mission.
   */
  const missionName: string = compute(() => {
    return action.node.mission.name
  })
  /**
   * The name of the node.
   */
  const nodeName: string = compute(() => {
    return action.node.name
  })
  /**
   * The name of the action.
   */
  const actionName: string = compute(() => {
    return action.name
  })
  /**
   * The class name for the mission path.
   */
  const pathClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['Path']

    if (!action.effects.includes(effect)) {
      classList.push('Disabled')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })

  /* -- FUNCTIONS -- */
  /**
   * If a field that was previously left empty meets the
   * requirements then this will remove the key that was
   * stored when the field was empty which will let the
   * user know that the field has met its requirements
   * when the state updates.
   * @param field The field that was previously left empty.
   */
  const removeEffectEmptyString = (field: string) => {
    effectEmptyStringArray.map((effectEmptyString: string, index: number) => {
      if (effectEmptyString === `effectID=${effect.id}_field=${field}`) {
        effectEmptyStringArray.splice(index, 1)
      }
    })
  }

  /**
   * Handles the request to delete the effect.
   */
  const handleDeleteEffectRequest = () => {
    // Reset the effectEmptyStringArray.
    setEffectEmptyStringArray([])
    // Set the selected effect to null.
    setSelectedEffect(null)
    // If the effect is not new then remove it from the action
    // and allow the user to save the changes.
    if (action.effects.includes(effect)) {
      // Remove the effect from the action.
      action.effects.splice(action.effects.indexOf(effect), 1)
      // Allow the user to save the changes.
      handleChange()
    }
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
        <div className={boxTopClassName}>
          <div className='BackContainer'>
            <div
              className={backButtonClassName}
              onClick={() => setSelectedEffect(null)}
            >
              &lt;
              <Tooltip description='Go back.' />
            </div>
          </div>
          <div className='ErrorMessage'>
            Fix all errors before closing panel.
          </div>
          <div className={pathClassName}>
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
          <div
            className={closeButtonClassName}
            onClick={() => setSelectedEffect(null)}
          >
            <div className='CloseButton'>
              x
              <Tooltip description='Cancel' />
            </div>
          </div>
        </div>

        {/* -- MAIN CONTENT -- */}
        <div className='SidePanelSection'>
          <Detail
            label='Name'
            initialValue={effect.name}
            deliverValue={(name: string) => {
              if (name !== '') {
                effect.name = name
                setMissionPath([missionName, nodeName, actionName, name])
                removeEffectEmptyString('name')
                handleChange()
              } else {
                setEffectEmptyStringArray([
                  ...effectEmptyStringArray,
                  `effectID=${effect.id}_field=name`,
                ])
              }
            }}
            options={{
              placeholder: 'Enter name...',
            }}
          />
          <DetailBox
            label='Description'
            initialValue={effect.description}
            deliverValue={(description: string) => {
              effect.description = description

              if (description !== '<p><br></p>') {
                removeEffectEmptyString('description')
                handleChange()
              } else {
                setEffectEmptyStringArray([
                  ...effectEmptyStringArray,
                  `effectID=${effect.id}_field=description`,
                ])
              }
            }}
            options={{
              placeholder: 'Enter description...',
              elementBoundary: '.BorderBox',
            }}
          />
          <TargetEnvEntry
            action={action}
            effect={effect}
            targetEnvironments={targetEnvironments}
            isEmptyString={isEmptyString}
            areDefaultValues={areDefaultValues}
            setSelectedEffect={setSelectedEffect}
            handleChange={handleChange}
          />
          {/* -- BUTTON(S) -- */}
          <div className='ButtonContainer'>
            <div className={deleteButtonClassName}>
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
   * A boolean that will determine if a field has been left empty.
   */
  isEmptyString: boolean
  /**
   * A boolean that will determine if a field has default values.
   */
  areDefaultValues: boolean
  /**
   * An array of strings that will be used to determine
   * if a field has been left empty.
   */
  effectEmptyStringArray: string[]
  /**
   * A function that will set the array of strings that
   * will be used to determine if a field has been left empty.
   */
  setEffectEmptyStringArray: (effectEmptyStringArray: string[]) => void
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
