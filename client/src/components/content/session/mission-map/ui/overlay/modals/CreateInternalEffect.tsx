import { useState } from 'react'
import Tooltip from 'src/components/content/communication/Tooltip'
import { DetailDropDown } from 'src/components/content/form/DetailDropDown'
import { DetailLocked } from 'src/components/content/form/DetailLocked'
import { ButtonText } from 'src/components/content/user-controls/ButtonText'
import { useGlobalContext } from 'src/context'
import ClientMissionAction from 'src/missions/actions'
import { ClientInternalEffect } from 'src/missions/effects/internal'
import ClientMissionForce from 'src/missions/forces'
import ClientMissionNode from 'src/missions/nodes'
import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import './CreateInternalEffect.scss'

/**
 * Prompt modal for creating an internal effect to apply to a target.
 */
export default function CreateInternalEffect({
  effect,
  handleClose,
  handleChange,
}: TCreateInternalEffect_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const globalContext = useGlobalContext()
  const [internalTargetEnvironment] = globalContext.internalTargetEnvironment
  const { forceUpdate } = globalContext.actions

  /* -- STATE -- */
  const [force, setForce] = useState<ClientMissionForce>(
    new ClientMissionForce(effect.mission, {
      name: 'Select a force',
    }),
  )
  const [target, setTarget] = useState<ClientTarget>(
    new ClientTarget(new ClientTargetEnvironment()),
  )
  const [targetParams, setTargetParams] = useState<
    ClientMissionNode | ClientMissionForce
  >(
    // todo: Is referencing the root node correct? Change if not.
    new ClientMissionNode(effect.force, {
      structureKey: effect.mission.root._id,
      name: 'Select a node',
    }),
  )

  /* -- COMPUTED -- */
  /**
   * List of forces in the mission.
   */
  const forces: ClientMissionForce[] = compute(() => effect.mission.forces)
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

    // Hide the drop down if the force is the default force.
    if (force._id === ClientMissionForce.DEFAULT_PROPERTIES._id) {
      classList.push('Hidden')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The class name for the create effect button.
   */
  const createEffectButtonClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = []

    // Disable the button if the target is the default target.
    if (target.name === ClientTarget.DEFAULT_PROPERTIES.name) {
      classList.push('Disabled')
    }

    if (target._id === 'node' && targetParams.name === 'Select a node') {
      classList.push('Disabled')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })

  /* -- EFFECTS -- */

  // Sync the component state with the effect.
  usePostInitEffect(() => {
    effect.target = target
    effect.targetParams = targetParams
  }, [target, targetParams])

  // Reset the target when the force changes.
  usePostInitEffect(() => {
    setTarget(new ClientTarget(new ClientTargetEnvironment()))
  }, [force])

  /* -- FUNCTIONS -- */
  /**
   * Handles creating a new internal effect.
   */
  const createInternalEffect = () => {
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
      <DetailLocked
        label='Target Environment'
        stateValue={
          internalTargetEnvironment?.name ?? 'No target environment selected.'
        }
      />
      <DetailDropDown<ClientMissionForce>
        fieldType='required'
        label='Force'
        options={forces}
        stateValue={force}
        setState={setForce}
        isExpanded={false}
        renderDisplayName={(force: ClientMissionForce) => force.name}
      />
      <DetailDropDown<ClientTarget>
        fieldType='required'
        label='Target'
        options={internalTargetEnvironment?.targets ?? []}
        stateValue={target}
        setState={setTarget}
        isExpanded={false}
        renderDisplayName={(target: ClientTarget) => target.name}
        uniqueClassName={targetClassName}
      />
      {
        // If the target type is a node, display the node drop down.
        target._id === 'node' ? (
          <DetailDropDown<ClientInternalEffect['targetParams']>
            fieldType='required'
            label='Node'
            options={force.nodes}
            stateValue={targetParams}
            setState={setTargetParams}
            isExpanded={false}
            renderDisplayName={(node) => node.name}
          />
        ) : null
      }

      {/* -- BUTTON(S) -- */}
      <ButtonText
        text='Create Internal Effect'
        onClick={createInternalEffect}
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
