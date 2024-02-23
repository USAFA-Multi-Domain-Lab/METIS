import { useState } from 'react'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import ClientTarget from 'src/target-environments/targets'
import { compute } from 'src/toolbox'
import { TTargetArg } from '../../../../../../shared/target-environments/targets'
import { SingleTypeObject } from '../../../../../../shared/toolbox/objects'
import ArgEntry from './ArgEntry'
import './Args.scss'

/**
 * Groups arguments together and renders them.
 */
export default function Args({
  action,
  effect,
  target,
  isEmptyString,
  areDefaultValues,
  setSelectedEffect,
}: TArgs_P): JSX.Element | null {
  /* -- STATE -- */
  const [reqPropertiesNotFilledOut] = useState<string[]>([])

  /* -- COMPUTED -- */
  /**
   * The selected target's arguments.
   */
  const args: TTargetArg[] = compute(() => {
    return target?.args || []
  })
  /**
   * The object to store the arguments in groupings.
   */
  const groupings: SingleTypeObject<TTargetArg[]> = compute(() => {
    // Create a default object to store the arguments in groupings.
    let groupings: SingleTypeObject<TTargetArg[]> = {}

    // If a target is selected and it has arguments
    // then group the arguments.
    if (target && args.length > 0) {
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
  /**
   * Class name for the save button.
   */
  const CreateButtonClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['Button']

    // If the effect is not new then hide the save button.
    if (action.effects.includes(effect)) {
      classList = ['Button', 'Hidden']
    }

    // If there are required properties not filled out ||
    // If there is an empty field ||
    // If there are default values...
    // then disable the save button.
    if (
      reqPropertiesNotFilledOut.length > 0 ||
      isEmptyString ||
      areDefaultValues
    ) {
      // Disable the save button.
      classList = ['Button', 'Disabled']
    }

    // Iterate through the selected target's arguments.
    args.forEach((arg: TTargetArg) => {
      // If the argument is required and it is not filled out
      // then disable the save button.
      if (arg.required && reqPropertiesNotFilledOut.includes(arg.id)) {
        // classList = ['Button', 'Disabled']
      }
    })

    return classList.join(' ')
  })

  /* -- FUNCTIONS -- */

  /**
   * Handles the submission of the effect.
   */
  const createEffect = () => {
    // // Grab the entries of the effect's arguments.
    // let argEntries: [string, any][] = Object.entries(effectArgs)
    // // Filter out the arguments that are not filled out.
    // // Only the arguments that are filled out will be executed.
    // argEntries.forEach(([key, value]) => {
    //   // If the value is not undefined, null, or the default value
    //   // then add the argument to the effect's arguments.
    //   if (
    //     value !== undefined &&
    //     value !== null &&
    //     value !== defaultDropDownValue &&
    //     value !== defaultNumberValue &&
    //     value !== defaultStringValue &&
    //     value !== defaultBooleanValue
    //   )
    //     effect.args[key] = value
    // })

    // todo: remove
    // // Execute the effect.
    // effect.target.script(effect.args)

    // if (!action.effects.includes(effect)) {
    // Add the effect to the action's effects list.
    action.effects.push(effect)
    // handleChange()
    // }

    // Set the selected effect to null.
    setSelectedEffect(null)
  }

  /* -- RENDER -- */
  // If a target is selected and it has arguments
  // then render the arguments.
  if (groupingEntries.length > 0 && target) {
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
                    action={action}
                    effect={effect}
                    args={args}
                    arg={arg}
                    reqPropertiesNotFilledOut={reqPropertiesNotFilledOut}
                    key={arg.id}
                  />
                )
              })}
            </div>
          )
        })}

        {/* -- BUTTONS -- */}
        <div className='ButtonContainer'>
          <div className={CreateButtonClassName} onClick={createEffect}>
            Create Effect
          </div>
        </div>
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
   * The action to execute.
   */
  action: ClientMissionAction
  /**
   * The effect to apply to the target.
   */
  effect: ClientEffect
  /**
   * The selected target.
   */
  target: ClientTarget | null
  /**
   * A boolean that will determine if a field has been left empty.
   */
  isEmptyString: boolean
  /**
   * A boolean that will determine if a field has default values.
   */
  areDefaultValues: boolean
  /**
   * A function that will set the selected effect.
   */
  setSelectedEffect: (effect: ClientEffect | null) => void
}
