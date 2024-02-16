import './Targets.scss'
import ClientTarget from 'src/target-environments/targets'
import Args from './Args'
import { ClientEffect } from 'src/missions/effects'
import { compute } from 'src/toolbox'
import { useGlobalContext } from 'src/context'
import ClientMissionAction from 'src/missions/actions'
import { DetailDropDown } from '../../form/Form'
import { useState } from 'react'

export default function Targets(props: TTarget) {
  /* -- PROPS -- */
  const { action, effect, targets, setClearForm } = props

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
  // todo: remove
  // if (selectedTarget === null) {
  if (targets.length > 0 && effect.selectedTargetEnv) {
    return (
      <div className='Targets'>
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
        <Args action={action} effect={effect} setClearForm={setClearForm} />
        {/* 
        // todo: remove
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
        </div> */}
      </div>
    )
  } else {
    return null
  }
  // todo: remove
  // } else if (
  //   selectedTarget !== null &&
  //   selectedTarget instanceof ClientTarget
  // ) {
  //   return (
  //     <>
  //       <div className='Targets Selected'>
  //         <div className='TargetContainer'>
  //           <div className='Target Selected'>Target: {selectedTarget.name}</div>
  //           <MiniButtonSVG
  //             purpose={EMiniButtonSVGPurpose.Edit}
  //             handleClick={() => {
  //               effect.selectedTarget = null
  //               forceUpdate()
  //             }}
  //             tooltipDescription={`Change the target for the effect.`}
  //           />
  //         </div>
  //       </div>
  //       <Args action={action} effect={effect} />
  //     </>
  //   )
  // } else {
  //   return null
  // }
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
  /**
   * Function to change the clear form value.
   */
  setClearForm: (value: boolean) => void
}
