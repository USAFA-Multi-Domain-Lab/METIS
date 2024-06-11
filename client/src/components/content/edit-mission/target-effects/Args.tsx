import { ClientExternalEffect } from 'src/missions/effects/external'
import { compute } from 'src/toolbox'
import { ReactSetter } from 'src/toolbox/types'
import { TTargetArg } from '../../../../../../shared/target-environments/targets'
import { SingleTypeObject } from '../../../../../../shared/toolbox/objects'
import ArgEntry from './ArgEntry'
import './Args.scss'

/**
 * Groups arguments together and renders them.
 */
export default function Args({
  target,
  effectArgs,
  setEffectArgs,
}: TArgs_P): JSX.Element | null {
  /* -- COMPUTED -- */
  /**
   * The selected target's arguments.
   */
  const args: TTargetArg[] | undefined = compute(() => {
    return target?.args
  })
  /**
   * The object to store the arguments in groupings.
   */
  const groupings: SingleTypeObject<TTargetArg[]> = compute(() => {
    // Create a default object to store the arguments in groupings.
    let groupings: SingleTypeObject<TTargetArg[]> = {}

    // If a target is selected and it has arguments
    // then group the arguments.
    if (args && args.length > 0) {
      // Iterate through the arguments.
      args.forEach((arg: TTargetArg) => {
        // If the argument has a grouping ID then
        // continue.
        if (arg.groupingId) {
          let groupingId: string = arg.groupingId

          // If there is no grouping array for the grouping
          // then create one.
          if (!(groupingId in groupings)) {
            // Create a new grouping array.
            groupings[groupingId] = []
          }

          // Add the argument to the grouping array.
          groupings[groupingId].push(arg)
        }
        // Otherwise, the argument is not a part of a
        // grouping so it will be displayed as an
        // individual argument.
        else {
          groupings[arg._id] = [arg]
        }
      })
    }

    return groupings
  })
  /**
   * The entries of the groupings object.
   */
  const groupingEntries: [string, TTargetArg[]][] = compute(() => {
    return Object.entries(groupings)
  })

  /* -- RENDER -- */
  // If the grouping entries are not empty
  // then render the arguments in groupings.
  if (groupingEntries.length > 0) {
    return (
      <div className='Args'>
        <div className='ArgsTitle'>Modifications:</div>

        {/* -- GROUPINGS -- */}
        {groupingEntries.map(([groupingId, grouping]) => {
          /* -- COMPUTED -- */
          /**
           * Boolean to determine if at least one argument
           * in the grouping is displayed.
           */
          const oneGroupingIsDisplayed: boolean = compute(() => {
            // Set the default boolean to false.
            let oneGroupingIsDisplayed: boolean = false

            // Iterate through the grouping.
            grouping.forEach((arg: TTargetArg) => {
              // If the argument is displayed then set the
              // boolean to true.
              if (arg.display) {
                oneGroupingIsDisplayed = true
              }
            })

            return oneGroupingIsDisplayed
          })
          /**
           * Class name for the grouping.
           */
          const groupingClassName: string = compute(() => {
            // Create a default list of class names.
            let classList: string[] = ['Grouping']

            // If no arguments in the grouping are displayed
            // then hide the grouping.
            if (!oneGroupingIsDisplayed) {
              classList.push('Hidden')
            }

            return classList.join(' ')
          })

          /* -- RENDER -- */
          return (
            <div className={groupingClassName} key={`grouping-${groupingId}`}>
              {grouping.map((arg: TTargetArg) => {
                return (
                  <ArgEntry
                    target={target}
                    arg={arg}
                    effectArgs={effectArgs}
                    setEffectArgs={setEffectArgs}
                    key={`arg-${arg._id}-display-${arg.display}`}
                  />
                )
              })}
            </div>
          )
        })}
      </div>
    )
  } else {
    return null
  }
}

/* ---------------------------- TYPES FOR ARGS ---------------------------- */

/**
 * Props for Args component.
 */
export type TArgs_P = {
  /**
   * The effect's target.
   */
  target: ClientExternalEffect['target']
  /**
   * The arguments that the effect uses to modify the target.
   */
  effectArgs: ClientExternalEffect['args']
  /**
   * Function that updates the value of the effect's arguments
   * stored in the state.
   */
  setEffectArgs: ReactSetter<ClientExternalEffect['args']>
}
