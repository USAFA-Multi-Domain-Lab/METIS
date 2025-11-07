import type { ClientEffect } from '@client/missions/effects/ClientEffect'
import { compute } from '@client/toolbox'
import type { TTargetArg } from '@shared/target-environments/args/Arg'
import { useEffect, useState } from 'react'
import ArgMissionComponent from '../mission-component'
import './Arg.scss'
import ArgBoolean from './ArgBoolean'
import ArgDropdown from './ArgDropdown'
import ArgLargeString from './ArgLargeString'
import ArgNumber from './ArgNumber'
import ArgString from './ArgString'

export default function ({
  effect,
  arg,
  effectArgs,
  setEffectArgs,
}: TArg_P): TReactElement | null {
  /* -- STATE -- */
  const [initializeArg, setInitializeArg] = useState<boolean>(false)

  /* -- COMPUTED -- */

  /**
   * Determines if all the argument's dependencies have been met.
   */
  const allDependenciesMet: boolean = compute(() =>
    effect.allDependenciesMet(arg.dependencies, effectArgs),
  )

  /* -- EFFECTS -- */

  // Update the effect's arguments based on the status of
  // the argument's dependencies.
  useEffect(() => {
    // If all the dependencies have been met and the argument is
    // not in the effect's arguments then initialize the argument.
    if (allDependenciesMet && effectArgs[arg._id] === undefined) {
      setInitializeArg(true)
    }
    // Otherwise, remove the argument from the effect's arguments.
    else if (!allDependenciesMet && effectArgs[arg._id] !== undefined) {
      setEffectArgs((prev) => {
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
        <div className={`Arg Dropdown`}>
          <ArgDropdown
            effect={effect}
            arg={arg}
            initialize={initializeArg}
            effectArgs={effectArgs}
            setEffectArgs={setEffectArgs}
          />
        </div>
      )
    case 'number':
      return (
        <div className={`Arg Number`}>
          <ArgNumber
            arg={arg}
            initialize={initializeArg}
            effectArgs={effectArgs}
            setEffectArgs={setEffectArgs}
          />
        </div>
      )
    case 'string':
      return (
        <div className={`Arg String`}>
          <ArgString
            arg={arg}
            initialize={initializeArg}
            effectArgs={effectArgs}
            setEffectArgs={setEffectArgs}
          />
        </div>
      )
    case 'large-string':
      return (
        <div className={`Arg LargeString`}>
          <ArgLargeString
            arg={arg}
            initialize={initializeArg}
            effectArgs={effectArgs}
            setEffectArgs={setEffectArgs}
          />
        </div>
      )
    case 'boolean':
      return (
        <div className={`Arg Boolean`}>
          <ArgBoolean
            arg={arg}
            initialize={initializeArg}
            effectArgs={effectArgs}
            setEffectArgs={setEffectArgs}
          />
        </div>
      )
    case 'force':
    case 'node':
    case 'action':
    case 'file':
      return (
        <ArgMissionComponent
          effect={effect}
          arg={arg}
          initialize={initializeArg}
          effectArgs={effectArgs}
          setEffectArgs={setEffectArgs}
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
export type TArg_P = {
  /**
   * The effect that the arguments belong to.
   */
  effect: ClientEffect
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
  setEffectArgs: TReactSetter<ClientEffect['args']>
}
