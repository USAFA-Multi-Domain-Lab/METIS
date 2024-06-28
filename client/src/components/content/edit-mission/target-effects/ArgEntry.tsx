import { useEffect, useState } from 'react'
import { ClientEffect } from 'src/missions/effects'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import { ReactSetter } from 'src/toolbox/types'
import { TTargetArg } from '../../../../../../shared/target-environments/args'
import { TDropdownArgOption } from '../../../../../../shared/target-environments/args/dropdown-arg'
import { DetailDropDown } from '../../form/DetailDropDown'
import { DetailLargeString } from '../../form/DetailLargeString'
import { DetailNumber } from '../../form/DetailNumber'
import { DetailString } from '../../form/DetailString'
import { DetailToggle } from '../../form/DetailToggle'
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
  const [dropDownValue, setDropDownValue] = useState<TDropdownArgOption>(() => {
    // If the argument is a dropdown and the argument's value
    // is in the effect's arguments then set the dropdown value.
    if (arg.type === 'dropdown' && arg.required) {
      // Grab the dropdown option.
      let option: TDropdownArgOption | undefined = arg.options.find(
        (option: TDropdownArgOption) => option._id === effectArgs[arg._id],
      )

      // If the option is found then set the dropdown value.
      if (option) {
        return option
      } else {
        return arg.default
      }
    } else {
      return {
        _id: 'temporary-option',
        name: 'Select an option',
      }
    }
  })
  const [optionalDropDownValue, setOptionalDropDownValue] =
    useState<TDropdownArgOption | null>(() => {
      // If the argument is a dropdown and the argument's value
      // is in the effect's arguments then set the dropdown value.
      if (arg.type === 'dropdown' && !arg.required) {
        // Grab the dropdown option.
        let option: TDropdownArgOption | undefined = arg.options.find(
          (option: TDropdownArgOption) => option._id === effectArgs[arg._id],
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
  const [numberValue, setNumberValue] = useState<number>(() => {
    // If the argument is a number and the argument's value
    // is in the effect's arguments then set the number value.
    if (arg.type === 'number' && arg.required) {
      return effectArgs[arg._id] ?? arg.default
    } else {
      return 0
    }
  })
  const [optionalNumberValue, setOptionalNumberValue] = useState<number | null>(
    effectArgs[arg._id] ?? null,
  )
  const [stringValue, setStringValue] = useState<string>(
    effectArgs[arg._id] ?? defaultStringValue,
  )
  const [largeStringValue, setLargeStringValue] = useState<string>(
    effectArgs[arg._id] ?? defaultStringValue,
  )
  const [booleanValue, setBooleanValue] = useState<boolean>(
    effectArgs[arg._id] ?? false,
  )

  /* -- COMPUTED -- */
  /**
   * Determines if all the argument's dependencies have been met.
   */
  const allDependenciesMet: boolean = compute(
    () => target?.allDependenciesMet(arg.dependencies, effectArgs) ?? false,
  )
  /**
   * The dropdown options that are available based on the
   * argument's dependencies.
   */
  const availableDropdownOptions: TDropdownArgOption[] = compute(() => {
    return arg.type === 'dropdown'
      ? arg.options.filter((option) => {
          return (
            target?.allDependenciesMet(option.dependencies, effectArgs) ?? false
          )
        })
      : []
  })

  /* -- EFFECTS -- */

  // Update the effect's arguments based on the status of
  // the argument's dependencies.
  useEffect(() => {
    // If all the dependencies have been met and the argument is
    // not in the effect's arguments then initialize the argument.
    if (allDependenciesMet && effectArgs[arg._id] === undefined) {
      initializeArg()
    }
    // Otherwise, remove the argument from the effect's arguments.
    else if (!allDependenciesMet && effectArgs[arg._id] !== undefined) {
      setEffectArgs((prev) => {
        delete prev[arg._id]
        return prev
      })
    }
  }, [allDependenciesMet])

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
        setEffectArgs((prev) => ({ ...prev, [arg._id]: dropDownValue._id }))
      }
      // Or, if the argument is optional...
      else {
        // ...and the optional drop down value is not null
        // then update the optional drop down value in the
        // effect's arguments.
        if (optionalDropDownValue !== null) {
          setEffectArgs((prev) => ({
            ...prev,
            [arg._id]: optionalDropDownValue._id,
          }))
        }
        // Or, if the optional drop down value is null and
        // the argument is in the effect's arguments then
        // remove the argument from the effect's arguments.
        else if (
          optionalDropDownValue === null &&
          effectArgs[arg._id] !== undefined
        ) {
          setEffectArgs((prev) => {
            delete prev[arg._id]
            return prev
          })
        }
      }
    }
    // Or, if the argument is a number...
    else if (arg.type === 'number') {
      // ...and the argument is required, then update
      // the number value in the effect's arguments.
      if (arg.required) {
        setEffectArgs((prev) => ({ ...prev, [arg._id]: numberValue }))
      }
      // Or, if the argument is optional...
      else {
        // ...and the optional number value is not null
        // then update the optional number value in the
        // effect's arguments.
        if (optionalNumberValue !== null) {
          setEffectArgs((prev) => ({ ...prev, [arg._id]: optionalNumberValue }))
        }
        // Or, if the optional number value is null and
        // the argument is in the effect's arguments then
        // remove the argument from the effect's arguments.
        else if (
          optionalNumberValue === null &&
          effectArgs[arg._id] !== undefined
        ) {
          setEffectArgs((prev) => {
            delete prev[arg._id]
            return prev
          })
        }
      }
    }
    // Or, if the argument is a string...
    else if (arg.type === 'string') {
      // ...and the argument's value is not in a default state
      // then update the string value in the effect's
      // arguments.
      if (stringValue !== defaultStringValue) {
        setEffectArgs((prev) => ({ ...prev, [arg._id]: stringValue }))
      }
    }
    // Or, if the argument is a large string...
    else if (arg.type === 'large-string') {
      // ...and the argument's value is not in a default state
      // then update the large string value in the effect's
      // arguments.
      if (largeStringValue !== defaultStringValue) {
        setEffectArgs((prev) => ({ ...prev, [arg._id]: largeStringValue }))
      }
    }
    // Or, if the argument is a boolean...
    else if (arg.type === 'boolean') {
      // ...then update the boolean value in the effect's arguments.
      setEffectArgs((prev) => ({ ...prev, [arg._id]: booleanValue }))
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
    // If the argument is required and all the dependencies
    // have been met...
    if (arg.required && allDependenciesMet) {
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
          setEffectArgs((prev) => ({ ...prev, [arg._id]: numberValue }))
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
          setEffectArgs((prev) => ({ ...prev, [arg._id]: booleanValue }))
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
    // Or, if the argument is optional and its type
    // is a boolean...
    else if (!arg.required && arg.type === 'boolean') {
      // ...then set the boolean value to the current value.
      // *** Note: The boolean is a special case because
      // *** it only has two states: true or false. Therefore,
      // *** the value is always defined which means that it
      // *** should always be included in the effect's arguments.
      setEffectArgs((prev) => ({ ...prev, [arg._id]: booleanValue }))
    }
  }

  /* -- RENDER -- */

  // If the argument type is "dropdown" then render
  // the dropdown.
  if (arg.type === 'dropdown' && arg.required && allDependenciesMet) {
    return (
      <div className={`ArgEntry Dropdown`}>
        <DetailDropDown<TDropdownArgOption>
          fieldType={'required'}
          label={arg.name}
          options={availableDropdownOptions}
          stateValue={dropDownValue}
          setState={setDropDownValue}
          isExpanded={false}
          tooltipDescription={arg.tooltipDescription}
          renderDisplayName={(option: TDropdownArgOption) => option.name}
          defaultValue={arg.default}
        />
      </div>
    )
  }
  // If the argument type is "dropdown" and the argument
  // is optional then render the optional dropdown.
  else if (arg.type === 'dropdown' && !arg.required && allDependenciesMet) {
    return (
      <div className={`ArgEntry Dropdown`}>
        <DetailDropDown<TDropdownArgOption>
          fieldType={'optional'}
          label={arg.name}
          options={availableDropdownOptions}
          stateValue={optionalDropDownValue}
          setState={setOptionalDropDownValue}
          isExpanded={false}
          tooltipDescription={arg.tooltipDescription}
          renderDisplayName={(option: TDropdownArgOption) => option.name}
        />
      </div>
    )
  }
  // If the argument type is "number" and the argument
  // is required then render the number input.
  else if (arg.type === 'number' && arg.required && allDependenciesMet) {
    return (
      <div className={`ArgEntry Number`}>
        <DetailNumber
          fieldType={'required'}
          label={arg.name}
          stateValue={numberValue}
          setState={setNumberValue}
          minimum={arg.min}
          maximum={arg.max}
          unit={arg.unit}
          placeholder='Enter a number...'
          tooltipDescription={arg.tooltipDescription}
        />
      </div>
    )
  }
  // If the argument type is "number" and the argument
  // is optional then render the optional number input.
  else if (arg.type === 'number' && !arg.required && allDependenciesMet) {
    return (
      <div className={`ArgEntry Number`}>
        <DetailNumber
          fieldType={'optional'}
          label={arg.name}
          stateValue={optionalNumberValue}
          setState={setOptionalNumberValue}
          minimum={arg.min}
          maximum={arg.max}
          unit={arg.unit}
          placeholder='Enter a number...'
          tooltipDescription={arg.tooltipDescription}
        />
      </div>
    )
  }
  // If the argument type is "string" then render
  // the string input.
  else if (arg.type === 'string' && allDependenciesMet) {
    return (
      <div className={`ArgEntry String`}>
        <DetailString
          fieldType={arg.required ? 'required' : 'optional'}
          handleOnBlur={arg.required ? 'repopulateValue' : 'none'}
          label={arg.name}
          stateValue={stringValue}
          setState={setStringValue}
          defaultValue={arg.default}
          tooltipDescription={arg.tooltipDescription}
        />
      </div>
    )
  }
  // If the argument type is "large-string" then render
  // the large-string input.
  else if (arg.type === 'large-string' && allDependenciesMet) {
    return (
      <div className={`ArgEntry LargeString`}>
        <DetailLargeString
          fieldType={arg.required ? 'required' : 'optional'}
          handleOnBlur={arg.required ? 'repopulateValue' : 'none'}
          label={arg.name}
          stateValue={largeStringValue}
          setState={setLargeStringValue}
          defaultValue={arg.default}
          elementBoundary='.SidePanelSection'
          tooltipDescription={arg.tooltipDescription}
        />
      </div>
    )
  }
  // If the argument type is "boolean" then render
  // the boolean toggle.
  else if (arg.type === 'boolean' && allDependenciesMet) {
    return (
      <div className={`ArgEntry Boolean`}>
        <DetailToggle
          fieldType='required'
          label={arg.name}
          stateValue={booleanValue}
          setState={setBooleanValue}
          tooltipDescription={arg.tooltipDescription}
        />
      </div>
    )
  } else {
    return null
  }
}

/* ---------------------------- TYPES FOR ARG GROUPINGS ---------------------------- */

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
