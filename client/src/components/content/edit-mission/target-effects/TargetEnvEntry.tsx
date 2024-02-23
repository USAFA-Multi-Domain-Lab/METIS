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
  isEmptyString,
  areDefaultValues,
  setSelectedEffect,
}: TTargetEnvEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- STATE -- */
  const [selectedTargetEnv, setSelectedTargetEnv] =
    useState<ClientTargetEnvironment | null>(
      effect.target ? effect.target.targetEnvironment : null,
    )
  const [selectedTarget, setSelectedTarget] = useState<ClientTarget | null>(
    effect.target ? effect.target : null,
  )

  /* -- RENDER -- */

  return (
    <div className='TargetEnvEntry'>
      <DetailDropDown<ClientTargetEnvironment>
        label='Target Environment'
        options={targetEnvironments}
        currentValue={selectedTargetEnv}
        isExpanded={false}
        uniqueDropDownStyling={{}}
        uniqueOptionStyling={(targetEnvironment: ClientTargetEnvironment) => {
          return {}
        }}
        renderOptionClassName={(targetEnvironment: ClientTargetEnvironment) => {
          return 'TargetEnvironment'
        }}
        renderDisplayName={(targetEnvironment: ClientTargetEnvironment) => {
          return targetEnvironment.name
        }}
        deliverValue={(targetEnvironment: ClientTargetEnvironment) => {
          setSelectedTargetEnv(targetEnvironment)
          setSelectedTarget(null)
          effect.target = undefined
          forceUpdate()
        }}
      />
      <TargetEntry
        action={action}
        effect={effect}
        selectedTargetEnv={selectedTargetEnv}
        selectedTarget={selectedTarget}
        targets={selectedTargetEnv?.targets ?? []}
        isEmptyString={isEmptyString}
        areDefaultValues={areDefaultValues}
        setSelectedTarget={setSelectedTarget}
        setSelectedEffect={setSelectedEffect}
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
  /**
   * A boolean that will determine if a field has been left empty.
   */
  isEmptyString: boolean
  /**
   * A boolean that will determine if a field has default values.
   */
  areDefaultValues: boolean
  /**
   * A function that will set the selected effect.
   */
  setSelectedEffect: (effect: ClientEffect | null) => void
}
