import { useGlobalContext } from 'src/context'
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
  targetEnvironments,
  isEmptyString,
  areDefaultValues,
  effectEmptyStringArray,
  setEffectEmptyStringArray,
  setSelectedEffect,
  handleCloseRequest,
  handleChange,
}: TEffectEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

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

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The class name for the close button.
   */
  const closeClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['Close']

    // If there is at least one empty field, add the disabled class.
    if (isEmptyString || areDefaultValues) {
      classList.push('Disabled')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The class name for the back arrow.
   */
  const backButtonClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['BackArrow']

    // If there is at least one empty field, add the disabled class.
    if (isEmptyString || areDefaultValues) {
      classList.push('Disabled')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The text for the effect button.
   */
  const effectButtonText: string = compute(() => {
    if (action.effects.includes(effect)) {
      return 'Delete Effect'
    } else {
      return 'Cancel'
    }
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

  /* -- RENDER -- */
  return (
    <div className='EffectEntry SidePanel'>
      <div className='BorderBox'>
        {/* -- TOP OF BOX -- */}
        <div className={boxTopClassName}>
          <div className='BackButton'>
            <div
              className={backButtonClassName}
              onClick={() => setSelectedEffect(null)}
            >
              &#8592;
              <Tooltip description='Go back.' />
            </div>
          </div>
          <div className='ErrorMessage'>
            Fix all errors before closing panel.
          </div>
          <div className='Path'>Location: Mission/Node/Action/Effect</div>
          <div
            className={closeClassName}
            onClick={handleCloseRequest}
            key={'close-node-side-panel'}
          >
            <div className='CloseButton'>
              x
              <Tooltip description='Close panel.' />
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
              placeholder: 'Required',
            }}
          />
          <DetailBox
            label='Description'
            initialValue={effect.description}
            deliverValue={(description: string) => {
              effect.description = description
              forceUpdate()
            }}
            options={{
              placeholder: 'Required',
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
          />
          {/* -- BUTTON(S) -- */}
          <div className='ButtonContainer'>
            <div className='FormButton DeleteEffect'>
              <span className='Text' onClick={handleDeleteEffectRequest}>
                <span className='LeftBracket'>[</span> {effectButtonText}{' '}
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
   * A function that will set the selected effect.
   */
  setSelectedEffect: (effect: ClientEffect | null) => void
  /**
   * A function that will be called when the close button is clicked.
   */
  handleCloseRequest: () => void
  /**
   * A function that will be called when a change has been made.
   */
  handleChange: () => void
}
