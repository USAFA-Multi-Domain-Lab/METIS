import { ClientEffect } from 'src/missions/effects'
import { compute } from 'src/toolbox'
import { ReactSetter } from 'src/toolbox/types'
import { TTargetArg } from '../../../../../../shared/target-environments/args'
import './ArgEntry.scss'
import ArgGrouping from './ArgGrouping'

/**
 * Entry fields for the effect's arguments.
 */
export default function ArgEntry({
  effect,
  effect: { target },
  effectArgs,
  setEffectArgs,
}: TArgEntry_P): JSX.Element | null {
  /* -- COMPUTED -- */
  /**
   * The selected target's arguments.
   */
  const args: TTargetArg[] | undefined = compute(() => {
    return target?.args
  })

  /**
   * All of the arguments grouped together based on their grouping ID.
   */
  const groupings: Array<[string, TTargetArg[]]> = compute(() => {
    // Create a default Map object to store the arguments in groupings.
    let map: Map<string, TTargetArg[]> = new Map()

    // If a target is selected and it has arguments
    // then group the arguments.
    if (args && args.length > 0) {
      // Iterate through the arguments.
      args.forEach((arg: TTargetArg) => {
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

  if (groupings.length > 0) {
    return (
      <div className='ArgEntry'>
        <div className='Title'>Modifications</div>
        {groupings.map(([groupingId, grouping]) => {
          return (
            <ArgGrouping
              effect={effect}
              grouping={grouping}
              effectArgs={effectArgs}
              setEffectArgs={setEffectArgs}
              key={`grouping-${groupingId}`}
            />
          )
        })}
      </div>
    )
  } else {
    return null
  }
}

/* ---------------------------- TYPES FOR ARG ENTRY ---------------------------- */

/**
 * Props for `ArgEntry` component.
 */
type TArgEntry_P = {
  /**
   * The effect that the arguments belong to.
   */
  effect: ClientEffect
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
