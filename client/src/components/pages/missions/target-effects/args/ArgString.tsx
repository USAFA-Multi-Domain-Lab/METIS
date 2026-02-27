import type { ClientEffect } from '@client/missions/effects/ClientEffect'
import { compute } from '@client/toolbox'
import { usePostInitEffect } from '@client/toolbox/hooks'
import type { TStringArg } from '@shared/target-environments/args/StringArg'
import { useEffect, useState } from 'react'
import { DetailString } from '../../../../content/form/DetailString'

/**
 * Renders a string input box for the argument whose type is `"string"`.
 */
export default function ArgString({
  arg,
  initialize,
  effectArgs,
  setEffectArgs,
}: TStringArg_P): TReactElement | null {
  /* -- STATE -- */
  const [defaultValue] = useState<''>('')
  const [value, setValue] = useState<string>(
    effectArgs[arg._id] ?? defaultValue,
  )
  const [patternErrorMessage, setPatternErrorMessage] = useState<
    string | undefined
  >(undefined)

  /* -- EFFECTS -- */

  // Determine if the argument needs to be initialized.
  useEffect(() => {
    if (initialize) initializeArg()
  }, [initialize])

  useEffect(() => {
    let errorMessage = resolvePatternErrorMessage(value, arg)
    setPatternErrorMessage(errorMessage)
  }, [arg, value])

  // Update the argument's value in the effect's arguments
  // when the argument's value changes.
  // *** Note: this doesn't execute on the first render. ***
  usePostInitEffect(() => {
    // If the argument's value is not in a default state
    // then update the string argument's value in the effect's
    // arguments.
    if (value !== defaultValue) {
      setEffectArgs((prev) => ({ ...prev, [arg._id]: value }))
    }

    // Otherwise, remove the argument from the effect's
    // arguments.
    if (value === defaultValue) {
      setEffectArgs((prev) => {
        let updatedArgs: ClientEffect['args'] = { ...prev }

        delete updatedArgs[arg._id]
        return updatedArgs
      })
    }
  }, [patternErrorMessage, value])

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
      // If the argument's value stored in the state is the
      // same as the default value, then manually update the
      // effect's arguments by adding this argument and its
      // value.
      if (value === arg.default) {
        // *** Note: An argument's value in the effect's
        // *** arguments is automatically set if the value
        // *** stored in this state changes. If the value
        // *** in the state doesn't change then the value
        // *** needs to be set manually.
        setEffectArgs((prev) => ({ ...prev, [arg._id]: value }))
      }
      // Otherwise, set the argument's value to the default value.
      // *** Note: The default value is mandatory if the
      // *** argument is required.
      else {
        // *** Note: When this value in the state changes,
        // *** the effect's arguments automatically updates
        // *** with the current value.
        setValue(arg.default)
      }
    }
  }

  /**
   * Determines the validation error message for a string value.
   * @param value The string value to validate.
   * @param arg The string argument that contains the pattern and title for validation.
   * @returns The error message if invalid, otherwise undefined.
   */
  const resolvePatternErrorMessage = (
    value: string,
    arg: TStringArg,
  ): string | undefined => {
    const defaultMessage =
      'This field cannot be left empty. Please enter a value.'
    const emptyStringPattern = /^\s*$/
    const valueIsEmptyString = emptyStringPattern.test(value)
    const defaultValueIsEmptyString = arg.required
      ? emptyStringPattern.test(arg.default)
      : false

    // Skip validation for optional args with empty values.
    if (!arg.required && valueIsEmptyString) return undefined

    // If no pattern is provided, fall back to a generic
    // required-field check only when the default value is
    // also empty. Fields with a non-empty default will
    // repopulate on blur instead.
    if (!(arg.pattern instanceof RegExp)) {
      if (valueIsEmptyString && defaultValueIsEmptyString) {
        return defaultMessage
      }

      return undefined
    }

    // Validate the value against the pattern.
    if (!arg.pattern.test(value)) {
      return arg.title ?? 'The value does not match the required format.'
    }

    return undefined
  }

  /* -- COMPUTED -- */

  const handleOnBlur = compute<'deliverError' | 'repopulateValue' | 'none'>(
    () => {
      if (patternErrorMessage) {
        return 'deliverError'
      } else if (arg.required) {
        return 'repopulateValue'
      } else {
        return 'none'
      }
    },
  )

  const highlightAllOnFocus = compute<boolean>(
    () => arg.required && value === arg.default,
  )

  /* -- RENDER -- */
  return (
    <DetailString
      fieldType={arg.required ? 'required' : 'optional'}
      handleOnBlur={handleOnBlur}
      label={arg.name}
      value={value}
      setValue={setValue}
      defaultValue={arg.required ? arg.default : undefined}
      highlightAllOnFocus={highlightAllOnFocus}
      errorMessage={patternErrorMessage}
      errorType='warning'
      tooltipDescription={arg.tooltipDescription}
      key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}_${
        arg.required ? 'required' : 'optional'
      }`}
    />
  )
}

/* ---------------------------- TYPES FOR STRING ARG ---------------------------- */

/**
 * The props for the `StringArg` component.
 */
type TStringArg_P = {
  /**
   * The string argument to render.
   */
  arg: TStringArg
  /**
   * Determines if the argument needs to be initialized.
   */
  initialize: boolean
  /**
   * The arguments that the effect uses to modify the target.
   */
  effectArgs: ClientEffect['args']
  /**
   * Function that updates the value of the effect's arguments
   * stored in the state.
   */
  setEffectArgs: TReactSetter<ClientEffect['args']>
}
