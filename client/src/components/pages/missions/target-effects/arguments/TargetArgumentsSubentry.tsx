import type { ClientEffect } from '@client/missions/effects/ClientEffect'
import type { ClientTargetArgument } from '@client/target-environments/arguments/ClientTargetArgument'
import { compute } from '@client/toolbox'
import Divider from '../../../../content/form/Divider'
import TargetArgumentGrouping from './TargetArgumentGrouping'
import './TargetArgumentsSubentry.scss'

/**
 * Entry fields for the effect's arguments.
 */
export default function TargetArgumentsEntry({
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

  /* -- RENDER -- */

  // If there are no groupings then return null.
  if (groupings.length === 0) return null

  return (
    <div className='TargetArgumentsSubentry'>
      <div className='Title'>Arguments</div>
      <Divider />
      {groupings.map(([groupingId, grouping]) => {
        return (
          <TargetArgumentGrouping
            key={`grouping-${groupingId}`}
            grouping={grouping}
          />
        )
      })}
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
