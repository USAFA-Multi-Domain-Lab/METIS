import { useState } from 'react'
import Tooltip from 'src/components/content/communication/Tooltip'
import { DetailDropDown } from 'src/components/content/form/Form'
import { ButtonText } from 'src/components/content/user-controls/ButtonText'
import { useGlobalContext } from 'src/context'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import './CreateEffectModal.scss'

/**
 * Prompt modal for creating an effect to apply to a target.
 */
export default function CreateEffectModal({
  effect,
  targetEnvironments,
  handleClose,
  handleChange,
}: TCreateEffectModal_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- STATE -- */
  const [targetEnv, setTargetEnv] = useState<ClientTargetEnvironment>(
    new ClientTargetEnvironment(),
  )
  const [target, setTarget] = useState<ClientTarget>(
    new ClientTarget(new ClientTargetEnvironment()),
  )

  /* -- COMPUTED -- */
  /**
   * The action to execute.
   */
  const action: ClientMissionAction = compute(() => effect.action)
  /**
   * The class name for the target drop down.
   */
  const targetClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = []

    // Hide the drop down if the target environment is the default environment.
    if (targetEnv.id === ClientTargetEnvironment.DEFAULT_PROPERTIES.id) {
      classList.push('Hidden')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The class name for the create effect button.
   */
  const createEffectButtonClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = []

    // Hide the button if the target environment is null.
    if (targetEnv.name === ClientTargetEnvironment.DEFAULT_PROPERTIES.name) {
      classList.push('Hidden')
    }

    // Disable the button if the target is null.
    if (target.name === ClientTarget.DEFAULT_PROPERTIES.name) {
      classList.push('Disabled')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })

  /* -- EFFECTS -- */

  // Sync the component state with the effect state.
  usePostInitEffect(() => {
    effect.target = target
  }, [target])

  /* -- FUNCTIONS -- */
  /**
   * Handles creating a new effect.
   */
  const createEffect = () => {
    // Push the new effect to the action.
    action.effects.push(effect)
    // Display the changes.
    forceUpdate()
    // Allow the user to save the changes.
    handleChange()
  }

  /* -- RENDER -- */

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
      <DetailDropDown<ClientTargetEnvironment>
        fieldType='required'
        label='Target Environment'
        options={targetEnvironments}
        stateValue={targetEnv}
        setState={setTargetEnv}
        isExpanded={false}
        renderDisplayName={(targetEnv: ClientTargetEnvironment) =>
          targetEnv.name
        }
      />
      <DetailDropDown<ClientTarget>
        fieldType='required'
        label='Target'
        options={targetEnv.targets}
        stateValue={target}
        setState={setTarget}
        isExpanded={false}
        renderDisplayName={(target: ClientTarget) => target.name}
        uniqueClassName={targetClassName}
      />

      {/* -- BUTTON(S) -- */}
      <ButtonText
        text='Create Effect'
        onClick={createEffect}
        tooltipDescription='Creates an undefined effect and adds it to the action.'
        uniqueClassName={createEffectButtonClassName}
      />
    </div>
  )
}

/* ---------------------------- TYPES FOR CREATE EFFECT MODAL ---------------------------- */

/**
 * Props for CreateEffectModal component.
 */
export type TCreateEffectModal_P = {
  /**
   * The effect to create.
   */
  effect: ClientEffect
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
