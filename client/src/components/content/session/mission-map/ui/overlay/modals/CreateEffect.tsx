import Tooltip from '@client/components/content/communication/Tooltip'
import { DetailDropdown } from '@client/components/content/form/dropdown/'
import { ButtonText } from '@client/components/content/user-controls/buttons/ButtonText'
import type {
  ClientEffect,
  TClientEffectHost,
} from '@client/missions/effects/ClientEffect'
import { ClientTarget } from '@client/target-environments/ClientTarget'
import { ClientTargetEnvironment } from '@client/target-environments/ClientTargetEnvironment'
import { compute } from '@client/toolbox'
import { usePostInitEffect } from '@client/toolbox/hooks'
import type { TEffectType } from '@shared/missions/effects/Effect'
import { useState } from 'react'
import './CreateEffect.scss'

/**
 * Prompt modal for creating an effect to apply to a target.
 */
export default function CreateEffect<
  TType extends TEffectType = 'sessionTriggeredEffect',
>({
  host,
  trigger,
  onCloseRequest,
  onChange,
}: TCreateEffect_P<TType>): TReactElement | null {
  /* -- STATE -- */

  const [targetEnvironments] = useState<ClientTargetEnvironment[]>(
    ClientTargetEnvironment.REGISTRY.getAll(),
  )
  const [targetEnv, setTargetEnv] = useState<ClientTargetEnvironment>(
    ClientTargetEnvironment.createBlank(),
  )
  const [target, setTarget] = useState<ClientTarget>(
    ClientTarget.createBlank(targetEnv),
  )

  /* -- COMPUTED -- */

  /**
   * The current mission.
   */
  const mission = compute(() => host.mission)
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

  // Reset the target when the target environment changes.
  usePostInitEffect(() => {
    setTarget(ClientTarget.createBlank(targetEnv))
  }, [targetEnv])

  /* -- FUNCTIONS -- */

  /**
   * Handles creating a new effect.
   */
  const createEffect = () => {
    let effect = host.createEffect(target, trigger)
    // Select the new effect.
    mission.select(effect)
    // Allow the user to save the changes.
    onChange(effect)
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
          value={targetEnv}
          setValue={setTargetEnv}
          isExpanded={false}
          getKey={({ _id }) => _id}
          render={(targetEnv: ClientTargetEnvironment) => targetEnv.name}
          handleInvalidOption={{
            method: 'setToDefault',
            defaultValue: ClientTargetEnvironment.createBlank(),
          }}
        />
        <DetailDropdown<ClientTarget>
          fieldType='required'
          label='Target'
          options={targetEnv.targets}
          value={target}
          setValue={setTarget}
          isExpanded={false}
          getKey={({ _id }) => _id}
          render={(target: ClientTarget) => target.name}
          uniqueClassName={targetClassName}
          handleInvalidOption={{
            method: 'setToDefault',
            defaultValue: ClientTarget.createBlank(
              ClientTargetEnvironment.createBlank(),
            ),
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
export type TCreateEffect_P<TType extends TEffectType = any> = {
  /**
   * The host for which to create the effect.
   */
  host: TClientEffectHost<TType>
  /**
   * The trigger for the new effect.
   */
  trigger: ClientEffect<TType>['trigger']
  /**
   * Callback to handle a request to close the modal.
   */
  onCloseRequest: () => void
  /**
   * Handles when a change is made that would require saving.
   * @param effect The effect that was changed.
   */
  onChange: (effect: ClientEffect) => void
}
