import { useGlobalContext } from 'src/context'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import ClientTarget from 'src/target-environments/targets'
import { compute } from 'src/toolbox'
import Tooltip from '../../communication/Tooltip'
import { DetailDropDown } from '../../form/Form'
import Args from './Args'
import './TargetEntry.scss'

/**
 * Renders a list of targets to apply effects to.
 */
export default function TargetEntry({
  action,
  effect,
  handleChange,
}: TTargetEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- COMPUTED -- */
  /**
   * The list of targets within the target environment.
   */
  const targets: ClientTarget[] = compute(
    () => effect.targetEnvironment.targets,
  )
  /**
   * Boolean to determine if the effect is new.
   */
  const isNewEffect: boolean = compute(() => !action.effects.includes(effect))

  /* -- RENDER -- */
  if (!isNewEffect) {
    return (
      <div className='TargetEntry Selected'>
        <div className='TargetInfo'>
          <div className='Label'>Target:</div>
          <div className='Value'>
            <span className='Text Disabled'>{effect.target.name}</span>
            <span className='Lock'>
              <Tooltip description='This is locked and cannot be changed.' />
            </span>
          </div>
        </div>
        <Args effect={effect} handleChange={handleChange} />
      </div>
    )
  } else if (isNewEffect && targets.length > 0) {
    return (
      <div className='TargetEntry Unselected'>
        <DetailDropDown<ClientTarget>
          label='Target'
          options={targets}
          currentValue={effect.target}
          isExpanded={false}
          renderDisplayName={(target: ClientTarget) => target.name}
          deliverValue={(target: ClientTarget) => {
            effect.target = target
            forceUpdate()
          }}
        />
      </div>
    )
  }
  {
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
   * Handles when a change is made that would require saving.
   */
  handleChange: () => void
}
