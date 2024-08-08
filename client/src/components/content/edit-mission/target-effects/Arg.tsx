import { useEffect, useState } from 'react'
import { ClientEffect } from 'src/missions/effects'
import { compute } from 'src/toolbox'
import { ReactSetter } from 'src/toolbox/types'
import { TTargetArg } from '../../../../../../shared/target-environments/args'
import { TDependencyConditionResult } from '../../../../../../shared/target-environments/dependencies'
import './Arg.scss'
import ArgBoolean from './ArgBoolean'
import ArgDropdown from './ArgDropdown'
import ArgForce from './ArgForce'
import ArgLargeString from './ArgLargeString'
import ArgNode from './ArgNode'
import ArgNumber from './ArgNumber'
import ArgString from './ArgString'

export default function Arg({
  effect,
  effect: { mission },
  target,
  arg,
  effectArgs,
  setEffectArgs,
}: TArg_P): JSX.Element | null {
  /* -- STATE -- */
  const [initializeArg, setInitializeArg] = useState<boolean>(false)

  /* -- COMPUTED -- */

  /**
   * Determines if all the argument's dependencies have been met.
   */
  const allDependenciesMet: TDependencyConditionResult = compute(
    () =>
      target?.allDependenciesMet(effectArgs, arg.dependencies, mission) ??
      'invalid',
  )
  /**
   * Determines if the argument should be displayed based on the
   * status of the argument's dependencies.
   */
  const displayArg: boolean = compute(() => allDependenciesMet !== 'invalid')

  /* -- EFFECTS -- */

  // Update the effect's arguments based on the status of
  // the argument's dependencies.
  useEffect(() => {
    // If all the dependencies have been met and the argument is
    // not in the effect's arguments then initialize the argument.
    if (allDependenciesMet === 'valid' && effectArgs[arg._id] === undefined) {
      setInitializeArg(true)
    }
    // Otherwise, remove the argument from the effect's arguments.
    else if (
      allDependenciesMet === 'invalid' &&
      effectArgs[arg._id] !== undefined
    ) {
      setEffectArgs((prev) => {
        delete prev[arg._id]
        return prev
      })
    }
  }, [allDependenciesMet])

  /* -- RENDER -- */

  // If the argument type is "dropdown" then render
  // the dropdown.
  if (arg.type === 'dropdown' && displayArg) {
    return (
      <div className={`Arg Dropdown`}>
        <ArgDropdown
          effect={effect}
          target={target}
          arg={arg}
          initialize={initializeArg}
          effectArgs={effectArgs}
          setEffectArgs={setEffectArgs}
          key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}`}
        />
      </div>
    )
  }
  // If the argument type is "number" then render
  // the number input.
  else if (arg.type === 'number' && displayArg) {
    return (
      <div className={`Arg Number`}>
        <ArgNumber
          arg={arg}
          initialize={initializeArg}
          effectArgs={effectArgs}
          setEffectArgs={setEffectArgs}
          key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}`}
        />
      </div>
    )
  }
  // If the argument type is "string" then render
  // the string input.
  else if (arg.type === 'string' && displayArg) {
    return (
      <div className={`Arg String`}>
        <ArgString
          arg={arg}
          initialize={initializeArg}
          effectArgs={effectArgs}
          setEffectArgs={setEffectArgs}
          key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}`}
        />
      </div>
    )
  }
  // If the argument type is "large-string" then render
  // the large-string input.
  else if (arg.type === 'large-string' && displayArg) {
    return (
      <div className={`Arg LargeString`}>
        <ArgLargeString
          arg={arg}
          initialize={initializeArg}
          effectArgs={effectArgs}
          setEffectArgs={setEffectArgs}
          key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}`}
        />
      </div>
    )
  }
  // If the argument type is "boolean" then render
  // the boolean toggle.
  else if (arg.type === 'boolean' && displayArg) {
    return (
      <div className={`Arg Boolean`}>
        <ArgBoolean
          arg={arg}
          initialize={initializeArg}
          effectArgs={effectArgs}
          setEffectArgs={setEffectArgs}
          key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}`}
        />
      </div>
    )
  }
  // If the argument type is "force" then render
  // the force dropdown.
  else if (arg.type === 'force' && displayArg) {
    return (
      <div className={`Arg Force`}>
        <ArgForce
          effect={effect}
          arg={arg}
          initialize={initializeArg}
          effectArgs={effectArgs}
          setEffectArgs={setEffectArgs}
          key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}`}
        />
      </div>
    )
  }
  // If the argument type is "node" then render
  // dropdowns for forces and nodes.
  else if (arg.type === 'node' && displayArg) {
    return (
      <div className={`Arg Node`}>
        <ArgNode
          effect={effect}
          arg={arg}
          initialize={initializeArg}
          effectArgs={effectArgs}
          setEffectArgs={setEffectArgs}
          key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}`}
        />
      </div>
    )
  } else {
    return null
  }
}

/* ---------------------------- TYPES FOR ARG ---------------------------- */

/**
 * The props for the `Arg` component.
 */
export type TArg_P = {
  /**
   * The effect that the arguments belong to.
   */
  effect: ClientEffect
  /**
   * The effect's target.
   */
  target: ClientEffect['target']
  /**
   * The argument to render.
   */
  arg: TTargetArg
  /**
   * The arguments that the effect uses to modify the target.
   */
  effectArgs: ClientEffect['args']
  /**
   * Function that updates the value of the effect's arguments
   * stored in the state.
   */
  setEffectArgs: ReactSetter<ClientEffect['args']>
}
