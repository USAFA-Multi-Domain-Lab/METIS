import type { ClientEffect } from '@client/missions/effects/ClientEffect'
import { compute } from '@client/toolbox'
import type { TTargetParameter } from '@shared/target-environments/parameters/TargetParameter'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { useEffect, useState } from 'react'
import MissionComponentTargetDetail from '../mission-component'
import BooleanTargetDetail from './BooleanTargetDetail'
import DropdownTargetDetail from './DropdownTargetDetail'
import LargeStringTargetDetail from './LargeStringTargetDetail'
import MissionComponentTargetDetail2 from './MissionComponentTargetDetail'
import NumberTargetDetail from './NumberTargetDetail'
import StringTargetDetail from './StringTargetDetail'
import './TargetDetail.scss'

export default function TargetDetail({
  effect,
  parameter,
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
    effect.allDependenciesMet(parameter.dependencies, targetArguments),
  )

  /**
   * The class name for the argument component.
   */
  const className = compute<string>(() => {
    const classList = new ClassList('Arg').add(
      StringToolbox.toCamelCase(parameter.type),
    )

    return classList.value
  })

  /* -- EFFECTS -- */

  // Update the effect's arguments based on the status of
  // the argument's dependencies.
  useEffect(() => {
    // If all the dependencies have been met and the argument is
    // not in the effect's arguments then initialize the argument.
    if (allDependenciesMet && targetArguments[parameter._id] === undefined) {
      setInitializeArg(true)
    }
    // Otherwise, remove the argument from the effect's arguments.
    else if (
      !allDependenciesMet &&
      targetArguments[parameter._id] !== undefined
    ) {
      setTargetArguments((prev) => {
        delete prev[parameter._id]
        return prev
      })
    }
  }, [allDependenciesMet])

  /* -- RENDER -- */

  // If all dependencies are not met, don't
  // return anything.
  if (!allDependenciesMet) return null

  switch (parameter.type) {
    case 'dropdown':
      return (
        <div className={className}>
          <DropdownTargetDetail
            effect={effect}
            parameter={parameter}
            initialize={initializeArg}
            targetArguments={targetArguments}
            setTargetArguments={setTargetArguments}
          />
        </div>
      )
    case 'number':
      return (
        <div className={className}>
          <NumberTargetDetail
            parameter={parameter}
            initialize={initializeArg}
            targetArguments={targetArguments}
            setTargetArguments={setTargetArguments}
          />
        </div>
      )
    case 'string':
      return (
        <div className={className}>
          <StringTargetDetail
            parameter={parameter}
            initialize={initializeArg}
            targetArguments={targetArguments}
            setTargetArguments={setTargetArguments}
          />
        </div>
      )
    case 'large-string':
      return (
        <div className={className}>
          <LargeStringTargetDetail
            parameter={parameter}
            initialize={initializeArg}
            targetArguments={targetArguments}
            setTargetArguments={setTargetArguments}
          />
        </div>
      )
    case 'boolean':
      return (
        <div className={className}>
          <BooleanTargetDetail
            parameter={parameter}
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
        <MissionComponentTargetDetail
          effect={effect}
          arg={parameter}
          initialize={initializeArg}
          targetArguments={targetArguments}
          setTargetArguments={setTargetArguments}
        />
      )
    case 'mission-component':
      return (
        <MissionComponentTargetDetail2
          effect={effect}
          parameter={parameter}
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
   * The string parameter defining the requirements for the argument.
   */
  parameter: TTargetParameter
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
