import { useEffect, useState } from 'react'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import ClientTarget from 'src/target-environments/targets'
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
  action,
  effect,
  target,
  isEmptyString,
  areDefaultValues,
  setSelectedEffect,
  handleChange,
}: TArgs_P): JSX.Element | null {
  /* -- STATE -- */
  const [effectArgs] = useState<AnyObject>({})
  const [reqPropertiesNotFilledOut] = useState<string[]>([])
  const [argDependencies, setArgDependencies] = useState<string[]>([])

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
  const createButtonClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['Button']

    // If the effect is not new then hide the save button.
    if (action.effects.includes(effect)) {
      classList = ['Button', 'Hidden']
    } else {
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
    }

    return classList.join(' ')
  })

  /* -- EFFECTS -- */
  // When the effect or target changes, update the
  // argument dependencies.
  useEffect(() => {
    setArgDependencies([])
  }, [effect, target])

  /* -- FUNCTIONS -- */

  /**
   * Handles creating the effect.
   */
  const createEffect = () => {
    // Add the effect to the action.
    action.effects.push(effect)
    // Handle the update to the mission.
    handleChange()
    // Set the selected effect to null.
    setSelectedEffect(null)
  }

  /* -- RENDER -- */
  // If the grouping entries are not empty and a target
  // is selected then render the arguments.
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
                    effectArgs={effectArgs}
                    reqPropertiesNotFilledOut={reqPropertiesNotFilledOut}
                    argDependencies={argDependencies}
                    key={arg.id}
                  />
                )
              })}
            </div>
          )
        })}

        {/* -- BUTTONS -- */}
        <div className='ButtonContainer'>
          <div className={createButtonClassName} onClick={createEffect}>
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
  /**
   * A function that will be called when a change has been made.
   */
  handleChange: () => void
}
