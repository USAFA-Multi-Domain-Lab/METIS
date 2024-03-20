import Tooltip from 'src/components/content/communication/Tooltip'
import TargetEnvEntry from 'src/components/content/edit-mission/target-effects/TargetEnvEntry'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
import { compute } from 'src/toolbox'
import './CreateEffectModal.scss'

/**
 * Prompt modal for creating an effect to apply to a target.
 */
export default function CreateEffectModal({
  action,
  effect,
  targetEnvironments,
  handleClose,
  handleChange,
}: TCreateEffectModal_P): JSX.Element | null {
  if (action && effect) {
    /* -- COMPUTED -- */
    /**
     * The class name for the create effect button.
     */
    const createEffectButtonClassName: string = compute(() => {
      // Create a default list of class names.
      let classList: string[] = ['Button', 'CreateEffect']

      // Hide the button if the target environment is the default environment.
      if (
        effect.targetEnvironment.id ===
        ClientTargetEnvironment.DEFAULT_PROPERTIES.id
      ) {
        classList.push('Hidden')
      }

      // Disable the button if the target is the default target.
      if (effect.target.id === ClientTarget.DEFAULT_PROPERTIES.id) {
        classList.push('Disabled')
      }

      // Combine the class names into a single string.
      return classList.join(' ')
    })

    /* -- FUNCTIONS -- */
    /**
     * Handles creating a new effect.
     */
    const createEffect = () => {
      // Push the new effect to the action.
      action.effects.push(effect)
      // Allow the user to save the changes.
      handleChange()
    }

    return (
      <div className='CreateEffectModal MapModal'>
        {/* -- TOP OF BOX -- */}
        <div className='Heading'>Choose a target to affect:</div>
        <div className='Close'>
          <div className='CloseButton' onClick={handleClose}>
            x
            <Tooltip description='Close window.' />
          </div>
        </div>

        {/* -- MAIN CONTENT -- */}
        <TargetEnvEntry
          action={action}
          effect={effect}
          targetEnvironments={targetEnvironments}
          handleChange={handleChange}
        />

        {/* -- BUTTON(S) -- */}
        <div className='ButtonContainer'>
          <div className={createEffectButtonClassName} onClick={createEffect}>
            Create Effect
            <Tooltip description='Creates an undefined effect and adds it to the action.' />
          </div>
        </div>
      </div>
    )
  } else {
    return null
  }
}

/* ---------------------------- TYPES FOR CREATE EFFECT MODAL ---------------------------- */

/**
 * Props for CreateEffectModal component.
 */
export type TCreateEffectModal_P = {
  /**
   * The action to execute.
   */
  action: ClientMissionAction | null
  /**
   * The effect to create.
   */
  effect: ClientEffect | null
  /**
   * List of target environments to apply effects to.
   */
  targetEnvironments: ClientTargetEnvironment[]
  /**
   * A function that will close the modal.
   */
  handleClose: () => void
  /**
   * Handles when a change is made that would require saving.
   */
  handleChange: () => void
}
