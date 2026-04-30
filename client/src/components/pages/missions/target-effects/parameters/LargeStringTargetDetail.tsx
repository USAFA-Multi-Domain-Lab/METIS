import type { ClientEffect } from '@client/missions/effects/ClientEffect'
import { usePostInitEffect } from '@client/toolbox/hooks'
import type { TLargeStringTargetParameter } from '@shared/target-environments/parameters/LargeStringTargetParameter'
import { useEffect, useState } from 'react'
import { DetailLargeString } from '../../../../content/form/DetailLargeString'

/**
 * Renders a large string input box for the argument whose type is `"large-string"`.
 */
export default function LargeStringTargetDetail({
  parameter,
  initialize,
  targetArguments,
  setTargetArguments,
}: TLargeStringTargetDetail_P): TReactElement | null {
  /* -- STATE -- */
  const [defaultValue] = useState<''>('')
  const [value, setValue] = useState<string>(
    targetArguments[parameter._id] ?? defaultValue,
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
      setTargetArguments((prev) => ({ ...prev, [parameter._id]: value }))
    }

    // Otherwise, remove the argument from the effect's
    // arguments.
    if (value === defaultValue) {
      setTargetArguments((prev) => {
        delete prev[parameter._id]
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
    if (parameter.required) {
      // If the argument's value stored in the state is the
      // same as the default value, then manually update the
      // effect's arguments by adding this argument and its
      // value.
      if (value === parameter.default) {
        // *** Note: An argument's value in the effect's
        // *** arguments is automatically set if the value
        // *** stored in this state changes. If the value
        // *** in the state doesn't change then the value
        // *** needs to be set manually.
        setTargetArguments((prev) => ({ ...prev, [parameter._id]: value }))
      }
      // Otherwise, set the argument's value to the default value.
      // *** Note: The default value is mandatory if the
      // *** argument is required.
      else {
        // *** Note: When this value in the state changes,
        // *** the effect's arguments automatically updates
        // *** with the current value.
        setValue(parameter.default)
      }
    }
  }

  /* -- RENDER -- */
  return (
    <DetailLargeString
      fieldType={parameter.required ? 'required' : 'optional'}
      handleOnBlur={parameter.required ? 'repopulateValue' : 'none'}
      label={parameter.name}
      value={value}
      setValue={setValue}
      defaultValue={parameter.required ? parameter.default : undefined}
      errorDisplay={'immediate'}
      tooltipDescription={parameter.tooltipDescription}
      key={`arg-${parameter._id}_name-${parameter.name}_type-${parameter.type}_${
        parameter.required ? 'required' : 'optional'
      }`}
    />
  )
}

/* ---------------------------- TYPES FOR LARGE STRING ARG ---------------------------- */

/**
 * The props for the `LargeStringArg` component.
 */
type TLargeStringTargetDetail_P = {
  /**
   * The larget-string parameter defining the requirements for the argument.
   */
  parameter: TLargeStringTargetParameter
  /**
   * Determines if the argument needs to be initialized.
   */
  initialize: boolean
  /**
   * The arguments that the effect passed to the script
   * of the target.
   */
  targetArguments: ClientEffect['arguments']
  /**
   * Function that updates the value of the effect's arguments
   * stored in the state.
   */
  setTargetArguments: TReactSetter<ClientEffect['arguments']>
}
