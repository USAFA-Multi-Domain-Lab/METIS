import { useEffect, useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import { compute } from 'src/toolbox'
import { useMountHandler } from 'src/toolbox/hooks'
import { TTargetArg } from '../../../../../../shared/target-environments/targets'
import { AnyObject } from '../../../../../../shared/toolbox/objects'
import {
  Detail,
  DetailBox,
  DetailDropDown,
  DetailNumber,
  DetailToggle,
} from '../../form/Form'
import './ArgEntry.scss'

/**
 * Renders the argument field within a group of arguments.
 */
export default function ArgEntry({
  action,
  effect,
  args,
  arg,
  effectArgs,
  reqPropertiesNotFilledOut,
  argDependencies,
}: TArgGroupings_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- STATE -- */
  const [defaultDropDownValue] = useState<undefined>(undefined)
  const [defaultNumberValue] = useState<undefined>(undefined)
  const [defaultStringValue] = useState<string>('')
  const [defaultMediumStringValue] = useState<string>('<p><br></p>')
  const [defaultBooleanValue] = useState<boolean>(false)

  /* -- COMPUTED -- */
  /**
   * Dynamic class name for the argument field.
   */
  const argFieldClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['ArgEntry']

    // If the argument is not displayed then hide it.
    if (!arg.display) {
      classList.push('Hidden')
    }

    return classList.join(' ')
  })
  /**
   * The drop down value that is selected.
   */
  const dropDownValue: TArgDropdownOption | undefined = compute(() => {
    // Initialize the value
    let value: TArgDropdownOption | undefined = defaultDropDownValue

    // If the argument is a dropdown...
    if (arg.type === 'dropdown') {
      // ...and the argument's value in the effect is defined,
      // then use the effect's argument value.
      if (effect.args[arg.id]) {
        value = arg.options.find((option) => option.id === effect.args[arg.id])
      }
      // Otherwise, if the argument's value in the
      // state is undefined, the argument's value in
      // the effect is undefined, and the argument has
      // a default value, then use the default value.
      else if (!effectArgs[arg.id] && !effect.args[arg.id] && arg.default) {
        value = arg.default
      }
      // Otherwise, use the argument's value in the state.
      // At the very least, the argument's value in the state
      // will be the default drop down value (undefined).
      else {
        value = arg.options.find((option) => option.id === effectArgs[arg.id])
      }
    }

    // Return value
    return value
  })
  /**
   * The number input's value.
   */
  const numberValue: number | undefined = compute(() => {
    // Initialize the value to the component
    // state's effect argument value.
    let value: number | undefined = effectArgs[arg.id]

    // If the argument is a number...
    if (arg.type === 'number') {
      // ...and the argument's value in the effect
      // is defined, then use the effect's argument
      // value.
      if (effect.args[arg.id]) {
        value = effect.args[arg.id]
      }
      // Otherwise, if the argument's value in the
      // state is undefined, the argument's value in
      // the effect is undefined, and the argument has
      // a default value, then use the default value.
      else if (!effectArgs[arg.id] && !effect.args[arg.id] && arg.default) {
        value = arg.default
      }
      // Otherwise, use the argument's value in the state.
      // At the very least, the argument's value in the state
      // will be the default number value (null).
      else {
        value = effectArgs[arg.id]
      }
    }

    // Return the value.
    return value
  })
  /**
   * The text input's value.
   */
  const stringValue: string | undefined = compute(() => {
    // Initialize the value to the component
    // state's effect argument value.
    let value: string | undefined = effectArgs[arg.id]

    // If the argument is a string...
    if (arg.type === 'string') {
      // ...and the argument's value in the effect
      // is defined, then use the effect's argument
      // value.
      if (effect.args[arg.id]) {
        value = effect.args[arg.id]
      }
      // Otherwise, if the argument's value in the
      // state is undefined, the argument's value in
      // the effect is undefined, and the argument has
      // a default value, then use the default value.
      else if (!effectArgs[arg.id] && !effect.args[arg.id] && arg.default) {
        value = arg.default
      }
      // Otherwise, use the argument's value in the state.
      // At the very least, the argument's value in the state
      // will be the default string value (an empty string).
      else {
        value = effectArgs[arg.id]
      }
    }

    // Return the value.
    return value
  })
  /**
   * The medium string input's value.
   */
  const mediumStringValue: string | undefined = compute(() => {
    // Initialize the value to the component
    // state's effect argument value.
    let value: string | undefined = effectArgs[arg.id]

    // If the argument is a medium string...
    if (arg.type === 'medium-string') {
      // ...and the argument's value in the effect
      // is defined, then use the effect's argument
      // value.
      if (effect.args[arg.id]) {
        value = effect.args[arg.id]
      }
      // Otherwise, if the argument's value in the
      // state is undefined, the argument's value in
      // the effect is undefined, and the argument has
      // a default value, then use the default value.
      else if (!effectArgs[arg.id] && !effect.args[arg.id] && arg.default) {
        value = arg.default
      }
      // Otherwise, use the argument's value in the state.
      // At the very least, the argument's value in the state
      // will be the default medium string value (an empty string).
      else {
        value = effectArgs[arg.id]
      }
    }

    // Return the value.
    return value
  })
  /**
   * The boolean input's value.
   */
  const booleanValue: boolean | undefined = compute(() => {
    // Initialize the value to the component
    // state's effect argument value.
    let value: boolean | undefined = effectArgs[arg.id]

    // If the argument is a boolean...
    if (arg.type === 'boolean') {
      // ...and the argument's value in the effect
      // is defined, then use the effect's argument
      // value.
      if (effect.args[arg.id]) {
        value = effect.args[arg.id]
      }
      // Otherwise, if the argument's value in the
      // state is undefined, the argument's value in
      // the effect is undefined, and the argument has
      // a default value, then use the default value.
      else if (!effectArgs[arg.id] && !effect.args[arg.id] && arg.default) {
        value = arg.default
      }
      // Otherwise, use the argument's value in the state.
      // At the very least, the argument's value in the state
      // will be the default boolean value (false).
      else {
        value = effectArgs[arg.id]
      }
    }

    // Return the value.
    return value
  })
  /**
   * Whether or not to display the optional text.
   */
  const displayOptionalText: boolean = compute(() => {
    // Initialize the display to false.
    let display: boolean = false

    // If the argument is not required and the argument
    // is not a dependency then display the optional text.
    if (!arg.required && !argDependencies.includes(arg.id)) {
      display = true
    }

    // Return the display.
    return display
  })

  /* -- EFFECTS -- */

  // componentDidMount
  useMountHandler((done) => {
    // If the effect already exists within the action
    // then the effect already has defined arguments.
    if (action.effects.includes(effect)) {
      // Grab the entries of the effect's arguments.
      let argEntries: [string, any][] = Object.entries(effect.args)
      // Filter out the arguments that are not filled out.
      // Only the arguments that are filled out will be executed.
      argEntries.forEach(([key, value]) => {
        effectArgs[key] = value
      })
    }
    // Otherwise, the effect doesn't exist within the action
    // so the effect's arguments are undefined.
    else {
      // If the argument doesn't exist in the state either
      // and it has a default value then set the argument
      // to the default value and add it to the state.
      if (!(arg.id in effectArgs) && arg.default) {
        effectArgs[arg.id] = arg.default
      }
      // If the argument doesn't exist in the state and it
      // is a dropdown then set the argument to the default
      // dropdown value and add it to the state.
      else if (!(arg.id in effectArgs) && arg.type === 'dropdown') {
        effectArgs[arg.id] = defaultDropDownValue
      }
      // If the argument doesn't exist in the state and it
      // is a number then set the argument to the default
      // number value and add it to the state.
      else if (!(arg.id in effectArgs) && arg.type === 'number') {
        effectArgs[arg.id] = defaultNumberValue
      }
      // If the argument doesn't exist in the state and it
      // is a string then set the argument to the default
      // string value and add it to the state.
      else if (!(arg.id in effectArgs) && arg.type === 'string') {
        effectArgs[arg.id] = defaultStringValue
      }
      // If the argument doesn't exist in the state and it
      // is a medium string then set the argument to the default
      // medium string value and add it to the state.
      else if (!(arg.id in effectArgs) && arg.type === 'medium-string') {
        effectArgs[arg.id] = defaultMediumStringValue
      }
      // If the argument doesn't exist in the state and it
      // is a boolean then set the argument to the default
      // boolean value and add it to the state.
      else if (!(arg.id in effectArgs) && arg.type === 'boolean') {
        effectArgs[arg.id] = defaultBooleanValue
      }
    }

    done()
  })

  // Updates the argument's dependencies.
  useEffect(() => {
    // If the argument has dependencies then...
    if (arg.optionalParams?.dependencies) {
      // Iterate through the dependencies.
      arg.optionalParams.dependencies.forEach((dependency: string) => {
        // If the dependency is not already in the list
        // of dependencies then add it to the list.
        if (!argDependencies.includes(dependency)) {
          // Add the dependency to the list of dependencies.
          argDependencies.push(dependency)
        }
      })

      forceUpdate()
    }
  }, [argDependencies])

  // If the arguments stored in the state change then update
  // the effect's arguments to reflect the changes.
  useEffect(() => {
    // Grab the entries of the arguments stored in the state.
    let argEntries: [string, any][] = Object.entries(effectArgs)
    // Filter out the arguments that are not filled out.
    // Only the arguments that are filled out will be executed.
    argEntries.forEach(([key, value]) => {
      // If the value is not undefined, null, or the default value
      // then add the argument to the effect's arguments.
      if (
        value !== undefined &&
        value !== null &&
        value !== defaultStringValue &&
        value !== defaultMediumStringValue
      ) {
        effect.args[key] = value
      }

      // See if the argument stored in the state is an argument
      // within this target.
      let arg: TTargetArg | undefined = args.find(
        (arg: TTargetArg) => arg.id === key,
      )
      // If the argument is not found within the target, then
      // remove the argument from the effect and remove the
      // argument from the list of required properties not
      // filled out (if it exists).
      if (arg === undefined) {
        delete effect.args[key]

        if (reqPropertiesNotFilledOut.includes(key)) {
          reqPropertiesNotFilledOut.splice(
            reqPropertiesNotFilledOut.indexOf(key),
            1,
          )
        }
      }
    })

    // If an argument is in a default state then remove it's
    // dependencies from the effect's arguments.
    removeArg(arg, arg.optionalParams?.dependencies || [])

    // Update the argument based on the value.
    updateArg()
  }, [effectArgs[arg.id]])

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
      // Grab the dependency argument.
      let dependencyArg: TTargetArg | undefined = args.find(
        (arg: TTargetArg) => arg.id === dependency,
      )

      if (dependencyArg) {
        // If the argument is a dropdown then continue.
        if (arg.type === 'dropdown') {
          // If the argument's value equals a default value ||
          // the argument's value doesn't exist ||
          // the argument is not displayed,
          // then hide the dependency argument.
          if (
            effectArgs[arg.id] === arg.default ||
            effectArgs[arg.id] === defaultDropDownValue ||
            arg.display === false
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
          // If the argument's value equals a default value ||
          // the argument's value doesn't exist ||
          // the argument is not displayed,
          // then hide the dependency argument.
          if (
            effectArgs[arg.id] === arg.default ||
            effectArgs[arg.id] === defaultNumberValue ||
            effectArgs[arg.id] === undefined ||
            arg.display === false
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
          // If the argument's value equals a default value ||
          // the argument's value doesn't exist ||
          // the argument is not displayed,
          // then hide the dependency argument.
          if (
            effectArgs[arg.id] === arg.default ||
            effectArgs[arg.id] === defaultStringValue ||
            effectArgs[arg.id] === undefined ||
            arg.display === false
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
          // If the argument's value equals a default value ||
          // the argument's value doesn't exist ||
          // the argument is not displayed,
          // then hide the dependency argument.
          if (
            effectArgs[arg.id] === arg.default ||
            effectArgs[arg.id] === defaultMediumStringValue ||
            effectArgs[arg.id] === undefined ||
            arg.display === false
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
          // If the argument's value equals a default value ||
          // the argument's value doesn't exist ||
          // the argument is not displayed,
          // then hide the dependency argument.
          if (
            effectArgs[arg.id] === arg.default ||
            effectArgs[arg.id] === defaultBooleanValue ||
            effectArgs[arg.id] === undefined ||
            arg.display === false
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
   */
  const updateArg = () => {
    // If the argument is a dropdown and it is required
    // then check if the argument is filled out.
    if (arg.type === 'dropdown' && arg.required) {
      // If the argument's value equals a default value or
      // the argument's value doesn't exist or the argument
      // is not displayed then add the argument ID to the list
      // of arguments that are not filled out.
      if (
        effectArgs[arg.id] === arg.default ||
        effectArgs[arg.id] === defaultDropDownValue ||
        arg.display === false
      ) {
        reqPropertiesNotFilledOut.push(arg.id)
      }
      // Otherwise, remove the argument ID from the list of
      // arguments that are not filled out.
      else {
        reqPropertiesNotFilledOut.splice(
          reqPropertiesNotFilledOut.indexOf(arg.id),
          1,
        )
      }
    }
    // If the argument is a number and it is required
    // then check if the argument is filled out.
    else if (arg.type === 'number' && arg.required) {
      // If the argument's value equals a default value or
      // the argument's value doesn't exist or the argument
      // is not displayed then add the argument ID to the list
      // of arguments that are not filled out.
      if (
        effectArgs[arg.id] === arg.default ||
        effectArgs[arg.id] === defaultNumberValue ||
        effectArgs[arg.id] === undefined ||
        arg.display === false
      ) {
        reqPropertiesNotFilledOut.push(arg.id)
      }
      // Otherwise, remove the argument ID from the list of
      // arguments that are not filled out.
      else {
        reqPropertiesNotFilledOut.splice(
          reqPropertiesNotFilledOut.indexOf(arg.id),
          1,
        )
      }
    }
    // If the argument is a string and it is required
    // then check if the argument is filled out.
    else if (arg.type === 'string' && arg.required) {
      // If the argument's value equals a default value or
      // the argument's value doesn't exist or the argument
      // is not displayed then add the argument ID to the list
      // of arguments that are not filled out.
      if (
        effectArgs[arg.id] === arg.default ||
        effectArgs[arg.id] === defaultStringValue ||
        effectArgs[arg.id] === undefined ||
        arg.display === false
      ) {
        reqPropertiesNotFilledOut.push(arg.id)
      }
      // Otherwise, remove the argument ID from the list of
      // arguments that are not filled out.
      else {
        reqPropertiesNotFilledOut.splice(
          reqPropertiesNotFilledOut.indexOf(arg.id),
          1,
        )
      }
    }
    // If the argument is a medium string and it is required
    // then check if the argument is filled out.
    else if (arg.type === 'medium-string' && arg.required) {
      // If the argument's value equals a default value or
      // the argument's value doesn't exist or the argument
      // is not displayed then add the argument ID to the list
      // of arguments that are not filled out.
      if (
        effectArgs[arg.id] === arg.default ||
        effectArgs[arg.id] === defaultMediumStringValue ||
        effectArgs[arg.id] === undefined ||
        arg.display === false
      ) {
        reqPropertiesNotFilledOut.push(arg.id)
      }
      // Otherwise, remove the argument ID from the list of
      // arguments that are not filled out.
      else {
        reqPropertiesNotFilledOut.splice(
          reqPropertiesNotFilledOut.indexOf(arg.id),
          1,
        )
      }
    }
    // If the argument is a boolean and it is required
    // then check if the argument is filled out.
    else if (arg.type === 'boolean' && arg.required) {
      // If the argument's value equals a default value or
      // the argument's value doesn't exist or the argument
      // is not displayed then add the argument ID to the list
      // of arguments that are not filled out.
      if (
        effectArgs[arg.id] === arg.default ||
        effectArgs[arg.id] === defaultBooleanValue ||
        effectArgs[arg.id] === undefined ||
        arg.display === false
      ) {
        reqPropertiesNotFilledOut.push(arg.id)
      }
      // Otherwise, remove the argument ID from the list of
      // arguments that are not filled out.
      else {
        reqPropertiesNotFilledOut.splice(
          reqPropertiesNotFilledOut.indexOf(arg.id),
          1,
        )
      }
    }

    // If the argument has dependencies then
    // the dependencies are now required.
    if (arg.optionalParams?.dependencies) {
      updateArgDependencies(arg, arg.optionalParams.dependencies)
    }

    // Display the changes.
    forceUpdate()
  }

  /**
   * Recursive function that will remove dependency arguments
   * from the effect's arguments if the dependency argument's
   * parent argument is in a default state.
   * @param arg The argument to remove.
   * @param dependencies The list of dependencies.
   */
  const removeArg = (arg: TTargetArg, dependencies: string[]) => {
    // Iterate through the dependencies.
    dependencies.forEach((dependency: string) => {
      // Grab the dependency argument.
      let dependencyArg: TTargetArg | undefined = args.find(
        (arg: TTargetArg) => arg.id === dependency,
      )

      if (dependencyArg) {
        // If the argument is a dropdown then continue.
        if (arg.type === 'dropdown') {
          // If the argument's value equals a default value ||
          // the argument's value doesn't exist ||
          // the argument is not displayed,
          // then remove the dependency argument from the effect's arguments.
          if (
            effect.args[arg.id] === arg.default ||
            effect.args[arg.id] === defaultDropDownValue ||
            arg.display === false
          ) {
            delete effect.args[dependencyArg.id]
          }
        }
        // If the argument is a number then continue.
        else if (arg.type === 'number') {
          // If the argument's value equals a default value ||
          // the argument's value doesn't exist ||
          // the argument is not displayed,
          // then remove the dependency argument from the effect's arguments.
          if (
            effect.args[arg.id] === arg.default ||
            effect.args[arg.id] === defaultNumberValue ||
            effect.args[arg.id] === undefined ||
            arg.display === false
          ) {
            delete effect.args[dependencyArg.id]
          }
        }
        // If the argument is a string then continue.
        else if (arg.type === 'string') {
          // If the argument's value equals a default value ||
          // the argument's value doesn't exist ||
          // the argument is not displayed,
          // then remove the dependency argument from the effect's arguments.
          if (
            effect.args[arg.id] === arg.default ||
            effect.args[arg.id] === defaultStringValue ||
            effect.args[arg.id] === undefined ||
            arg.display === false
          ) {
            delete effect.args[dependencyArg.id]
          }
        }
        // If the argument is a medium-string then continue.
        else if (arg.type === 'medium-string') {
          // If the argument's value equals a default value ||
          // the argument's value doesn't exist ||
          // the argument is not displayed,
          // then remove the dependency argument from the effect's arguments.
          if (
            effect.args[arg.id] === arg.default ||
            effect.args[arg.id] === defaultMediumStringValue ||
            effect.args[arg.id] === undefined ||
            arg.display === false
          ) {
            delete effect.args[dependencyArg.id]
          }
        }
        // If the argument is a boolean then continue.
        else if (arg.type === 'boolean') {
          // If the argument's value equals a default value ||
          // the argument's value doesn't exist ||
          // the argument is not displayed,
          // then remove the dependency argument from the effect's arguments.
          if (
            effect.args[arg.id] === arg.default ||
            effect.args[arg.id] === defaultBooleanValue ||
            effect.args[arg.id] === undefined ||
            arg.display === false
          ) {
            delete effect.args[dependencyArg.id]
          }
        }

        if (dependencyArg.optionalParams?.dependencies) {
          // If the dependency argument has dependencies then
          // remove the dependency argument's dependencies.
          removeArg(dependencyArg, dependencyArg.optionalParams.dependencies)
        }
      }
    })
  }

  /* -- RENDER -- */
  // If the argument type is "dropdown" and it is required
  // then render the dropdown.
  if (arg.type === 'dropdown') {
    return (
      <div
        className={`${argFieldClassName} Dropdown`}
        key={`arg-${arg.id}_type-${arg.type}_container`}
      >
        <DetailDropDown<TArgDropdownOption>
          label={arg.name}
          options={arg.options}
          currentValue={dropDownValue}
          isExpanded={false}
          renderDisplayName={(option: TArgDropdownOption) => option.name}
          deliverValue={(option: TArgDropdownOption) => {
            // Add the argument to the list of arguments.
            effectArgs[arg.id] = option.id
            // Update the argument based on the value.
            updateArg()
            // If the option is the default option
            // then the argument is not filled out.
            if (option === arg.default || option === defaultDropDownValue) {
              // Reset the argument to the default option.
              effectArgs[arg.id] = arg.default?.id || defaultDropDownValue
            }
          }}
          displayOptionalText={displayOptionalText}
          key={`arg-${arg.id}_type-${arg.type}_field`}
        />
      </div>
    )
  }
  // If the argument type is "number" and it is required
  // then render the number input.
  else if (arg.type === 'number') {
    return (
      <div
        className={`${argFieldClassName} Number`}
        key={`arg-${arg.id}_type-${arg.type}-container`}
      >
        <DetailNumber
          label={arg.name}
          currentValue={numberValue}
          defaultValue={arg.required ? arg.default : defaultNumberValue}
          deliverValue={(value: number | undefined) => {
            // Add the argument to the list of arguments.
            effectArgs[arg.id] = value
            // Update the argument based on the value.
            updateArg()
            // If the value is null or undefined then the
            // argument is not filled out.
            if (value === arg.default || !value) {
              // Reset the argument to the default value.
              effectArgs[arg.id] = arg.default || defaultNumberValue
            }
          }}
          minimum={arg.min}
          maximum={arg.max}
          unit={arg.unit}
          displayOptionalText={displayOptionalText}
          emptyValueAllowed={!arg.required}
          placeholder='Enter a number...'
          key={`arg-${arg.id}_type-${arg.type}-field`}
        />
      </div>
    )
  }
  // If the argument type is "string" and it is required
  // then render the string input.
  else if (arg.type === 'string') {
    return (
      <div
        className={`${argFieldClassName} String`}
        key={`arg-${arg.id}_type-${arg.type}-container`}
      >
        <Detail
          label={arg.name}
          currentValue={stringValue}
          defaultValue={arg.required ? arg.default : defaultStringValue}
          deliverValue={(value: string) => {
            // Add the argument to the list of arguments.
            effectArgs[arg.id] = value
            // Update the argument based on the value.
            updateArg()
            // If the value is empty then the argument
            // is not filled out.
            if (value === arg.default || value === defaultStringValue) {
              // Reset the argument to the default value.
              effectArgs[arg.id] = arg.default || defaultStringValue
            }
          }}
          displayOptionalText={displayOptionalText}
          key={`arg-${arg.id}_type-${arg.type}-field`}
        />
      </div>
    )
  }
  // If the argument type is "medium-string" and it is required
  // then render the medium-string input.
  else if (arg.type === 'medium-string') {
    return (
      <div
        className={`${argFieldClassName} MediumString`}
        key={`arg-${arg.id}_type-${arg.type}-container`}
      >
        <DetailBox
          label={arg.name}
          currentValue={mediumStringValue}
          defaultValue={arg.required ? arg.default : defaultMediumStringValue}
          deliverValue={(value: string) => {
            // Add the argument to the list of arguments.
            effectArgs[arg.id] = value
            // Update the argument based on the value.
            updateArg()
            // If the value is empty then the argument
            // is not filled out.
            if (value === arg.default || value === defaultMediumStringValue) {
              // Reset the argument to the default value.
              effectArgs[arg.id] = arg.default || defaultMediumStringValue
            }
          }}
          elementBoundary='.BorderBox'
          displayOptionalText={displayOptionalText}
          key={`arg-${arg.id}_type-${arg.type}-field`}
        />
      </div>
    )
  }
  // If the argument type is "boolean" and it is required
  // then render the boolean toggle.
  else if (arg.type === 'boolean') {
    return (
      <div
        className={`${argFieldClassName} Boolean`}
        key={`arg-${arg.id}_type-${arg.type}-container`}
      >
        <DetailToggle
          label={arg.name}
          currentValue={booleanValue}
          deliverValue={(value: boolean) => {
            // Add the argument to the list of arguments.
            effectArgs[arg.id] = value
            // Update the argument based on the value.
            updateArg()
          }}
          key={`arg-${arg.id}_type-${arg.type}-field`}
        />
      </div>
    )
  } else {
    return null
  }
}

/* ---------------------------- TYPES FOR ARG GROUPINGS ---------------------------- */

/**
 * The dropdown argument type for a target.
 */
export type TArgDropdownOption = {
  /**
   * The ID of the option.
   */
  id: string
  /**
   * The name of the option.
   */
  name: string
}

/**
 * The props for the ArgGroupings component.
 */
export type TArgGroupings_P = {
  /**
   * The action to execute.
   */
  action: ClientMissionAction
  /**
   * The effect to which the arguments belong.
   */
  effect: ClientEffect
  /**
   * The list of arguments to render.
   */
  args: TTargetArg[]
  /**
   * The argument to render.
   */
  arg: TTargetArg
  /**
   * The arguments stored in the state.
   */
  effectArgs: AnyObject
  /**
   * A list of required arguments that are not filled out.
   */
  reqPropertiesNotFilledOut: string[]
  /**
   * The list of dependencies for the argument.
   */
  argDependencies: string[]
}
