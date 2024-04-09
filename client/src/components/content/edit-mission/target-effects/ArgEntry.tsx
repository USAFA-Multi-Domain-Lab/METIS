import { useEffect, useState } from 'react'
import { ClientEffect } from 'src/missions/effects'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import { ReactSetter } from 'src/toolbox/types'
import { TTargetArg } from '../../../../../../shared/target-environments/targets'
import {
  DetailDropDown,
  DetailLargeString,
  DetailNumber,
  DetailString,
  DetailToggle,
} from '../../form/Form'
import './ArgEntry.scss'

/**
 * Renders the argument field within a group of arguments.
 */
export default function ArgEntry({
  target,
  arg,
  effectArgs,
  setEffectArgs,
}: TArgGroupings_P): JSX.Element | null {
  /* -- STATE -- */
  const [defaultStringValue] = useState<''>('')
  const [defaultLargeStringValue] = useState<'<p><br></p>'>('<p><br></p>')
  const [dropDownValue, setDropDownValue] = useState<TArgDropdownOption>(() => {
    // If the argument is a dropdown and the argument's value
    // is in the effect's arguments then set the dropdown value.
    if (arg.type === 'dropdown' && arg.required) {
      // Grab the dropdown option.
      let option: TArgDropdownOption | undefined = arg.options.find(
        (option: TArgDropdownOption) => option.id === effectArgs[arg.id],
      )

      // If the option is found then set the dropdown value.
      if (option) {
        return option
      } else {
        return arg.default
      }
    } else {
      return {
        id: 'Not a required dropdown.',
        name: 'Not a required dropdown.',
      }
    }
  })
  const [optionalDropDownValue, setOptionalDropDownValue] =
    useState<TArgDropdownOption | null>(() => {
      // If the argument is a dropdown and the argument's value
      // is in the effect's arguments then set the dropdown value.
      if (arg.type === 'dropdown' && !arg.required) {
        // Grab the dropdown option.
        let option: TArgDropdownOption | undefined = arg.options.find(
          (option: TArgDropdownOption) => option.id === effectArgs[arg.id],
        )

        // If the option is found then set the dropdown value.
        if (option) {
          return option
        } else {
          return null
        }
      } else {
        return null
      }
    })
  const [numberValue, setNumberValue] = useState<number>(
    effectArgs[arg.id] || 0,
  )
  const [optionalNumberValue, setOptionalNumberValue] = useState<number | null>(
    effectArgs[arg.id] || null,
  )
  const [stringValue, setStringValue] = useState<string>(
    effectArgs[arg.id] || defaultStringValue,
  )
  const [largeStringValue, setLargeStringValue] = useState<string>(
    effectArgs[arg.id] || defaultLargeStringValue,
  )
  const [booleanValue, setBooleanValue] = useState<boolean>(
    effectArgs[arg.id] || false,
  )

  /* -- COMPUTED -- */
  /**
   * Boolean to determine if the argument should be displayed.
   */
  const display: boolean = compute(() => {
    // If the argument has a target then update the target's
    // arguments.
    if (target && arg.dependencies) {
      // Grab the target's arguments.
      let args: TTargetArg[] = target.args

      // Iterate through the dependencies.
      arg.dependencies.forEach((dependency: string) => {
        // Grab the dependency argument.
        let dependencyArg: TTargetArg | undefined = args.find(
          (arg: TTargetArg) => arg.id === dependency,
        )

        if (dependencyArg) {
          // If the dependency argument is in a default state
          // then hide the argument and remove it from the
          // effect's arguments stored in the state.
          if (
            effectArgs[dependencyArg.id] === defaultStringValue ||
            effectArgs[dependencyArg.id] === defaultLargeStringValue ||
            effectArgs[dependencyArg.id] === false ||
            effectArgs[dependencyArg.id] === null ||
            effectArgs[dependencyArg.id] === undefined ||
            dependencyArg.display === false
          ) {
            // Hide the argument.
            arg.display = false
          }
          // Otherwise, display the argument and set the
          // argument's value to the default value.
          else {
            arg.display = true
          }
        }
      })
    }

    // Return the display value.
    return arg.display
  })

  /* -- EFFECTS -- */

  // Update the effect's arguments based on the argument's
  // display.
  useEffect(() => {
    // If the argument is displayed and the argument is not
    // in the effect's arguments then initialize the argument.
    if (display && effectArgs[arg.id] === undefined) {
      initializeArg()
    }
    // Otherwise, remove the argument from the effect's arguments.
    else if (!display && effectArgs[arg.id] !== undefined) {
      setEffectArgs((prev) => {
        delete prev[arg.id]
        return prev
      })
    }
  }, [display])

  // Update the argument's value in the effect's arguments
  // when the argument's value changes.
  // *** Note: this doesn't execute on the first render. ***
  usePostInitEffect(() => {
    // If the argument is a drop down...
    if (arg.type === 'dropdown') {
      // ..and the argument's value is not in a default state
      // then update the dropdown value in the effect's
      // arguments.
      if (arg.required) {
        setEffectArgs((prev) => ({ ...prev, [arg.id]: dropDownValue.id }))
      }
      // Or, if the argument is optional and the dropdown value
      // is not in a default state then update the dropdown
      // value in the effect's arguments.
      else if (!arg.required && optionalDropDownValue !== null) {
        setEffectArgs((prev) => ({
          ...prev,
          [arg.id]: optionalDropDownValue.id,
        }))
      }
    }
    // Or, if the argument is a number...
    else if (arg.type === 'number') {
      // ...and the argument is required, then update
      // the number value in the effect's arguments.
      if (arg.required) {
        setEffectArgs((prev) => ({ ...prev, [arg.id]: numberValue }))
      }
      // Or, if the argument is optional and the number value
      // is not in a default state then update the number
      // value in the effect's arguments.
      else if (!arg.required && optionalNumberValue !== null) {
        setEffectArgs((prev) => ({ ...prev, [arg.id]: optionalNumberValue }))
      }
    }
    // Or, if the argument is a string...
    else if (arg.type === 'string') {
      // ...and the argument's value is not in a default state
      // then update the string value in the effect's
      // arguments.
      if (stringValue !== defaultStringValue) {
        setEffectArgs((prev) => ({ ...prev, [arg.id]: stringValue }))
      }
    }
    // Or, if the argument is a large string...
    else if (arg.type === 'large-string') {
      // ...and the argument's value is not in a default state
      // then update the large string value in the effect's
      // arguments.
      if (largeStringValue !== defaultLargeStringValue) {
        setEffectArgs((prev) => ({ ...prev, [arg.id]: largeStringValue }))
      }
    }
    // Or, if the argument is a boolean...
    else if (arg.type === 'boolean') {
      // ...then update the boolean value in the effect's arguments.
      setEffectArgs((prev) => ({ ...prev, [arg.id]: booleanValue }))
    }
  }, [
    dropDownValue,
    optionalDropDownValue,
    numberValue,
    optionalNumberValue,
    stringValue,
    largeStringValue,
    booleanValue,
  ])

  /* -- FUNCTIONS -- */

  /**
   * Initializes the argument within the effect's arguments.
   * @note *This is determined by the argument's dependencies
   * and whether the argument is required or not.*
   */
  const initializeArg = () => {
    // If the argument is required and has no dependencies...
    if (
      arg.required &&
      (arg.dependencies === undefined || arg.dependencies.length === 0)
    ) {
      // ...and the argument is a drop down then set the
      // drop down value to the default value.
      // *** Note: The default value is mandatory if the
      // *** argument is required.
      if (arg.type === 'dropdown') {
        // *** Note: When this value in the state changes,
        // *** the effect's arguments automatically updates
        // *** with the current value.
        setDropDownValue(arg.default)
      }
      // Or, if the argument is a number...
      else if (arg.type === 'number') {
        // ...and the number value stored in the state is the
        // same as the default value, then manually update the
        // effect's arguments by adding this argument and its
        // value.
        if (numberValue === arg.default) {
          // *** Note: An argument's value in the effect's
          // *** arguments is automatically set if the value
          // *** stored in this state changes. If the value
          // *** in the state doesn't change then the value
          // *** needs to be set manually.
          setEffectArgs((prev) => ({ ...prev, [arg.id]: numberValue }))
        }
        // Otherwise, set the number value to the default value.
        // *** Note: The default value is mandatory if the
        // *** argument is required.
        else {
          // *** Note: When this value in the state changes,
          // *** the effect's arguments automatically updates
          // *** with the current value.
          setNumberValue(arg.default)
        }
      }
      // Or, if the argument is a string then set the string
      // value to the default value.
      else if (arg.type === 'string') {
        // *** Note: When this value in the state changes,
        // *** the effect's arguments automatically updates
        // *** with the current value.
        setStringValue(arg.default)
      }
      // Or, if the argument is a large string then set the
      // large string value to the default value.
      else if (arg.type === 'large-string') {
        // *** Note: When this value in the state changes,
        // *** the effect's arguments automatically updates
        // *** with the current value.
        setLargeStringValue(arg.default)
      }
      // Or, if the argument is a boolean...
      else if (arg.type === 'boolean') {
        // ...and the boolean value stored in the state is the
        // same as the default value, then manually update the
        // effect's arguments by adding this argument and its
        // value.
        if (booleanValue === arg.default) {
          // *** Note: An argument's value in the effect's
          // *** arguments is automatically set if the value
          // *** stored in this state changes. If the value
          // *** in the state doesn't change then the value
          // *** needs to be set manually.
          setEffectArgs((prev) => ({ ...prev, [arg.id]: booleanValue }))
        }
        // Otherwise, set the boolean value to the default value.
        // *** Note: The default value is mandatory if the
        // *** argument is required.
        else {
          // *** Note: When this value in the state changes,
          // *** the effect's arguments automatically updates
          // *** with the current value.
          setBooleanValue(arg.default)
        }
      }
    }
    // Or, if the argument is required and has dependencies...
    else if (arg.required && arg.dependencies) {
      // Grab the target's arguments.
      let args: TTargetArg[] = target?.args || []
      // Create an array to store the status of the argument's
      // dependencies.
      let allDependenciesMet: boolean[] = []

      // Iterate through the dependencies.
      arg.dependencies.forEach((dependency: string) => {
        // Grab the dependency argument.
        let dependencyArg: TTargetArg | undefined = args.find(
          (arg: TTargetArg) => arg.id === dependency,
        )

        // If the dependency argument is found...
        if (dependencyArg) {
          // ...and the dependency argument is not in a default
          // state, then the dependency has been met.
          // *** Note: An argument can only be displayed and set
          // *** if all of its dependencies are met (i.e., not in
          // *** a default state).
          if (
            effectArgs[dependencyArg.id] !== defaultStringValue ||
            effectArgs[dependencyArg.id] !== defaultLargeStringValue ||
            effectArgs[dependencyArg.id] !== false ||
            effectArgs[dependencyArg.id] !== null ||
            effectArgs[dependencyArg.id] !== undefined ||
            dependencyArg.display
          ) {
            allDependenciesMet.push(true)
          }
          // Otherwise, the dependency has not been met.
          else {
            allDependenciesMet.push(false)
          }
        }
      })

      // If all of the dependencies have been met...
      if (!allDependenciesMet.includes(false)) {
        // ...and the argument is a drop down then set the
        // drop down value to the default value.
        if (arg.type === 'dropdown') {
          // *** Note: When this value in the state changes,
          // *** the effect's arguments automatically updates
          // *** with the current value.
          setDropDownValue(arg.default)
        }
        // Or, if the argument is a number...
        else if (arg.type === 'number') {
          // ...and the number value stored in the state is the
          // same as the default value, then manually update the
          // effect's arguments by adding this argument and its
          // value.
          if (numberValue === arg.default) {
            // *** Note: An argument's value in the effect's
            // *** arguments is automatically set if the value
            // *** stored in this state changes. If the value
            // *** in the state doesn't change then the value
            // *** needs to be set manually.
            setEffectArgs((prev) => ({ ...prev, [arg.id]: numberValue }))
          }
          // Otherwise, set the number value to the default value.
          // *** Note: The default value is mandatory if the
          // *** argument is required.
          else {
            // *** Note: When this value in the state changes,
            // *** the effect's arguments automatically updates
            // *** with the current value.
            setNumberValue(arg.default)
          }
        }
        // Or, if the argument is a string then set the string
        // value to the default value.
        // *** Note: The default value is mandatory if the
        // *** argument is required.
        else if (arg.type === 'string') {
          // *** Note: When this value in the state changes,
          // *** the effect's arguments automatically updates
          // *** with the current value.
          setStringValue(arg.default)
        }
        // Or, if the argument is a large string then set the
        // large string value to the default value.
        // *** Note: The default value is mandatory if the
        // *** argument is required.
        else if (arg.type === 'large-string') {
          // *** Note: When this value in the state changes,
          // *** the effect's arguments automatically updates
          // *** with the current value.
          setLargeStringValue(arg.default)
        }
        // Or, if the argument is a boolean...
        else if (arg.type === 'boolean') {
          // ...and the boolean value stored in the state is the
          // same as the default value, then manually update the
          // effect's arguments by adding this argument and its
          // value.
          if (booleanValue === arg.default) {
            // *** Note: An argument's value in the effect's
            // *** arguments is automatically set if the value
            // *** stored in this state changes. If the value
            // *** in the state doesn't change then the value
            // *** needs to be set manually.
            setEffectArgs((prev) => ({ ...prev, [arg.id]: booleanValue }))
          }
          // Otherwise, set the boolean value to the default value.
          // *** Note: The default value is mandatory if the
          // *** argument is required.
          else {
            // *** Note: When this value in the state changes,
            // *** the effect's arguments automatically updates
            // *** with the current value.
            setBooleanValue(arg.default)
          }
        }
      }
    }
    // Or, if the argument is optional and its type
    // is a boolean...
    else if (!arg.required && arg.type === 'boolean') {
      // *** Note: The boolean is a special case because
      // *** it only has two states: true or false. Therefore,
      // *** the value is always defined which means that it
      // *** should always be included in the effect's arguments.

      // ...and the boolean value stored in the state is the
      // same as the default value, then manually update the
      // effect's arguments by adding this argument and its
      // value.
      if (booleanValue === arg.default && arg.default) {
        // *** Note: An argument's value in the effect's
        // *** arguments is automatically set if the value
        // *** stored in this state changes. If the value
        // *** in the state doesn't change then the value
        // *** needs to be set manually.
        setEffectArgs((prev) => ({ ...prev, [arg.id]: booleanValue }))
      }
      // Otherwise, if the boolean value stored in the state is
      // already set to false then manually update the effect's
      // arguments with the boolean value stored in the state.
      else if (!booleanValue && arg.default === undefined) {
        // *** Note: An argument's value in the effect's
        // *** arguments is automatically set if the value
        // *** stored in this state changes. If the value
        // *** in the state doesn't change then the value
        // *** needs to be set manually.
        setEffectArgs((prev) => ({ ...prev, [arg.id]: booleanValue }))
      }
    }
  }

  /* -- RENDER -- */

  // If the argument type is "dropdown" then render
  // the dropdown.
  if (arg.type === 'dropdown' && arg.required && display) {
    return (
      <div className={`ArgEntry Dropdown`}>
        <DetailDropDown<TArgDropdownOption>
          fieldType={'required'}
          label={arg.name}
          options={arg.options}
          stateValue={dropDownValue}
          setState={setDropDownValue}
          isExpanded={false}
          renderDisplayName={(option: TArgDropdownOption) => option.name}
        />
      </div>
    )
  }
  // If the argument type is "dropdown" and the argument
  // is optional then render the optional dropdown.
  else if (arg.type === 'dropdown' && !arg.required && display) {
    return (
      <div className={`ArgEntry Dropdown`}>
        <DetailDropDown<TArgDropdownOption>
          fieldType={'optional'}
          label={arg.name}
          options={arg.options}
          stateValue={optionalDropDownValue}
          setState={setOptionalDropDownValue}
          isExpanded={false}
          renderDisplayName={(option: TArgDropdownOption) => option.name}
        />
      </div>
    )
  }
  // If the argument type is "number" and the argument
  // is required then render the number input.
  else if (arg.type === 'number' && arg.required && display) {
    return (
      <div className={`ArgEntry Number`}>
        <DetailNumber
          fieldType={'required'}
          handleOnBlur={'repopulateValue'}
          label={arg.name}
          stateValue={numberValue}
          setState={setNumberValue}
          defaultValue={arg.default}
          minimum={arg.min}
          maximum={arg.max}
          unit={arg.unit}
          placeholder='Enter a number...'
        />
      </div>
    )
  }
  // If the argument type is "number" and the argument
  // is optional then render the optional number input.
  else if (arg.type === 'number' && !arg.required && display) {
    return (
      <div className={`ArgEntry Number`}>
        <DetailNumber
          fieldType={'optional'}
          handleOnBlur={'none'}
          label={arg.name}
          stateValue={optionalNumberValue}
          setState={setOptionalNumberValue}
          minimum={arg.min}
          maximum={arg.max}
          unit={arg.unit}
          placeholder='Enter a number...'
        />
      </div>
    )
  }
  // If the argument type is "string" then render
  // the string input.
  else if (arg.type === 'string' && display) {
    return (
      <div className={`ArgEntry String`}>
        <DetailString
          fieldType={arg.required ? 'required' : 'optional'}
          handleOnBlur={arg.required ? 'repopulateValue' : 'none'}
          label={arg.name}
          stateValue={stringValue}
          setState={setStringValue}
          defaultValue={arg.default}
        />
      </div>
    )
  }
  // If the argument type is "large-string" then render
  // the large-string input.
  else if (arg.type === 'large-string' && display) {
    return (
      <div className={`ArgEntry LargeString`}>
        <DetailLargeString
          fieldType={arg.required ? 'required' : 'optional'}
          handleOnBlur={arg.required ? 'repopulateValue' : 'none'}
          label={arg.name}
          stateValue={largeStringValue}
          setState={setLargeStringValue}
          defaultValue={arg.default}
          elementBoundary='.BorderBox'
        />
      </div>
    )
  }
  // If the argument type is "boolean" then render
  // the boolean toggle.
  else if (arg.type === 'boolean' && display) {
    return (
      <div className={`ArgEntry Boolean`}>
        <DetailToggle
          fieldType='required'
          label={arg.name}
          stateValue={booleanValue}
          setState={setBooleanValue}
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
   * The effect's target.
   */
  target: ClientEffect['target']
  /**
   * The argument to render.
   */
  arg: TTargetArg
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
