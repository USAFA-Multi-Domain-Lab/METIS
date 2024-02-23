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
  isEmptyString,
  areDefaultValues,
  targets,
  setSelectedTarget,
  setSelectedEffect,
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
          uniqueDropDownStyling={{}}
          uniqueOptionStyling={(target: ClientTarget) => {
            return {}
          }}
          renderOptionClassName={(target: ClientTarget) => {
            return ''
          }}
          renderDisplayName={(target: ClientTarget) => {
            return target.name
          }}
          deliverValue={(target: ClientTarget) => {
            effect.target = target
            setSelectedTarget(target)
            forceUpdate()
          }}
        />
        <Args
          action={action}
          effect={effect}
          target={selectedTarget}
          isEmptyString={isEmptyString}
          areDefaultValues={areDefaultValues}
          setSelectedEffect={setSelectedEffect}
        />
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
  selectedTargetEnv: ClientTargetEnvironment | null
  /**
   * The selected target.
   */
  selectedTarget: ClientTarget | null
  /**
   * A boolean that will determine if a field has been left empty.
   */
  isEmptyString: boolean
  /**
   * A boolean that will determine if a field has default values.
   */
  areDefaultValues: boolean
  /**
   * List of targets to apply effects to.
   */
  targets: ClientTarget[]
  /**
   * A function that will set the selected target.
   */
  setSelectedTarget: (target: ClientTarget | null) => void
  /**
   * A function that will set the selected effect.
   */
  setSelectedEffect: (effect: ClientEffect | null) => void
}
