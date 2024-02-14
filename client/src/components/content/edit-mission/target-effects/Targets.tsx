import Tooltip from '../../communication/Tooltip'
import './Targets.scss'
import ClientTarget from 'src/target-environments/targets'
import Args from './Args'
import { ClientEffect } from 'src/missions/effects'
import { compute } from 'src/toolbox'
import { useGlobalContext } from 'src/context'
import {
  EMiniButtonSVGPurpose,
  MiniButtonSVG,
} from '../../user-controls/MiniButtonSVG'
import ClientMissionAction from 'src/missions/actions'

export default function Targets(props: TTarget) {
  /* -- PROPS -- */
  const { action, effect, targets } = props

  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- COMPUTED -- */
  /**
   * Set the selected target.
   */
  const selectedTarget: ClientTarget | null = compute(() => {
    return effect.selectedTarget
  })

  /* -- RENDER -- */
  if (selectedTarget === null) {
    return (
      <div className='Targets'>
        <p className='ListTitle'>Select a Target:</p>
        <div className='TargetList'>
          {targets.map((target: ClientTarget) => {
            return (
              <div
                className='Target'
                onClick={() => {
                  effect.selectedTarget = target
                  forceUpdate()
                }}
                key={`target-${target.id}`}
              >
                {target.name}
                <Tooltip description={target.description} />
              </div>
            )
          })}
        </div>
      </div>
    )
  } else if (
    selectedTarget !== null &&
    selectedTarget instanceof ClientTarget
  ) {
    return (
      <>
        <div className='Targets Selected'>
          <div className='TargetContainer'>
            <div className='Target Selected'>Target: {selectedTarget.name}</div>
            <MiniButtonSVG
              purpose={EMiniButtonSVGPurpose.Edit}
              handleClick={() => {
                effect.selectedTarget = null
                forceUpdate()
              }}
              tooltipDescription={`Change the target for the effect.`}
            />
          </div>
        </div>
        <Args action={action} effect={effect} />
      </>
    )
  } else {
    return null
  }
}

/**
 * Props for Targets component.
 */
export type TTarget = {
  /**
   * The action to execute.
   */
  action: ClientMissionAction
  /**
   * The effect to apply to the target.
   */
  effect: ClientEffect
  /**
   * List of targets to apply effects to.
   */
  targets: ClientTarget[]
}
