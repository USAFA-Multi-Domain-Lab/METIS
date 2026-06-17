import type { ClientTargetArgument } from '@client/target-environments/arguments/ClientTargetArgument'
import { compute } from '@client/toolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { useEffect } from 'react'
import BooleanArgumentDetail from './BooleanArgumentDetail'
import DropdownArgumentDetail from './DropdownArgumentDetail'
import LargeStringArgumentDetail from './LargeStringArgumentDetail'
import MissionComponentTargetDetail from './MissionComponentArgumentDetail'
import NumberArgumentDetail from './NumberArgumentDetail'
import StringArgumentDetail from './StringArgumentDetail'
import './TargetArgumentDetail.scss'

/**
 * Renders the detail component for a target argument based on the
 * argument's parameter type.
 */
export default function TargetArgumentDetail({
  argument,
}: TTargetParameter_P): TReactElement | null {
  /* -- COMPUTED -- */

  /**
   * Determines if all the argument's dependencies have been met.
   */
  const allDependenciesMet = compute<boolean>(
    () => argument.dependenciesMet,
  )

  /**
   * The class name for the argument component.
   */
  const rootClasses = new ClassList(
    'TargetArgumentDetail',
    `TargetArgumentDetail_${StringToolbox.toCamelCase(argument.type)}`,
  )

  /* -- EFFECTS -- */

  // Trigger an update in the issue checkers whenever
  // the value of allDependenciesMet changes.
  useEffect(() => {
    argument.triggerIssueCheck('dependency-met-update')
  }, [allDependenciesMet])

  /* -- RENDER -- */

  // Return early if the argument is not ready for display.
  if (!allDependenciesMet) return null

  // Hide stale arguments whose stored type no longer matches the parameter.
  // A correctly-typed argument is added alongside in parseArguments.
  if (argument.parameter?.type !== argument.type) return null

  let internalDetailJsx = compute<TReactElement | null>(() => {
    switch (argument.type) {
      case 'dropdown':
        return <DropdownArgumentDetail argument={argument} />
      case 'number':
        return <NumberArgumentDetail argument={argument} />
      case 'string':
        return <StringArgumentDetail argument={argument} />
      case 'large-string':
        return <LargeStringArgumentDetail argument={argument} />
      case 'boolean':
        return <BooleanArgumentDetail argument={argument} />
      case 'mission-component':
        return <MissionComponentTargetDetail argument={argument} />
      default:
        return null
    }
  })
  return <div className={rootClasses.value}>{internalDetailJsx}</div>
}

/* ---------------------------- TYPES FOR ARG ---------------------------- */

/**
 * The props for {@link TargetArgumentDetail}.
 */
export type TTargetParameter_P = {
  /**
   * The target argument for which to render the detail component.
   */
  argument: ClientTargetArgument
}
