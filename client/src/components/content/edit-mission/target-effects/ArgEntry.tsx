import { useState } from 'react'
import { ClientEffect } from 'src/missions/effects'
import { compute } from 'src/toolbox'
import { useMountHandler } from 'src/toolbox/hooks'
import { TTargetArg } from '../../../../../../shared/target-environments/targets'
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
  effect,
  arg,
  argDependencies,
  handleChange,
}: TArgGroupings_P): JSX.Element | null {
  /* -- STATE -- */
  const [defaultDropDownValue] = useState<null>(null)
  const [defaultNumberValue] = useState<null>(null)
  const [defaultStringValue] = useState<''>('')
  const [defaultMediumStringValue] = useState<'<p><br></p>'>('<p><br></p>')
  const [defaultBooleanValue] = useState<false>(false)

  /* -- COMPUTED -- */
  /**
   * The selected target's arguments.
   */
  const args: TTargetArg[] | undefined = compute(() => {
    return effect.target?.args
  })
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
  const dropDownValue: TArgDropdownOption | null = compute(() => {
    // Initialize the value
    let value: TArgDropdownOption | null = defaultDropDownValue

    // If the argument is a drop down, the argument
    // has a default value...
    if (arg.type === 'dropdown' && arg.default) {
      // ...and the argument's value in the effect isn't
      // the default value then use the effect's argument
      // value.
      // Note: For initial values, see componentDidMount.
      if (effect.args[arg.id] !== arg.default.id) {
        let option: TArgDropdownOption | undefined = arg.options.find(
          (option) => option.id === effect.args[arg.id],
        )

        // If the value is found then update the value.
        if (option) {
          value = option
        }
        // Otherwise, set the value to the default value.
        else {
          value = defaultDropDownValue
        }
      }
      // Otherwise, set the value to the default value.
      else {
        value = arg.default
      }
    }

    // Return value
    return value
  })
  /**
   * The number input's value.
   */
  const numberValue: number | null = compute(() => {
    // Initialize the value.
    let value: number | null = defaultNumberValue

    // If the argument is a number, the argument
    // has a default value...
    if (arg.type === 'number' && arg.default) {
      // ...and the argument's value in the effect isn't
      // the default value then use the effect's argument
      // value.
      // Note: For initial values, see componentDidMount.
      if (effect.args[arg.id] !== arg.default) {
        value = effect.args[arg.id]
      }
      // Otherwise, set the value to the default value.
      else {
        value = arg.default
      }
    }

    // Return the value.
    return value
  })
  /**
   * The text input's value.
   */
  const stringValue: string = compute(() => {
    // Initialize the value.
    let value: string = defaultStringValue

    // If the argument is a string, the argument
    // has a default value...
    if (arg.type === 'string' && arg.default) {
      // ...and the argument's value in the effect isn't
      // the default value then use the effect's argument
      // value.
      // Note: For initial values, see componentDidMount.
      if (effect.args[arg.id] !== arg.default) {
        value = effect.args[arg.id]
      }
      // Otherwise, set the value to the default value.
      else {
        value = arg.default
      }
    }

    // Return the value.
    return value
  })
  /**
   * The medium string input's value.
   */
  const mediumStringValue: string = compute(() => {
    // Initialize the value.
    let value: string = defaultMediumStringValue

    // If the argument is a medium string, the argument
    // has a default value...
    if (arg.type === 'medium-string' && arg.default) {
      // ...and the argument's value in the effect isn't
      // the default value then use the effect's argument
      // value.
      // Note: For initial values, see componentDidMount.
      if (effect.args[arg.id] !== arg.default) {
        value = effect.args[arg.id]
      }
      // Otherwise, set the value to the default value.
      else {
        value = arg.default
      }
    }

    // Return the value.
    return value
  })
  /**
   * The boolean input's value.
   */
  const booleanValue: boolean = compute(() => {
    // Initialize the value.
    let value: boolean = defaultBooleanValue

    // If the argument is a boolean, the argument
    // has a default value...
    if (arg.type === 'boolean' && arg.default) {
      // ...and the argument's value in the effect isn't
      // the default value then use the effect's argument
      // value.
      // Note: For initial values, see componentDidMount.
      if (effect.args[arg.id] !== arg.default) {
        value = effect.args[arg.id]
      }
      // Otherwise, set the value to the default value.
      else {
        value = arg.default
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
    // If the argument isn't a dependency...
    if (!argDependencies.includes(arg.id)) {
      // ...and the argument doesn't already exist in
      //  the effect's arguments then set the argument
      // to the default value and add it to the effect's
      // arguments.
      if (effect.args[arg.id] === undefined && arg.default !== undefined) {
        if (arg.type === 'dropdown') {
          effect.args[arg.id] = arg.default.id
        } else {
          effect.args[arg.id] = arg.default
        }
      }
      // Or, if the argument doesn't have a default value
      // then set the argument to the default drop down
      // value and add it to the effect's arguments.
      else if (
        effect.args[arg.id] === undefined &&
        arg.default === undefined &&
        arg.type === 'dropdown'
      ) {
        effect.args[arg.id] = defaultDropDownValue
      }
      // Or, if the argument doesn't have a default value
      // then set the argument to the default number value
      // and add it to the effect's arguments.
      else if (
        effect.args[arg.id] === undefined &&
        arg.default === undefined &&
        arg.type === 'number'
      ) {
        effect.args[arg.id] = defaultNumberValue
      }
      // Or, if the argument doesn't have a default value
      // then set the argument to the default string value
      // and add it to the effect's arguments.
      else if (
        effect.args[arg.id] === undefined &&
        arg.default === undefined &&
        arg.type === 'string'
      ) {
        effect.args[arg.id] = defaultStringValue
      }
      // Or, if the argument doesn't have a default value
      // then set the argument to the default medium string
      // value and add it to the effect's arguments.
      else if (
        effect.args[arg.id] === undefined &&
        arg.default === undefined &&
        arg.type === 'medium-string'
      ) {
        effect.args[arg.id] = defaultMediumStringValue
      }
      // Or, if the argument doesn't have a default value
      // then set the argument to the default boolean value
      // and add it to the effect's arguments.
      else if (
        effect.args[arg.id] === undefined &&
        arg.default === undefined &&
        arg.type === 'boolean'
      ) {
        effect.args[arg.id] = defaultBooleanValue
      }
    }

    // Update the argument's dependencies.
    updateArgDependencies(arg, arg.optionalParams?.dependencies)

    done()
  })

  /* -- FUNCTIONS -- */

  /**
   * Recusive function that updates the argument's dependencies
   * depending on the argument's type and value.
   * @param arg The argument to update.
   * @param dependencies The list of dependencies.
   */
  const updateArgDependencies = (
    arg: TTargetArg,
    dependencies: string[] = [],
  ) => {
    // Iterate through the dependencies.
    dependencies.forEach((dependency: string) => {
      // Grab the dependency argument.
      let dependencyArg: TTargetArg | undefined = args?.find(
        (arg: TTargetArg) => arg.id === dependency,
      )

      if (dependencyArg) {
        // If the argument is in a default state then hide
        // the dependency argument and remove it from the
        // effect's arguments stored in the state.
        if (
          effect.args[arg.id] === arg.default ||
          effect.args[arg.id] === defaultDropDownValue ||
          effect.args[arg.id] === defaultNumberValue ||
          effect.args[arg.id] === defaultStringValue ||
          effect.args[arg.id] === defaultMediumStringValue ||
          effect.args[arg.id] === defaultBooleanValue ||
          effect.args[arg.id] === undefined ||
          arg.display === false
        ) {
          // Hide the dependency argument.
          dependencyArg.display = false
          // Remove the dependency argument from the effect's arguments.
          delete effect.args[dependencyArg.id]
        } else {
          // Otherwise, display the dependency argument.
          dependencyArg.display = true
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

  /* -- RENDER -- */
  // If the argument type is "dropdown" then render
  // the dropdown.
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
            // Update the effect's arguments.
            effect.args[arg.id] = option.id
            // Update the argument's dependencies.
            updateArgDependencies(arg, arg.optionalParams?.dependencies)
            // If the option is not the default value then
            // allow the user to save the changes.
            if (option !== arg.default || option !== defaultDropDownValue) {
              handleChange()
            }
          }}
          displayOptionalText={displayOptionalText}
          key={`arg-${arg.id}_type-${arg.type}_field`}
        />
      </div>
    )
  }
  // If the argument type is "number" then render
  // the number input.
  else if (arg.type === 'number') {
    return (
      <div
        className={`${argFieldClassName} Number`}
        key={`arg-${arg.id}_type-${arg.type}-container`}
      >
        <DetailNumber
          label={arg.name}
          currentValue={numberValue}
          defaultValue={arg.default}
          deliverValue={(value: number | null) => {
            // Update the effect's arguments.
            effect.args[arg.id] = value
            // Update the argument's dependencies.
            updateArgDependencies(arg, arg.optionalParams?.dependencies)
            // If the value is not the default value then
            // allow the user to save the changes.
            if (value !== arg.default || value !== defaultNumberValue) {
              handleChange()
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
  // If the argument type is "string" then render
  // the string input.
  else if (arg.type === 'string') {
    return (
      <div
        className={`${argFieldClassName} String`}
        key={`arg-${arg.id}_type-${arg.type}-container`}
      >
        <Detail
          label={arg.name}
          currentValue={stringValue}
          defaultValue={arg.default}
          deliverValue={(value: string) => {
            // Update the effect's arguments.
            effect.args[arg.id] = value
            // Update the argument's dependencies.
            updateArgDependencies(arg, arg.optionalParams?.dependencies)
            // If the value is not the default value then
            // allow the user to save the changes.
            if (value !== arg.default || value !== defaultStringValue) {
              handleChange()
            }
          }}
          displayOptionalText={displayOptionalText}
          key={`arg-${arg.id}_type-${arg.type}-field`}
        />
      </div>
    )
  }
  // If the argument type is "medium-string" then render
  // the medium-string input.
  else if (arg.type === 'medium-string') {
    return (
      <div
        className={`${argFieldClassName} MediumString`}
        key={`arg-${arg.id}_type-${arg.type}-container`}
      >
        <DetailBox
          label={arg.name}
          currentValue={mediumStringValue}
          defaultValue={arg.default}
          deliverValue={(value: string) => {
            // Update the effect's arguments.
            effect.args[arg.id] = value
            // Update the argument's dependencies.
            updateArgDependencies(arg, arg.optionalParams?.dependencies)
            // If the value is not the default value then
            // allow the user to save the changes.
            if (value !== arg.default || value !== defaultMediumStringValue) {
              handleChange()
            }
          }}
          elementBoundary='.BorderBox'
          displayOptionalText={displayOptionalText}
          key={`arg-${arg.id}_type-${arg.type}-field`}
        />
      </div>
    )
  }
  // If the argument type is "boolean" then render
  // the boolean toggle.
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
            // Update the effect's arguments.
            effect.args[arg.id] = value
            // Update the argument's dependencies.
            updateArgDependencies(arg, arg.optionalParams?.dependencies)
            // Allow the user to save the changes.
            handleChange()
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
   * The effect to which the arguments belong.
   */
  effect: ClientEffect
  /**
   * The argument to render.
   */
  arg: TTargetArg
  /**
   * The list of dependencies for the argument.
   */
  argDependencies: string[]
  /**
   * Handles when a change is made that would require saving.
   */
  handleChange: () => void
}
