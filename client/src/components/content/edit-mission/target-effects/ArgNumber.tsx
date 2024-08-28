import { useEffect, useState } from 'react'
import { ClientEffect } from 'src/missions/effects'
import { usePostInitEffect } from 'src/toolbox/hooks'
import { TNumberArg } from '../../../../../../shared/target-environments/args/number-arg'
import { DetailNumber } from '../../form/DetailNumber'

/**
 * Renders a number input box for the argument whose type is `"number"`.
 */
export default function ArgNumber({
  arg,
  initialize,
  effectArgs,
  setEffectArgs,
}: TNumberArg_P): JSX.Element | null {
  /* -- STATE -- */
  const [requiredValue, setRequiredValue] = useState<number>(() => {
    // If the argument is a number and the argument's value
    // is in the effect's arguments then set the number value.
    if (arg.type === 'number' && arg.required) {
      return effectArgs[arg._id] ?? arg.default
    } else {
      return 0
    }
  })
  const [optionalValue, setOptionalValue] = useState<number | null>(
    effectArgs[arg._id] ?? null,
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
    // If the argument is required, then update
    // the required value in the effect's arguments.
    if (arg.required) {
      setEffectArgs((prev) => ({ ...prev, [arg._id]: requiredValue }))
    }
    // Or, if the argument is optional...
    else {
      // ...and the optional value is not null
      // then update the optional value in the
      // effect's arguments.
      if (optionalValue !== null) {
        setEffectArgs((prev) => ({ ...prev, [arg._id]: optionalValue }))
      }
      // Or, if the optional value is null and the
      // argument is in the effect's arguments then
      // remove the argument from the effect's arguments.
      else if (optionalValue === null && effectArgs[arg._id] !== undefined) {
        setEffectArgs((prev) => {
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
        setEffectArgs((prev) => ({ ...prev, [arg._id]: requiredValue }))
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
      <DetailNumber
        fieldType={'required'}
        label={arg.name}
        stateValue={requiredValue}
        setState={setRequiredValue}
        minimum={arg.min}
        maximum={arg.max}
        unit={arg.unit}
        placeholder='Enter a number...'
        tooltipDescription={arg.tooltipDescription}
        key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}_required`}
      />
    )
  } else {
    return (
      <DetailNumber
        fieldType={'optional'}
        label={arg.name}
        stateValue={optionalValue}
        setState={setOptionalValue}
        minimum={arg.min}
        maximum={arg.max}
        unit={arg.unit}
        placeholder='Enter a number...'
        tooltipDescription={arg.tooltipDescription}
        key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}_optional`}
      />
    )
  }
}

/* ---------------------------- TYPES FOR NUMBER ARG ---------------------------- */

/**
 * The props for the `NumberArg` component.
 */
type TNumberArg_P = {
  /**
   * The number argument to render.
   */
  arg: TNumberArg
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
  setEffectArgs: ReactSetter<ClientEffect['args']>
}
