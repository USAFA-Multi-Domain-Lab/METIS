import { DetailDropdown } from '@client/components/content/form/dropdowns/standard/DetailDropdown'
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
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useState } from 'react'
import './EffectCreator.scss'

/**
 * A form for creating a new effect. A user will select
 * a target-environment and target, and once created, the
 * new effect will be selected in the mission for configuration.
 */
export default function EffectCreator<
  TType extends TEffectType = 'sessionTriggeredEffect',
>(props: TEffectCreator_P<TType>): TReactElement | null {
  /* -- PROPS -- */

  const { host, trigger, onChange, onCancel } = props

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

  const rootClasses = new ClassList('EffectCreator')

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
   * Handles creating a new effect. Selecting the new effect
   * causes the mission page to dismiss this view and switch
   * to the inspector so the effect can be configured.
   */
  const createEffect = () => {
    let effect = host.createEffect(target, trigger)
    // Select the new effect.
    mission.select(effect)
    // Allow the user to save the changes.
    onChange(effect)
  }

  /* -- RENDER -- */

  return (
    <div className={rootClasses.value}>
      {/* -- TOP OF VIEW -- */}
      <div className='EffectCreatorHeading'>Create Effect</div>
      <div className='EffectCreatorDescription'>
        Choose a target environment and target for the new effect. Once created,
        the effect will be selected in the inspector for configuration.
      </div>

      {/* -- MAIN CONTENT -- */}
      <div className='EffectCreatorForm'>
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
      </div>
      {/* -- BUTTON(S) -- */}
      <div className='EffectCreatorButtons'>
        <ButtonText
          text='Create Effect'
          onClick={createEffect}
          uniqueClassName={createEffectButtonClassName}
        />
        <ButtonText
          text='Cancel'
          onClick={() => onCancel()}
          tooltipDescription='Discard and return to the inspector.'
        />
      </div>
    </div>
  )
}

/* ---------------------------- TYPES FOR EFFECT CREATOR ---------------------------- */

/**
 * Props for {@link EffectCreator} component.
 */
export interface TEffectCreator_P<TType extends TEffectType = any> {
  /**
   * The host for which to create the effect.
   */
  host: TClientEffectHost<TType>
  /**
   * The trigger for the new effect.
   */
  trigger: ClientEffect<TType>['trigger']
  /**
   * Handles when a change is made that would require saving.
   * @param effect The effect that was changed.
   */
  onChange: (effect: ClientEffect) => void
  /**
   * Handles when the user cancels effect creation, dismissing
   * this view without creating an effect.
   */
  onCancel: () => void
}
