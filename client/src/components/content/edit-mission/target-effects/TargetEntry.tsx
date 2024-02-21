import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import ClientTarget from 'src/target-environments/targets'
import { compute } from 'src/toolbox'
import { DetailDropDown } from '../../form/Form'
import Args from './Args'
import './TargetEntry.scss'

/**
 * Renders a list of targets to apply effects to.
 */
export default function TargetEntry({
  action,
  effect,
  targets,
  isEmptyString,
  areDefaultValues,
  setSelectedEffect,
}: TTargetEntry_P) {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- STATE -- */
  const [isExpanded] = useState<boolean>(false)

  /* -- COMPUTED -- */
  /**
   * Set the selected target.
   */
  const selectedTarget: ClientTarget | null = compute(() => {
    return effect.selectedTarget
  })

  /* -- RENDER -- */
  if (targets.length > 0 && effect.selectedTargetEnv) {
    return (
      <div className='TargetEntry'>
        <DetailDropDown<ClientTarget>
          label='Target'
          options={targets}
          currentValue={selectedTarget}
          isExpanded={isExpanded}
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
            effect.selectedTarget = target
            forceUpdate()
          }}
        />
        <Args
          action={action}
          effect={effect}
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
   * A function that will set the selected effect.
   */
  setSelectedEffect: (effect: ClientEffect | null) => void
}
