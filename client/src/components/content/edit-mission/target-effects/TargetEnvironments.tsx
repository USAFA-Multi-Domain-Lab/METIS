import Tooltip from '../../communication/Tooltip'
import './TargetEnvironments.scss'
import { ClientTargetEnvironment } from 'src/target-environments'
import Targets from './Targets'
import { ClientEffect } from 'src/missions/effects'
import { compute } from 'src/toolbox'
import { useGlobalContext } from 'src/context'
import {
  MiniButtonSVG,
  EMiniButtonSVGPurpose,
} from '../../user-controls/MiniButtonSVG'
import ClientMissionAction from 'src/missions/actions'

/**
 * List of target environments to apply effects to.
 */
export default function TargetEnvironments(
  props: TTargetEnvironment,
): JSX.Element | null {
  /* -- PROPS -- */
  const { action, effect, targetEnvironments } = props

  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- COMPUTED -- */
  /**
   * The selected target environment.
   */
  const selectedTargetEnv: ClientTargetEnvironment | null = compute(() => {
    return effect.selectedTargetEnv
  })

  /* -- FUNCTIONS -- */
  /**
   * Handle editing the target environment.
   */
  const handleEdit = () => {
    // Clear the selected target environment.
    effect.selectedTargetEnv = null
    // If there is a selected target, clear it.
    if (effect.selectedTarget !== null) {
      effect.selectedTarget = null
    }
    // Display the changes.
    forceUpdate()
  }

  /* -- RENDER -- */
  if (selectedTargetEnv === null) {
    return (
      <div className='TargetEnvironments'>
        <p className='ListTitle'>Select a Target Environment:</p>
        <div className='TargetEnvironmentList'>
          {targetEnvironments.map((targetEnvironment: any) => {
            return (
              <div
                className='TargetEnvironment'
                key={`target-environment-${targetEnvironment.id}`}
                onClick={() => {
                  effect.selectedTargetEnv = targetEnvironment
                  forceUpdate()
                }}
              >
                {targetEnvironment.name}
                <Tooltip description={targetEnvironment.description} />
              </div>
            )
          })}
        </div>
      </div>
    )
  } else if (
    selectedTargetEnv !== null &&
    selectedTargetEnv instanceof ClientTargetEnvironment
  ) {
    return (
      <>
        <div className='TargetEnvironments Selected'>
          <div className='TargetEnvironmentContainer'>
            <div className='TargetEnvironment Selected'>
              Target Environment: {selectedTargetEnv.name}
            </div>
            <MiniButtonSVG
              purpose={EMiniButtonSVGPurpose.Edit}
              uniqueClassName='EditButton'
              handleClick={handleEdit}
              tooltipDescription={`Change the target environment.`}
            />
          </div>
        </div>
        <Targets
          action={action}
          effect={effect}
          targets={selectedTargetEnv.targets}
        />
      </>
    )
  } else {
    return null
  }
}

/**
 * Props for TargetEnvironments component.
 */
export type TTargetEnvironment = {
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
}
