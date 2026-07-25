import { ClientEffect } from '@client/missions/effects/ClientEffect'
import type { ClientTargetArgument } from '@client/target-environments/arguments/ClientTargetArgument'
import { compute } from '@client/toolbox'
import Divider from '../../../../content/form/Divider'
import TargetArgumentGrouping from './TargetArgumentGrouping'
import './TargetArgumentsSubentries.scss'

/**
 * Renders all respective subentries for the arguments of the
 * given effect.
 */
export default function TargetArgumentsSubentries({
  effect,
}: TTargetParameterEntry_P): TReactElement | null {
  /* -- COMPUTED -- */

  /**
   * All of the arguments grouped together based on their grouping ID.
   */
  const groupings: Array<[string, ClientTargetArgument[]]> = compute(() => {
    // Create a default Map object to store the arguments in groupings.
    let map: Map<string, ClientTargetArgument[]> = new Map()

    // Iterate through the arguments.
    effect.arguments.forEach((argument: ClientTargetArgument) => {
      let { parameter } = argument
      if (!parameter) return
      let { groupingId } = parameter

      // If the argument has a grouping ID then
      // continue.
      if (groupingId) {
        // If the grouping ID is not in the map
        // then create a new array for the grouping.
        if (!map.has(groupingId)) {
          map.set(groupingId, [])
        }
        // Add the argument to the grouping.
        map.get(groupingId)!.push(argument)
      }
      // Otherwise, the parameter is not a part of a
      // grouping so it will be displayed as an
      // individual parameter.
      else {
        map.set(argument._id, [argument])
      }
    })

    // Return the entries of the map.
    return Array.from(map)
  })

  let { mission } = effect
  let hasMissingTargetIssue = mission.issueRegistry.componentHasIssue(
    effect,
    ClientEffect.ISSUE_KEY_MISSING_TARGET,
  )
  let hasLegacyInferIssue = mission.issueRegistry.componentHasIssue(
    effect,
    ClientEffect.ISSUE_KEY_LEGACY_INFER,
  )
  let hasOutdatedIssue = mission.issueRegistry.componentHasIssue(
    effect,
    ClientEffect.ISSUE_KEY_OUTDATED,
  )
  let message = compute<string>(() => {
    if (hasMissingTargetIssue || hasLegacyInferIssue) {
      return `Arguments cannot be shown because the target cannot be found.`
    } else if (hasOutdatedIssue) {
      return `Arguments cannot be shown because the effect is outdated. Please update the effect to the latest version.`
    } else {
      return 'The effect has one or more issues that are preventing the arguments from being shown.'
    }
  })

  /* -- RENDER -- */

  // If there are no groupings and no issues then return null.
  if (groupings.length === 0 && !effect.targetArgumentsLocked) return null

  return (
    <div className='TargetArgumentSubentry'>
      <div className='Title'>Arguments</div>
      <Divider />
      {effect.targetArgumentsLocked ? (
        <div className='ArgumentIssueMessage'>{message}</div>
      ) : (
        groupings.map(([groupingId, grouping]) => {
          return (
            <TargetArgumentGrouping
              key={`grouping-${groupingId}`}
              grouping={grouping}
            />
          )
        })
      )}
    </div>
  )
}

/* ---------------------------- TYPES FOR ARG ENTRY ---------------------------- */

/**
 * Props for `ArgEntry` component.
 */
type TTargetParameterEntry_P = {
  /**
   * The effect that the arguments belong to.
   */
  effect: ClientEffect
}
