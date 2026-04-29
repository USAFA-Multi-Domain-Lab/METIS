import type { ClientEffect } from '@client/missions/effects/ClientEffect'
import { compute } from '@client/toolbox'
import type { TTargetParameter } from '@shared/target-environments/parameters/TargetParameter'
import Divider from '../../../../content/form/Divider'
import './TargetParameterEntry.scss'
import TargetParameterGrouping from './TargetParameterGrouping'

/**
 * Entry fields for the effect's arguments.
 */
export default function TargetParameterEntry({
  effect,
  effect: { target },
  targetArguments,
  setTargetArguments,
}: TTargetParameterEntry_P): TReactElement | null {
  /* -- COMPUTED -- */
  /**
   * The selected target's arguments.
   */
  const parameters: TTargetParameter[] | undefined = compute(() => {
    return target?.parameters
  })

  /**
   * All of the arguments grouped together based on their grouping ID.
   */
  const groupings: Array<[string, TTargetParameter[]]> = compute(() => {
    // Create a default Map object to store the arguments in groupings.
    let map: Map<string, TTargetParameter[]> = new Map()

    // If a target is selected and it has arguments
    // then group the arguments.
    if (parameters && parameters.length > 0) {
      // Iterate through the arguments.
      parameters.forEach((arg: TTargetParameter) => {
        // If the argument has a grouping ID then
        // continue.
        if (arg.groupingId) {
          // Get the grouping ID.
          let groupingId: string = arg.groupingId

          // If the grouping ID is not in the map
          // then create a new array for the grouping.
          if (!map.has(groupingId)) {
            map.set(groupingId, [])
          }

          // Add the argument to the grouping.
          map.get(groupingId)?.push(arg)
        }
        // Otherwise, the argument is not a part of a
        // grouping so it will be displayed as an
        // individual argument.
        else {
          map.set(arg._id, [arg])
        }
      })
    }

    // Return the entries of the map.
    return Array.from(map)
  })

  /* -- RENDER -- */

  // If there are no groupings then return null.
  if (groupings.length === 0) return null

  return (
    <div className='ArgEntry'>
      <div className='Title'>Modifications</div>
      <Divider />
      {groupings.map(([groupingId, grouping]) => {
        return (
          <ArgGrouping
            effect={effect}
            grouping={grouping}
            targetArguments={targetArguments}
            setTargetArguments={setTargetArguments}
            key={`grouping-${groupingId}`}
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
