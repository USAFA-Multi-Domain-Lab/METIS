import { useGlobalContext } from 'src/context'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
import { DetailDropDown } from '../../form/Form'
import Args from './Args'
import './TargetEntry.scss'

/**
 * Renders a list of targets to apply effects to.
 */
export default function TargetEntry({
  action,
  effect,
  selectedTargetEnv,
  selectedTarget,
  targets,
  setSelectedTarget,
}: TTargetEntry_P) {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- RENDER -- */
  if (targets.length > 0 && selectedTargetEnv) {
    return (
      <div className='TargetEntry'>
        <DetailDropDown<ClientTarget>
          label='Target'
          options={targets}
          currentValue={selectedTarget}
          isExpanded={false}
          renderDisplayName={(target: ClientTarget) => {
            return target.name
          }}
          deliverValue={(target: ClientTarget) => {
            effect.target = target
            setSelectedTarget(target)
            forceUpdate()
          }}
        />
        <Args action={action} effect={effect} target={selectedTarget} />
      </div>
    )
  } else {
    return null
  }
}

/* ---------------------------- TYPES FOR TARGETS ---------------------------- */

/**
 * Props for Targets component.
 */
export type TTargetEntry_P = {
  /**
   * The action to execute.
   */
  action: ClientMissionAction
  /**
   * The effect to apply to the target.
   */
  effect: ClientEffect
  /**
   * The selected target environment.
   */
  selectedTargetEnv: ClientTargetEnvironment
  /**
   * The selected target.
   */
  selectedTarget: ClientTarget
  /**
   * List of targets to apply effects to.
   */
  targets: ClientTarget[]
  /**
   * A function that will set the selected target.
   */
  setSelectedTarget: (target: ClientTarget) => void
}
