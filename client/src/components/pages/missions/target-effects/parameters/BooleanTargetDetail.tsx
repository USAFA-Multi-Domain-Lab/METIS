import type { ClientEffect } from '@client/missions/effects/ClientEffect'
import { usePostInitEffect } from '@client/toolbox/hooks'
import type { TBooleanTargetParameter } from '@shared/target-environments/parameters/BooleanTargetParameter'
import { useEffect, useState } from 'react'
import { DetailToggle } from '../../../../content/form/DetailToggle'

/**
 * Renders a toggle switch for the argument whose type is `"boolean"`.
 */
export default function BooleanTargetDetail({
  parameter,
  initialize,
  targetArguments,
  setTargetArguments,
}: TBooleanTargetDetail_P): TReactElement | null {
  /* -- STATE -- */
  const [value, setValue] = useState<boolean>(
    targetArguments[parameter._id] ?? false,
  )

  /* -- EFFECTS -- */

  // Determine if the argument needs to be initialized.
  useEffect(() => {
    if (initialize) initializeArg()
  }, [initialize])

  // Update the argument's value in the effect's arguments
  // when the argument's value changes.
  // *** Note: this doesn't execute on the first render. ***
  usePostInitEffect(
    () => setTargetArguments((prev) => ({ ...prev, [parameter._id]: value })),
    [value],
  )

  /* -- FUNCTIONS -- */
  /**
   * Initializes the argument within the effect's arguments.
   * @note *This is determined by the argument's dependencies.*
   */
  const initializeArg = () => {
    // If the argument's value stored in the state is the
    // same as the default value, then manually update the
    // effect's arguments by adding this argument and its
    // value.
    if (parameter.default !== undefined && value === parameter.default) {
      // *** Note: An argument's value in the effect's
      // *** arguments is automatically set if the value
      // *** stored in this state changes. If the value
      // *** in the state doesn't change then the value
      // *** needs to be set manually.
      setTargetArguments((prev) => ({ ...prev, [parameter._id]: value }))
    }
    // Or, if the argument has a default value and the
    // value stored in the state is not the default value,
    // then update the value in the state to the default value.
    else if (parameter.default !== undefined && value !== parameter.default) {
      // *** Note: When this value in the state changes,
      // *** the effect's arguments automatically updates
      // *** with the current value.
      setValue(parameter.default)
    }
    // Otherwise, manually set the argument's value in the
    // effect's arguments to `false`.
    else {
      // *** Note: An argument's value in the effect's
      // *** arguments is automatically set if the value
      // *** stored in this state changes. If the value
      // *** in the state doesn't change then the value
      // *** needs to be set manually.
      setTargetArguments((prev) => ({ ...prev, [parameter._id]: false }))
    }
  }

  /* -- RENDER -- */
  return (
    <DetailToggle
      fieldType='required'
      label={parameter.name}
      value={value}
      setValue={setValue}
      tooltipDescription={parameter.tooltipDescription}
      key={`arg-${parameter._id}_name-${parameter.name}_type-${parameter.type}_required`}
    />
  )
}

/* ---------------------------- TYPES FOR BOOLEAN ARG ---------------------------- */

/**
 * The props for the `BooleanArg` component.
 */
type TBooleanTargetDetail_P = {
  /**
   * The number parameter defining the requirements for the argument.
   */
  parameter: TBooleanTargetParameter
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
