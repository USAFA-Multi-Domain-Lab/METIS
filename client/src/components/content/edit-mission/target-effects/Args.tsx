import { useEffect, useState } from 'react'
import { ClientEffect } from 'src/missions/effects'
import { compute } from 'src/toolbox'
import { TTargetArg } from '../../../../../../shared/target-environments/targets'
import {
  AnyObject,
  SingleTypeObject,
} from '../../../../../../shared/toolbox/objects'
import ArgEntry from './ArgEntry'
import './Args.scss'

/**
 * Groups arguments together and renders them.
 */
export default function Args({
  effect,
  handleChange,
}: TArgs_P): JSX.Element | null {
  /* -- STATE -- */
  const [effectArgs, setEffectArgs] = useState<AnyObject>({})
  const [reqPropertiesNotFilledOut] = useState<string[]>([])
  const [argDependencies, setArgDependencies] = useState<string[]>([])

  /* -- COMPUTED -- */
  /**
   * The selected target's arguments.
   */
  const args: TTargetArg[] = compute(() => {
    return effect.target.args
  })
  /**
   * The object to store the arguments in groupings.
   */
  const groupings: SingleTypeObject<TTargetArg[]> = compute(() => {
    // Create a default object to store the arguments in groupings.
    let groupings: SingleTypeObject<TTargetArg[]> = {}

    // If a target is selected and it has arguments
    // then group the arguments.
    if (args.length > 0) {
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
          groupings[arg.id] = [arg]
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

  /* -- EFFECTS -- */
  // When the effect changes, update the
  // argument dependencies.
  useEffect(() => {
    setArgDependencies([])
  }, [effect])

  /* -- RENDER -- */
  // If the grouping entries are not empty
  // then render the arguments.
  if (groupingEntries.length > 0) {
    return (
      <div className='Args'>
        <div className='ArgsTitle'>Arguments:</div>

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
                    effect={effect}
                    arg={arg}
                    effectArgs={effectArgs}
                    reqPropertiesNotFilledOut={reqPropertiesNotFilledOut}
                    argDependencies={argDependencies}
                    handleChange={handleChange}
                    key={`arg-${arg.id}`}
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
   * The effect to apply to the target.
   */
  effect: ClientEffect
  /**
   * Handles when a change is made that would require saving.
   */
  handleChange: () => void
}
