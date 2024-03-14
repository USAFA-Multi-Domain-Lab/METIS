import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
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
}: TTargetEnvEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- STATE -- */
  const [selectedTargetEnv, setSelectedTargetEnv] =
    useState<ClientTargetEnvironment>(
      effect.targetEnvironment.id ===
        ClientTargetEnvironment.DEFAULT_PROPERTIES.id
        ? new ClientTargetEnvironment()
        : effect.targetEnvironment,
    )
  const [selectedTarget, setSelectedTarget] = useState<ClientTarget>(
    effect.target.id === ClientTarget.DEFAULT_PROPERTIES.id
      ? new ClientTarget(selectedTargetEnv)
      : effect.target,
  )

  /* -- RENDER -- */

  return (
    <div className='TargetEnvEntry'>
      <DetailDropDown<ClientTargetEnvironment>
        label='Target Environment'
        options={targetEnvironments}
        currentValue={selectedTargetEnv}
        isExpanded={false}
        renderDisplayName={(targetEnvironment: ClientTargetEnvironment) => {
          return targetEnvironment.name
        }}
        deliverValue={(targetEnvironment: ClientTargetEnvironment) => {
          // Update the target environment stored in the state.
          setSelectedTargetEnv(targetEnvironment)
          // Reset the target stored in the state to the default value.
          setSelectedTarget(new ClientTarget(targetEnvironment))
          // Reset the target to the default value.
          effect.target = new ClientTarget(targetEnvironment)
          // Display the changes.
          forceUpdate()
        }}
      />
      <TargetEntry
        action={action}
        effect={effect}
        selectedTargetEnv={selectedTargetEnv}
        selectedTarget={selectedTarget}
        targets={selectedTargetEnv.targets}
        setSelectedTarget={setSelectedTarget}
      />
    </div>
  )
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
}
