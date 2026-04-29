import type { ClientEffect } from '@client/missions/effects/ClientEffect'
import { compute } from '@client/toolbox'
import type { TTargetParameter } from '@shared/target-environments/parameters/TargetParameter'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { useEffect, useState } from 'react'
import MissionComponentTargetParameter from '../mission-component'
import MissionComponentTargetParameter2 from '../mission-component/MissionComponentTargetParameter'
import './TargetParameter.scss'
import BooleanTargetParameter from './BooleanTargetParameter'
import DropdownTargetParameter from './DropdownTargetParameter'
import LargeStringTargetParameter from './LargeStringTargetParameter'
import NumberTargetParameter from './NumberTargetParameter'
import StringTargetParameter from './StringTargetParameter'

export default function TargetParameter({
  effect,
  arg,
  targetArguments,
  setTargetArguments,
}: TTargetParameter_P): TReactElement | null {
  /* -- STATE -- */
  const [initializeArg, setInitializeArg] = useState<boolean>(false)

  /* -- COMPUTED -- */

  /**
   * Determines if all the argument's dependencies have been met.
   */
  const allDependenciesMet = compute<boolean>(() =>
    effect.allDependenciesMet(arg.dependencies, targetArguments),
  )

  /**
   * The class name for the argument component.
   */
  const className = compute<string>(() => {
    const classList = new ClassList('Arg').add(
      StringToolbox.toCamelCase(arg.type),
    )

    return classList.value
  })

  /* -- EFFECTS -- */

  // Update the effect's arguments based on the status of
  // the argument's dependencies.
  useEffect(() => {
    // If all the dependencies have been met and the argument is
    // not in the effect's arguments then initialize the argument.
    if (allDependenciesMet && targetArguments[arg._id] === undefined) {
      setInitializeArg(true)
    }
    // Otherwise, remove the argument from the effect's arguments.
    else if (!allDependenciesMet && targetArguments[arg._id] !== undefined) {
      setTargetArguments((prev) => {
        delete prev[arg._id]
        return prev
      })
    }
  }, [allDependenciesMet])

  /* -- RENDER -- */

  // If all dependencies are not met, don't
  // return anything.
  if (!allDependenciesMet) return null

  switch (arg.type) {
    case 'dropdown':
      return (
        <div className={className}>
          <ArgDropdown
            effect={effect}
            arg={arg}
            initialize={initializeArg}
            targetArguments={targetArguments}
            setTargetArguments={setTargetArguments}
          />
        </div>
      )
    case 'number':
      return (
        <div className={className}>
          <ArgNumber
            arg={arg}
            initialize={initializeArg}
            targetArguments={targetArguments}
            setTargetArguments={setTargetArguments}
          />
        </div>
      )
    case 'string':
      return (
        <div className={className}>
          <ArgString
            arg={arg}
            initialize={initializeArg}
            targetArguments={targetArguments}
            setTargetArguments={setTargetArguments}
          />
        </div>
      )
    case 'large-string':
      return (
        <div className={className}>
          <ArgLargeString
            arg={arg}
            initialize={initializeArg}
            targetArguments={targetArguments}
            setTargetArguments={setTargetArguments}
          />
        </div>
      )
    case 'boolean':
      return (
        <div className={className}>
          <ArgBoolean
            arg={arg}
            initialize={initializeArg}
            targetArguments={targetArguments}
            setTargetArguments={setTargetArguments}
          />
        </div>
      )
    case 'force':
    case 'pool':
    case 'node':
    case 'action':
    case 'file':
    case 'resource':
      return (
        <MissionComponentTargetParameter
          effect={effect}
          arg={arg}
          initialize={initializeArg}
          targetArguments={targetArguments}
          setTargetArguments={setTargetArguments}
        />
      )
    case 'mission-component':
      return (
        <MissionComponentTargetParameter2
          effect={effect}
          arg={arg}
          initialize={initializeArg}
          targetArguments={targetArguments}
          setTargetArguments={setTargetArguments}
        />
      )
    default:
      return null
  }
}

/* ---------------------------- TYPES FOR ARG ---------------------------- */

/**
 * The props for the `Arg` component.
 */
export type TTargetParameter_P = {
  /**
   * The effect that the arguments belong to.
   */
  effect: ClientEffect
  /**
   * The argument to render.
   */
  arg: TTargetParameter
  /**
   * The arguments that the effect uses to modify the target.
   */
  targetArguments: ClientEffect['arguments']
  /**
   * Function that updates the value of the effect's arguments
   * stored in the state.
   */
  setTargetArguments: TReactSetter<ClientEffect['arguments']>
}
