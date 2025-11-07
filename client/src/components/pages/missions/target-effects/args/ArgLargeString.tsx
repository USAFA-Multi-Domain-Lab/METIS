import type { ClientEffect } from '@client/missions/effects/ClientEffect'
import { usePostInitEffect } from '@client/toolbox/hooks'
import type { TLargeStringArg } from '@shared/target-environments/args/LargeStringArg'
import { useEffect, useState } from 'react'
import { DetailLargeString } from '../../../../content/form/DetailLargeString'

/**
 * Renders a large string input box for the argument whose type is `"large-string"`.
 */
export default function ArgLargeString({
  arg,
  initialize,
  effectArgs,
  setEffectArgs,
}: TLargeStringArg_P): TReactElement | null {
  /* -- STATE -- */
  const [defaultValue] = useState<''>('')
  const [value, setValue] = useState<string>(
    effectArgs[arg._id] ?? defaultValue,
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
    // If the argument's value is not in a default state
    // then update the large string argument's value in
    // the effect's arguments.
    if (value !== defaultValue) {
      setEffectArgs((prev) => ({ ...prev, [arg._id]: value }))
    }

    // Otherwise, remove the argument from the effect's
    // arguments.
    if (value === defaultValue) {
      setEffectArgs((prev) => {
        delete prev[arg._id]
        return prev
      })
    }
  }, [value])

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

  /* -- RENDER -- */
  return (
    <DetailLargeString
      fieldType={arg.required ? 'required' : 'optional'}
      handleOnBlur={arg.required ? 'repopulateValue' : 'none'}
      label={arg.name}
      value={value}
      setValue={setValue}
      defaultValue={arg.required ? arg.default : undefined}
      tooltipDescription={arg.tooltipDescription}
      key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}_${
        arg.required ? 'required' : 'optional'
      }`}
    />
  )
}

/* ---------------------------- TYPES FOR LARGE STRING ARG ---------------------------- */

/**
 * The props for the `LargeStringArg` component.
 */
type TLargeStringArg_P = {
  /**
   * The large string argument to render.
   */
  arg: TLargeStringArg
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
