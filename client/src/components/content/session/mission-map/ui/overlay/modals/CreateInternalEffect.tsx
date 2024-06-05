import { useState } from 'react'
import Tooltip from 'src/components/content/communication/Tooltip'
import { DetailDropDown } from 'src/components/content/form/DetailDropDown'
import { DetailLocked } from 'src/components/content/form/DetailLocked'
import { ButtonText } from 'src/components/content/user-controls/ButtonText'
import { useGlobalContext } from 'src/context'
import ClientMissionAction from 'src/missions/actions'
import { ClientInternalEffect } from 'src/missions/effects/internal'
import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import InternalEffect, {
  TInternalTarget,
} from '../../../../../../../../../shared/missions/effects/internal'
import './CreateInternalEffect.scss'

export default function CreateInternalEffect({
  effect,
  handleClose,
  handleChange,
}: TCreateInternalEffect_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- STATE -- */
  // const [force, setForce] = useState<ClientForce>(
  //   new ClientForce(),
  // )
  const [target, setTarget] = useState<TInternalTarget>(
    InternalEffect.DEFAULT_PROPERTIES.target,
  )
  const [targetNode, setTargetNode] = useState<ClientMissionNode>(
    new ClientMissionNode(effect.mission),
  )

  /* -- COMPUTED -- */
  // /**
  //  * List of forces in the mission.
  //  */
  // const forces: ClientForce[] = compute(() => effect.mission.forces)
  /**
   * The action to execute.
   */
  const action: ClientMissionAction = compute(() => effect.action)
  /**
   * The class name for the target drop down.
   */
  const targetClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = []

    // // Hide the drop down if the force is the default force.
    // if (force._id === ClientForce.DEFAULT_PROPERTIES._id) {
    //   classList.push('Hidden')
    // }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The class name for the create effect button.
   */
  const createEffectButtonClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = []

    // // Hide the button if the force is the default force.
    // if (force.name === ClientForce.DEFAULT_PROPERTIES.name) {
    //   classList.push('Hidden')
    // }

    // Disable the button if the target is the default target.
    if (target === InternalEffect.DEFAULT_PROPERTIES.target) {
      classList.push('Disabled')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })

  /* -- EFFECTS -- */

  // Sync the component state with the internal effect.
  usePostInitEffect(() => {
    effect.target = target

    if (effect.target.key === 'node') {
      effect.target.node = targetNode
    }
  }, [target, targetNode])

  // // Reset the target when the force changes.
  // usePostInitEffect(() => {
  //   setTarget(InternalEffect.DEFAULT_PROPERTIES.target)
  // }, [force])

  /* -- FUNCTIONS -- */
  /**
   * Handles creating a new internal effect.
   */
  const createEffect = () => {
    // Push the new internal effect to the action.
    action.internalEffects.push(effect)
    // Display the changes.
    forceUpdate()
    // Allow the user to save the changes.
    handleChange()
  }

  /* -- RENDER -- */

  return (
    <div className='CreateInternalEffect MapModal'>
      {/* -- TOP OF BOX -- */}
      <div className='Heading'>Create Internal Effect:</div>
      <div className='Close'>
        <div className='CloseButton' onClick={handleClose}>
          x
          <Tooltip description='Close window.' />
        </div>
      </div>

      {/* -- MAIN CONTENT -- */}
      <DetailLocked label='Target Environment' stateValue='METIS' />
      {/* <DetailDropDown<ClientForce>
        fieldType='required'
        label='Force'
        options={forces}
        stateValue={force}
        setState={setForce}
        isExpanded={false}
        renderDisplayName={(force: ClientForce) =>
          force.name
        }
      /> */}
      <DetailDropDown<TInternalTarget>
        fieldType='required'
        label='Target'
        options={InternalEffect.AVAILABLE_TARGETS}
        stateValue={target}
        setState={setTarget}
        isExpanded={false}
        renderDisplayName={(target: TInternalTarget) => target.name}
        uniqueClassName={targetClassName}
      />

      {target.key === 'node' ? (
        <DetailDropDown<ClientMissionNode>
          fieldType='required'
          label='Node'
          options={effect.mission.nodes}
          stateValue={targetNode}
          setState={setTargetNode}
          isExpanded={false}
          renderDisplayName={(node: ClientMissionNode) => node.name}
        />
      ) : null}

      {/* -- BUTTON(S) -- */}
      <ButtonText
        text='Create Internal Effect'
        onClick={createEffect}
        uniqueClassName={createEffectButtonClassName}
      />
    </div>
  )
}

/* ---------------------------- TYPES FOR CREATE INTERNAL EFFECT ---------------------------- */

/**
 * Props for CreateInternalEffect component.
 */
export type TCreateInternalEffect_P = {
  /**
   * The internal effect to create.
   */
  effect: ClientInternalEffect
  /**
   * A function that will close the modal.
   */
  handleClose: () => void
  /**
   * Handles when a change is made that would require saving.
   */
  handleChange: () => void
}
