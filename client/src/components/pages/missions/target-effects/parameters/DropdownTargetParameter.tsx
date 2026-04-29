import type { ClientEffect } from '@client/missions/effects/ClientEffect'
import { compute } from '@client/toolbox'
import { usePostInitEffect } from '@client/toolbox/hooks'
import type {
  TDropdownArg,
  TDropdownTargetParameterOption,
} from '@shared/target-environments/parameters/DropdownTargetParameter'
import { useEffect, useState } from 'react'
import { DetailDropdown } from '../../../../content/form/dropdowns/standard/DetailDropdown'

/**
 * Renders a dropdown for the argument whose type is `"dropdown"`.
 */
export default function DropdownTargetParameter({
  effect,
  arg,
  initialize,
  targetArguments,
  setTargetArguments,
}: TDropdownTargetParameter_P): TReactElement | null {
  /* -- STATE -- */
  const [requiredValue, setRequiredValue] = useState<TDropdownTargetParameterOption>(() => {
    // If the argument is a dropdown and the argument's value
    // is in the effect's arguments then set the dropdown value.
    if (arg.type === 'dropdown' && arg.required) {
      // Grab the dropdown option.
      let option = arg.options.find(
        (option) => option.value === targetArguments[arg._id],
      )

      // If the option is found then set the dropdown value.
      if (option) {
        return option
      } else {
        return arg.default
      }
    }

    // Otherwise, return a temporary option.
    return {
      _id: 'temporary-option',
      name: 'Select an option',
      value: null,
    }
  })
  const [optionalValue, setOptionalValue] = useState<TDropdownTargetParameterOption | null>(
    () => {
      // If the argument is a dropdown and the argument's value
      // is in the effect's arguments then set the dropdown value.
      if (arg.type === 'dropdown' && !arg.required) {
        // Grab the dropdown option.
        let option = arg.options.find(
          (option) => option.value === targetArguments[arg._id],
        )

        // If the option is found then set the dropdown value.
        if (option) {
          return option
        } else {
          return null
        }
      }

      // Otherwise, return null
      return null
    },
  )

  /* -- COMPUTED -- */

  /**
   * The dropdown options that are available based on the
   * dependencies of the argument's options.
   */
  const availableOptions: TDropdownTargetParameterOption[] = compute(() =>
    arg.type === 'dropdown'
      ? arg.options.filter((option) =>
          effect.allDependenciesMet(option.dependencies, targetArguments),
        )
      : [],
  )

  /* -- EFFECTS -- */

  // Determine if the argument needs to be initialized.
  useEffect(() => {
    if (initialize) initializeArg()
  }, [initialize])

  // Update the argument's value in the effect's arguments
  // when the argument's value changes.
  // *** Note: this doesn't execute on the first render. ***
  usePostInitEffect(() => {
    // If the argument is required, then update the
    // required value in the effect's arguments.
    if (arg.required) {
      setTargetArguments((prev) => ({ ...prev, [arg._id]: requiredValue.value }))
    }
    // Or, if the argument is optional...
    else {
      // ...and the optional value is not null
      // then update the optional value in the
      // effect's arguments.
      if (optionalValue !== null) {
        setTargetArguments((prev) => ({
          ...prev,
          [arg._id]: optionalValue.value,
        }))
      }
      // Or, if the optional value is null and the
      // argument is in the effect's arguments, then
      // remove the argument from the effect's arguments.
      else if (optionalValue === null && targetArguments[arg._id] !== undefined) {
        setTargetArguments((prev) => {
          delete prev[arg._id]
          return prev
        })
      }
    }
  }, [requiredValue, optionalValue])

  /* -- FUNCTIONS -- */

  /**
   * Initializes the argument within the effect's arguments.
   * @note *This is determined by the argument's dependencies
   * and whether the argument is required or not.*
   */
  const initializeArg = () => {
    // If the argument is required, then set the argument's
    // value to the default value.
    // *** Note: The default value is mandatory if the
    // *** argument is required.
    if (arg.required) {
      // If the required value stored in the state is the
      // same as the default value, then manually update the
      // effect's arguments by adding this argument and its
      // value.
      if (requiredValue === arg.default) {
        // *** Note: An argument's value in the effect's
        // *** arguments is automatically set if the value
        // *** stored in this state changes. If the value
        // *** in the state doesn't change then the value
        // *** needs to be set manually.
        setTargetArguments((prev) => ({ ...prev, [arg._id]: requiredValue.value }))
      }
      // Otherwise, set the required value to the default value.
      // *** Note: The default value is mandatory if the
      // *** argument is required.
      else {
        // *** Note: When this value in the state changes,
        // *** the effect's arguments automatically updates
        // *** with the current value.
        setRequiredValue(arg.default)
      }
    }
  }

  /* -- RENDER -- */

  if (arg.required) {
    return (
      <DetailDropdown<TDropdownTargetParameterOption>
        fieldType={'required'}
        label={arg.name}
        options={availableOptions}
        value={requiredValue}
        setValue={setRequiredValue}
        isExpanded={false}
        tooltipDescription={arg.tooltipDescription}
        getKey={({ _id }) => _id}
        render={({ name }) => name}
        handleInvalidOption={{
          method: 'setToDefault',
          defaultValue: arg.default,
        }}
        key={`arg-${arg._id}_type-${arg.type}_required`}
      />
    )
  } else {
    return (
      <DetailDropdown<TDropdownTargetParameterOption>
        fieldType={'optional'}
        label={arg.name}
        options={availableOptions}
        value={optionalValue}
        setValue={setOptionalValue}
        isExpanded={false}
        tooltipDescription={arg.tooltipDescription}
        getKey={(option) => option?._id}
        render={(option) => option?.name}
        handleInvalidOption={{
          method: 'setToDefault',
          defaultValue: null,
        }}
        key={`arg-${arg._id}_type-${arg.type}_optional`}
      />
    )
  }
}

/* ---------------------------- TYPES FOR DROPDOWN ARG ---------------------------- */

/**
 * The props for the `DropdownArg` component.
 */
type TDropdownTargetParameter_P = {
  /**
   * The effect that the arguments belong to.
   */
  effect: ClientEffect
  /**
   * The dropdown argument to render.
   */
  arg: TDropdownArg
  /**
   * Determines if the argument needs to be initialized.
   */
  initialize: boolean
  /**
   * The arguments that the effect uses to modify the target.
   */
  targetArguments: ClientEffect['arguments']
  /**
   * Function that updates the value of the effect's arguments
   * stored in the state.
   */
  setTargetArguments: TReactSetter<ClientEffect['arguments']>
}
