import { useEffect, useState } from 'react'
import {
  AnyObject,
  SingleTypeObject,
} from '../../../../../../shared/toolbox/objects'
import { v4 as generateHash } from 'uuid'
import './Args.scss'
import { ClientEffect } from 'src/missions/effects'
import { TTargetArg } from '../../../../../../shared/target-environments/targets'
import { compute } from 'src/toolbox'
import ClientTarget from 'src/target-environments/targets'
import { ClientTargetEnvironment } from 'src/target-environments'
import ArgGroupings from './ArgGroupings'
import ClientMissionAction from 'src/missions/actions'
import { useGlobalContext } from 'src/context'

export default function Args(props: TArgs): JSX.Element | null {
  /* -- PROPS -- */
  const { action, effect, setClearForm } = props

  /* -- GLOBAL CONTEXT -- */

  const { forceUpdate } = useGlobalContext().actions

  /* -- STATE -- */
  const [defaultDropDownValue] = useState<undefined>(undefined)
  const [defaultNumberValue] = useState<null>(null)
  const [defaultStringValue] = useState<string>('')
  const [defaultBooleanValue] = useState<boolean>(false)
  const [effectArgs] = useState<AnyObject>({})
  const [reqPropertiesNotFilledOut] = useState<string[]>([])
  const [dropDownKey, setDropDownKey] = useState<string>(generateHash())
  const [numberKey, setNumberKey] = useState<string>(generateHash())
  const [stringKey, setStringKey] = useState<string>(generateHash())
  const [mediumStringKey, setMediumStringKey] = useState<string>(generateHash())
  const [booleanKey, setBooleanKey] = useState<string>(generateHash())

  /* -- COMPUTED -- */
  /**
   * The selected target's arguments.
   */
  const args: TTargetArg[] = compute(() => {
    return effect.selectedTarget?.args || []
  })
  /**
   * The selected target.
   */
  const target: ClientTarget | null = compute(() => {
    return effect.selectedTarget
  })
  /**
   * The selected target environment.
   */
  const targetEnv: ClientTargetEnvironment | null = compute(() => {
    return effect.selectedTargetEnv
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
  const saveButtonClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['Button']

    // If there are required properties that are not filled out ||
    // If the effect has no arguments ||
    // If the selected target is null ||
    // If the target environment is null ||
    // If the selected target has no arguments
    // then disable the save button.
    if (
      reqPropertiesNotFilledOut.length > 0 ||
      target === null ||
      targetEnv === null ||
      args.length === 0
    ) {
      // Disable the save button.
      classList.push('Disabled')
    }

    // Iterate through the selected target's arguments.
    args.forEach((arg: TTargetArg) => {
      // If the argument is required and it is not filled out
      // then disable the save button.
      if (arg.required && reqPropertiesNotFilledOut.includes(arg.id)) {
        classList.push('Disabled')
      }
    })

    return classList.join(' ')
  })
  /**
   * Class name for the clear form button.
   */
  const clearFormButtonClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['Button']

    // If the selected target is null ||
    // If the target environment is null ||
    // If the selected target has no arguments
    // then disable the clear form button.
    if (target === null || targetEnv === null || args.length === 0) {
      // Disable the clear form button.
      classList.push('Disabled')
    }

    // If all of the arguments are default values then
    // disable the clear form button.
    if (
      args.every(
        (arg: TTargetArg) =>
          effectArgs[arg.id] === arg.default ||
          effectArgs[arg.id] === defaultDropDownValue ||
          effectArgs[arg.id] === defaultNumberValue ||
          effectArgs[arg.id] === defaultStringValue ||
          effectArgs[arg.id] === defaultBooleanValue,
      )
    ) {
      classList.push('Disabled')
    }

    // Return the class names as a single string.
    return classList.join(' ')
  })

  /* -- EFFECTS -- */
  useEffect(() => {
    if (effect.newEffect) {
      // Reset the arguments that are stored in the state component.
      resetArgProperties()
    }
  }, [effect])

  /* -- FUNCTIONS -- */

  /**
   * Recusive function that updates the argument's dependencies
   * depending on the argument's type and value.
   * @param arg The argument to update.
   * @param dependencies The list of dependencies.
   */
  const updateArgDependencies = (arg: TTargetArg, dependencies: string[]) => {
    // Iterate through the dependencies.
    dependencies.forEach((dependency: string) => {
      // Grab the selected target's arguments.
      let dependencyArg: TTargetArg | undefined = args.find(
        (arg: TTargetArg) => arg.id === dependency,
      )

      if (dependencyArg) {
        // If the argument is a dropdown then continue.
        if (arg.type === 'dropdown') {
          // If the argument's value equals a default value
          // or the argument's value doesn't exist then
          // hide the dependency argument.
          if (
            effectArgs[arg.id] === arg.default ||
            effectArgs[arg.id] === defaultDropDownValue ||
            effectArgs[arg.id] === undefined
          ) {
            // Hide the dependency argument.
            dependencyArg.display = false
          }
          // Otherwise, display the dependency argument.
          else {
            dependencyArg.display = true
          }
        }
        // If the argument is a number then continue.
        else if (arg.type === 'number') {
          // If the argument's value equals a default value
          // or the argument's value doesn't exist then
          // hide the dependency argument.
          if (
            effectArgs[arg.id] === arg.default ||
            effectArgs[arg.id] === defaultNumberValue ||
            effectArgs[arg.id] === undefined
          ) {
            dependencyArg.display = false
          }
          // Otherwise, display the dependency argument.
          else {
            dependencyArg.display = true
          }
        }
        // If the argument is a string then continue.
        else if (arg.type === 'string') {
          // If the argument's value equals a default value
          // or the argument's value doesn't exist then
          // hide the dependency argument.
          if (
            effectArgs[arg.id] === arg.default ||
            effectArgs[arg.id] === defaultStringValue ||
            effectArgs[arg.id] === undefined
          ) {
            dependencyArg.display = false
          }
          // Otherwise, display the dependency argument.
          else {
            dependencyArg.display = true
          }
        }
        // If the argument is a medium-string then continue.
        else if (arg.type === 'medium-string') {
          // If the argument's value equals a default value
          // or the argument's value doesn't exist then
          // hide the dependency argument.
          if (
            effectArgs[arg.id] === arg.default ||
            effectArgs[arg.id] === defaultStringValue ||
            effectArgs[arg.id] === undefined
          ) {
            dependencyArg.display = false
          }
          // Otherwise, display the dependency argument.
          else {
            dependencyArg.display = true
          }
        }
        // If the argument is a boolean then continue.
        else if (arg.type === 'boolean') {
          // If the argument's value equals a default value
          // or the argument's value doesn't exist then
          // hide the dependency argument.
          if (
            effectArgs[arg.id] === arg.default ||
            effectArgs[arg.id] === defaultBooleanValue ||
            effectArgs[arg.id] === undefined
          ) {
            dependencyArg.display = false
          }
          // Otherwise, display the dependency argument.
          else {
            dependencyArg.display = true
          }
        }

        if (dependencyArg.optionalParams?.dependencies) {
          // If the dependency argument has dependencies then
          // update the dependency argument's dependencies.
          updateArgDependencies(
            dependencyArg,
            dependencyArg.optionalParams.dependencies,
          )
        }
      }
    })
  }

  /**
   * Updates the argument's properties and its dependencies depending
   * on the argument's type and value.
   * @param arg The argument to update.
   */
  const updateArg = (arg: TTargetArg) => {
    if (reqPropertiesNotFilledOut.includes(arg.id)) {
      // Remove the argument ID from the list of
      // arguments that are not filled out.
      reqPropertiesNotFilledOut.splice(
        reqPropertiesNotFilledOut.indexOf(arg.id),
        1,
      )
    }

    // If the argument has dependencies then
    // the dependencies are now required.
    if (arg.optionalParams?.dependencies) {
      updateArgDependencies(arg, arg.optionalParams.dependencies)
    }
  }

  /**
   * Resets the arguments that are stored in the state component.
   */
  const resetEffectArgs = () => {
    // If the selected target has arguments then reset the arguments.
    if (args.length > 0) {
      // Iterate through the selected target's arguments.
      args.forEach((arg: TTargetArg) => {
        // If the argument is a dropdown then reset its
        // selected option to the default option.
        if (arg.type === 'dropdown') {
          effectArgs[arg.id] = arg.default || defaultDropDownValue
          effect.args[arg.id] = arg.default || defaultDropDownValue
        }
        // If the argument is a number then reset its
        // value to the default value.
        else if (arg.type === 'number') {
          effectArgs[arg.id] = arg.default || defaultNumberValue
          effect.args[arg.id] = arg.default || defaultNumberValue
        }
        // If the argument is a string then reset its
        // value to the default value.
        else if (arg.type === 'string') {
          effectArgs[arg.id] = arg.default || defaultStringValue
          effect.args[arg.id] = arg.default || defaultStringValue
        }
        // If the argument is a medium-string then reset its
        // value to the default value.
        else if (arg.type === 'medium-string') {
          effectArgs[arg.id] = arg.default || defaultStringValue
          effect.args[arg.id] = arg.default || defaultStringValue
        }
        // If the argument is a boolean then reset its
        // value to the default value.
        else if (arg.type === 'boolean') {
          effectArgs[arg.id] = arg.default || defaultBooleanValue
          effect.args[arg.id] = arg.default || defaultBooleanValue
        }

        // If the argument is required then add the argument
        // ID to the list of arguments that are not filled out.
        if (arg.required) {
          reqPropertiesNotFilledOut.push(arg.id)
        }
      })
    }
  }

  /**
   * Handles the creation of the effect.
   */
  const saveEffect = () => {
    // Grab the entries of the effect's arguments.
    let argEntries: [string, any][] = Object.entries(effectArgs)
    // Filter out the arguments that are not filled out.
    // Only the arguments that are filled out will be executed.
    argEntries.forEach(([key, value]) => {
      // If the value is not undefined, null, or the default value
      // then add the argument to the effect's arguments.
      if (
        value !== undefined &&
        value !== null &&
        value !== defaultDropDownValue &&
        value !== defaultNumberValue &&
        value !== defaultStringValue &&
        value !== defaultBooleanValue
      )
        effect.args[key] = value
    })

    // todo: remove
    // // Execute the effect.
    // effect.target.script(effect.args)

    // Add the effect to the action's effects list
    // if it is not already in the list.
    if (!action.effects.includes(effect)) {
      action.effects.push(effect)
      forceUpdate()
    }

    // Reset the arguments that are stored in the state component.
    resetArgProperties()
    // Reset the form.
    setClearForm(true)
  }

  /**
   * Handles clearing the form and resetting the arguments.
   */
  const resetArgProperties = () => {
    // Reset the arguments that are stored in the state component.
    resetEffectArgs()

    // Iterate through the selected target's arguments.
    args.forEach((arg: TTargetArg) => {
      // If the argument has dependencies then
      // update them to reflect the reset.
      if (arg.optionalParams?.dependencies) {
        updateArgDependencies(arg, arg.optionalParams.dependencies)
      }
    })

    // Update the form keys so that the fields will re-render.
    setDropDownKey(generateHash())
    setNumberKey(generateHash())
    setStringKey(generateHash())
    setMediumStringKey(generateHash())
    setBooleanKey(generateHash())
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
          return (
            <ArgGroupings
              effect={effect}
              grouping={grouping}
              dropDownKey={dropDownKey}
              numberKey={numberKey}
              stringKey={stringKey}
              mediumStringKey={mediumStringKey}
              booleanKey={booleanKey}
              defaultDropDownValue={defaultDropDownValue}
              defaultNumberValue={defaultNumberValue}
              defaultStringValue={defaultStringValue}
              defaultBooleanValue={defaultBooleanValue}
              effectArgs={effectArgs}
              reqPropertiesNotFilledOut={reqPropertiesNotFilledOut}
              updateArg={updateArg}
              key={`grouping-${groupingId}`}
            />
          )
        })}

        {/* -- BUTTONS -- */}
        <div className='ButtonContainer'>
          <div
            className={clearFormButtonClassName}
            onClick={resetArgProperties}
          >
            Clear Arguments
          </div>
          <div className={saveButtonClassName} onClick={saveEffect}>
            Save
          </div>
        </div>
      </div>
    )
  } else {
    return null
  }
}

/* ------------------------------ PROPS ------------------------------ */

/**
 * Props for Args component.
 */
export type TArgs = {
  /**
   * The action to execute.
   */
  action: ClientMissionAction
  /**
   * The effect to apply to the target.
   */
  effect: ClientEffect
  /**
   * Function to change the clear form value.
   */
  setClearForm: (value: boolean) => void
}
