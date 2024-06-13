import { useState } from 'react'
import Tooltip from 'src/components/content/communication/Tooltip'
import { DetailDropDown } from 'src/components/content/form/DetailDropDown'
import { ButtonText } from 'src/components/content/user-controls/ButtonText'
import { useGlobalContext } from 'src/context'
import ClientMissionAction from 'src/missions/actions'
import { ClientExternalEffect } from 'src/missions/effects/external'
import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import './CreateExternalEffect.scss'

/**
 * Prompt modal for creating an external effect to apply to a target.
 */
export default function CreateExternalEffect({
  effect,
  targetEnvironments,
  handleChange,
}: TCreateExternalEffect_P): JSX.Element | null {
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
   * The mission for the effect.
   */
  const mission = compute(() => effect.mission)
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
    if (targetEnv._id === ClientTargetEnvironment.DEFAULT_PROPERTIES._id) {
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

    // Hide the button if the target environment is the default environment.
    if (targetEnv.name === ClientTargetEnvironment.DEFAULT_PROPERTIES.name) {
      classList.push('Hidden')
    }

    // Disable the button if the target is the default target.
    if (target.name === ClientTarget.DEFAULT_PROPERTIES.name) {
      classList.push('Disabled')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })

  /* -- EFFECTS -- */

  // Sync the component state with the effect.
  usePostInitEffect(() => {
    effect.target = target
  }, [target])

  // Reset the target when the target environment changes.
  usePostInitEffect(() => {
    setTarget(new ClientTarget(targetEnv))
  }, [targetEnv])

  /* -- FUNCTIONS -- */
  /**
   * Handles creating a new external effect.
   */
  const createExternalEffect = () => {
    // Push the new external effect to the action.
    action.externalEffects.push(effect)
    // Display the changes.
    forceUpdate()
    // Allow the user to save the changes.
    handleChange()
  }

  /**
   * Callback for when the modal is requested to be closed.
   */
  const onCloseRequest = () => {
    mission.selectBack()
  }

  /* -- RENDER -- */

  return (
    <div className='CreateExternalEffect MapModal'>
      {/* -- TOP OF BOX -- */}
      <div className='Heading'>Create External Effect:</div>
      <div className='Close'>
        <div className='CloseButton' onClick={onCloseRequest}>
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
        text='Create External Effect'
        onClick={createExternalEffect}
        uniqueClassName={createEffectButtonClassName}
      />
    </div>
  )
}

/* ---------------------------- TYPES FOR CREATE EXTERNAL EFFECT ---------------------------- */

/**
 * Props for CreateExternalEffect component.
 */
export type TCreateExternalEffect_P = {
  /**
   * The external effect to create.
   */
  effect: ClientExternalEffect
  /**
   * List of target environments to apply external effects to.
   */
  targetEnvironments: ClientTargetEnvironment[]
  /**
   * Handles when a change is made that would require saving.
   */
  handleChange: () => void
}
