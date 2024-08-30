import { useState } from 'react'
import Tooltip from 'src/components/content/communication/Tooltip'
import { DetailDropdown } from 'src/components/content/form/DetailDropdown'
import { ButtonText } from 'src/components/content/user-controls/ButtonText'
import { useGlobalContext } from 'src/context'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import './CreateEffect.scss'

/**
 * Prompt modal for creating an effect to apply to a target.
 */
export default function CreateEffect({
  action,
  setIsNewEffect,
  handleChange,
}: TCreateEffect_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- STATE -- */
  const [effect] = useState<ClientEffect>(new ClientEffect(action))
  const [targetEnvironments] = useState<ClientTargetEnvironment[]>(
    ClientTargetEnvironment.getAll(),
  )
  const [targetEnv, setTargetEnv] = useState<ClientTargetEnvironment>(
    new ClientTargetEnvironment(),
  )
  const [target, setTarget] = useState<ClientTarget>(
    new ClientTarget(new ClientTargetEnvironment()),
  )

  /* -- COMPUTED -- */
  /**
   * The current mission.
   */
  const mission = compute(() => action.mission)
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
   * Handles creating a new effect.
   */
  const createEffect = () => {
    // Push the new effect to the action.
    action.effects.push(effect)
    // Select the new effect.
    mission.select(effect)
    // Display the changes.
    forceUpdate()
    // Allow the user to save the changes.
    handleChange()
  }

  /**
   * Callback for when the modal is requested to be closed.
   */
  const onCloseRequest = () => {
    setIsNewEffect(false)
  }

  /* -- RENDER -- */

  if (targetEnvironments.length > 0) {
    return (
      <div className='CreateEffect MapModal'>
        {/* -- TOP OF BOX -- */}
        <div className='Heading'>Create Effect:</div>
        <div className='Close'>
          <div className='CloseButton' onClick={onCloseRequest}>
            x
            <Tooltip description='Close window.' />
          </div>
        </div>

        {/* -- MAIN CONTENT -- */}
        <DetailDropdown<ClientTargetEnvironment>
          fieldType='required'
          label='Target Environment'
          options={targetEnvironments}
          stateValue={targetEnv}
          setState={setTargetEnv}
          isExpanded={false}
          getKey={({ _id }) => _id}
          render={(targetEnv: ClientTargetEnvironment) => targetEnv.name}
          handleInvalidOption={{
            method: 'setToDefault',
            defaultValue: new ClientTargetEnvironment(),
          }}
        />
        <DetailDropdown<ClientTarget>
          fieldType='required'
          label='Target'
          options={targetEnv.targets}
          stateValue={target}
          setState={setTarget}
          isExpanded={false}
          getKey={({ _id }) => _id}
          render={(target: ClientTarget) => target.name}
          uniqueClassName={targetClassName}
          handleInvalidOption={{
            method: 'setToDefault',
            defaultValue: new ClientTarget(new ClientTargetEnvironment()),
          }}
        />

        {/* -- BUTTON(S) -- */}
        <ButtonText
          text='Create Effect'
          onClick={createEffect}
          uniqueClassName={createEffectButtonClassName}
        />
      </div>
    )
  } else {
    return null
  }
}

/* ---------------------------- TYPES FOR CREATE EFFECT ---------------------------- */

/**
 * Props for CreateEffect component.
 */
export type TCreateEffect_P = {
  /**
   * The action to create the effect for.
   */
  action: ClientMissionAction
  /**
   * Function that updates the isNewEffect state.
   */
  setIsNewEffect: TReactSetter<boolean>
  /**
   * Handles when a change is made that would require saving.
   */
  handleChange: () => void
}
