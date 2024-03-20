import { useGlobalContext } from 'src/context'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
import { compute } from 'src/toolbox'
import Tooltip from '../../communication/Tooltip'
import { DetailDropDown } from '../../form/Form'
import TargetEntry from './TargetEntry'
import './TargetEnvEntry.scss'

/**
 * Renders a list of target environments to apply effects to.
 */
export default function TargetEnvEntry({
  action,
  effect,
  targetEnvironments,
  handleChange,
}: TTargetEnvEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- COMPUTED -- */
  /**
   * Boolean to determine if the effect is new.
   */
  const isNewEffect: boolean = compute(() => !action.effects.includes(effect))

  /* -- RENDER -- */

  if (!isNewEffect) {
    return (
      <div className='TargetEnvEntry Selected'>
        <div className='TargetEnvInfo'>
          <div className='Label'>Target Environment:</div>
          <div className='Value'>
            <span className='Text Disabled'>
              {effect.targetEnvironment.name}
            </span>
            <span className='Lock'>
              <Tooltip description='This is locked and cannot be changed.' />
            </span>
          </div>
        </div>
        <TargetEntry
          action={action}
          effect={effect}
          handleChange={handleChange}
        />
      </div>
    )
  } else {
    return (
      <div className='TargetEnvEntry Unselected'>
        <DetailDropDown<ClientTargetEnvironment>
          label='Target Environment'
          options={targetEnvironments}
          currentValue={effect.targetEnvironment}
          isExpanded={false}
          renderDisplayName={(targetEnv: ClientTargetEnvironment) =>
            targetEnv.name
          }
          deliverValue={(targetEnv: ClientTargetEnvironment) => {
            // Reset the target to the default value.
            effect.target = new ClientTarget(targetEnv)
            // Display the changes.
            forceUpdate()
          }}
        />
        <TargetEntry
          action={action}
          effect={effect}
          handleChange={handleChange}
        />
      </div>
    )
  }
}

/* ---------------------------- TYPES FOR TARGET ENVIRONMENTS ---------------------------- */

/**
 * Props for TargetEnvironments component.
 */
export type TTargetEnvEntry_P = {
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
   * Handles when a change is made that would require saving.
   */
  handleChange: () => void
}
