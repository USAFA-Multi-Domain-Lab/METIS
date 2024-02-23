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
  reqPropertiesNotFilledOut,
}: TArgGroupings_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- STATE -- */
  const [defaultDropDownValue] = useState<undefined>(undefined)
  const [defaultNumberValue] = useState<null>(null)
  const [defaultStringValue] = useState<string>('')
  const [defaultBooleanValue] = useState<boolean>(false)
  const [effectArgs] = useState<AnyObject>({})

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
  const selectedDropDownValue: TTargetArgDropdownOption | undefined = compute(
    () => {
      if (arg.type === 'dropdown') {
        if (effect.args[arg.id]) {
          effectArgs[arg.id] = effect.args[arg.id]
        }

        return arg.options.find(
          (option: TTargetArgDropdownOption) =>
            option.id === effectArgs[arg.id],
        )
      }
    },
  )

  /* -- EFFECTS -- */
  const [_, remount] = useMountHandler((done) => {
    // Initialize the component arguments.
    if (arg.type === 'dropdown') {
      effectArgs[arg.id] = defaultDropDownValue
    } else if (arg.type === 'number') {
      effectArgs[arg.id] = defaultNumberValue
    } else if (arg.type === 'string') {
      effectArgs[arg.id] = defaultStringValue
    } else if (arg.type === 'medium-string') {
      effectArgs[arg.id] = defaultStringValue
    } else if (arg.type === 'boolean') {
      effectArgs[arg.id] = defaultBooleanValue
    }

    done()
  })

  useEffect(() => {
    resetArgProperties()
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
    // If the argument is a dropdown then reset its
    // selected option to the default option.
    if (arg.type === 'dropdown') {
      // Reset the argument to the default option.
      effectArgs[arg.id] = arg.default || defaultDropDownValue
    }
    // If the argument is a number then reset its
    // value to the default value.
    else if (arg.type === 'number') {
      effectArgs[arg.id] = arg.default || defaultNumberValue
    }
    // If the argument is a string then reset its
    // value to the default value.
    else if (arg.type === 'string') {
      effectArgs[arg.id] = arg.default || defaultStringValue
    }
    // If the argument is a medium-string then reset its
    // value to the default value.
    else if (arg.type === 'medium-string') {
      effectArgs[arg.id] = arg.default || defaultStringValue
    }
    // If the argument is a boolean then reset its
    // value to the default value.
    else if (arg.type === 'boolean') {
      effectArgs[arg.id] = arg.default || defaultBooleanValue
    }

    // If the argument is required then add the argument
    // ID to the list of arguments that are not filled out.
    if (arg.required) {
      reqPropertiesNotFilledOut.push(arg.id)
    }
  }

  /**
   * Handles clearing the form and resetting the arguments.
   */
  const resetArgProperties = () => {
    // Reset the arguments that are stored in the state component.
    resetEffectArgs()

    // If the argument has dependencies then
    // update them to reflect the reset.
    if (arg.optionalParams?.dependencies) {
      updateArgDependencies(arg, arg.optionalParams.dependencies)
    }
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
        <DetailDropDown<TTargetArgDropdownOption>
          label={arg.name}
          options={arg.options}
          currentValue={selectedDropDownValue || arg.default}
          isExpanded={false}
          uniqueDropDownStyling={{}}
          uniqueOptionStyling={(option: TTargetArgDropdownOption) => {
            return {}
          }}
          renderOptionClassName={(option: TTargetArgDropdownOption) =>
            option.name
          }
          renderDisplayName={(option: TTargetArgDropdownOption) => option.name}
          deliverValue={(option: TTargetArgDropdownOption) => {
            // Add the argument to the list of arguments.
            effectArgs[arg.id] = option.id
            // Remove the argument ID from the list of
            // arguments that are not filled out.
            updateArg(arg)

            // If the option is the default option
            // then the argument is not filled out.
            if (option === arg.default || option === defaultDropDownValue) {
              // Reset the argument to the default option.
              effectArgs[arg.id] = arg.default?.id || defaultDropDownValue
              // Add the argument ID to the list of
              // arguments that are not filled out.
              // (This disables the save button.)
              reqPropertiesNotFilledOut.push(arg.id)
            }

            // Display the changes.
            forceUpdate()
          }}
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
          initialValue={
            effect.args[arg.id] || arg.default || defaultNumberValue
          }
          deliverValue={(value: number | null | undefined) => {
            // Add the argument to the list of arguments.
            effectArgs[arg.id] = value

            // Remove the argument ID from the list of
            // arguments that are not filled out.
            updateArg(arg)

            // If the value is null or undefined then the
            // argument is not filled out.
            if (
              value === arg.default ||
              value === defaultNumberValue ||
              value === null ||
              value === undefined
            ) {
              // Reset the argument to the default value.
              effectArgs[arg.id] = arg.default || defaultNumberValue
              // Add the argument ID to the list of
              // arguments that are not filled out.
              // (This disables the save button.)
              reqPropertiesNotFilledOut.push(arg.id)
            }

            // Display the changes.
            forceUpdate()
          }}
          options={{
            minimum: arg.min,
            maximum: arg.max,
            unit: arg.unit,
            emptyValueAllowed: true,
            placeholder: arg.required ? 'Required' : 'Optional',
          }}
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
          initialValue={
            effect.args[arg.id] || arg.default || defaultStringValue
          }
          deliverValue={(value: string) => {
            // Add the argument to the list of arguments.
            effectArgs[arg.id] = value
            // Update the argument's properties and its
            // dependencies.
            updateArg(arg)

            // If the value is empty then the argument
            // is not filled out.
            if (value === arg.default || value === defaultStringValue) {
              // Reset the argument to the default value.
              effectArgs[arg.id] = arg.default || defaultStringValue
              // Add the argument ID to the list of
              // arguments that are not filled out.
              // (This disables the save button.)
              reqPropertiesNotFilledOut.push(arg.id)
            }

            // Display the changes.
            forceUpdate()
          }}
          options={{
            placeholder: arg.required ? 'Required' : 'Optional',
          }}
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
          initialValue={
            effect.args[arg.id] || arg.default || defaultStringValue
          }
          deliverValue={(value: string) => {
            // Add the argument to the list of arguments.
            effectArgs[arg.id] = value
            // Remove the argument ID from the list of
            // arguments that are not filled out.
            updateArg(arg)

            // If the value is empty then the argument
            // is not filled out.
            if (value === arg.default || value === defaultStringValue) {
              // Reset the argument to the default value.
              effectArgs[arg.id] = arg.default || defaultStringValue
              // Add the argument ID to the list of
              // arguments that are not filled out.
              // (This disables the save button.)
              reqPropertiesNotFilledOut.push(arg.id)
            }

            // Display the changes.
            forceUpdate()
          }}
          options={{
            emptyStringAllowed: arg.required,
            placeholder: arg.required ? 'Required' : 'Optional',
            elementBoundary: '.BorderBox',
          }}
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
          initialValue={
            effect.args[arg.id] || arg.default || defaultBooleanValue
          }
          deliverValue={(value: boolean) => {
            // Add the argument to the list of arguments.
            effectArgs[arg.id] = value
            // Remove the argument ID from the list of
            // arguments that are not filled out.
            updateArg(arg)
            // Display the changes.
            forceUpdate()
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
export type TTargetArgDropdownOption = {
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
   * A list of required arguments that are not filled out.
   */
  reqPropertiesNotFilledOut: string[]
}
