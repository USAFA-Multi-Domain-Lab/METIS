import { useEffect, useState } from 'react'
import { ClientEffect } from 'src/missions/effects'
import { usePostInitEffect } from 'src/toolbox/hooks'
import { TBooleanArg } from '../../../../../../shared/target-environments/args/boolean-arg'
import { DetailToggle } from '../../../content/form/DetailToggle'

/**
 * Renders a toggle switch for the argument whose type is `"boolean"`.
 */
export default function ArgBoolean({
  arg,
  initialize,
  effectArgs,
  setEffectArgs,
}: TBooleanArg_P): JSX.Element | null {
  /* -- STATE -- */
  const [value, setValue] = useState<boolean>(effectArgs[arg._id] ?? false)

  /* -- EFFECTS -- */

  // Determine if the argument needs to be initialized.
  useEffect(() => {
    if (initialize) initializeArg()
  }, [initialize])

  // Update the argument's value in the effect's arguments
  // when the argument's value changes.
  // *** Note: this doesn't execute on the first render. ***
  usePostInitEffect(
    () => setEffectArgs((prev) => ({ ...prev, [arg._id]: value })),
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
    if (arg.default !== undefined && value === arg.default) {
      // *** Note: An argument's value in the effect's
      // *** arguments is automatically set if the value
      // *** stored in this state changes. If the value
      // *** in the state doesn't change then the value
      // *** needs to be set manually.
      setEffectArgs((prev) => ({ ...prev, [arg._id]: value }))
    }
    // Or, if the argument has a default value and the
    // value stored in the state is not the default value,
    // then update the value in the state to the default value.
    else if (arg.default !== undefined && value !== arg.default) {
      // *** Note: When this value in the state changes,
      // *** the effect's arguments automatically updates
      // *** with the current value.
      setValue(arg.default)
    }
    // Otherwise, manually set the argument's value in the
    // effect's arguments to `false`.
    else {
      // *** Note: An argument's value in the effect's
      // *** arguments is automatically set if the value
      // *** stored in this state changes. If the value
      // *** in the state doesn't change then the value
      // *** needs to be set manually.
      setEffectArgs((prev) => ({ ...prev, [arg._id]: false }))
    }
  }

  /* -- RENDER -- */
  return (
    <DetailToggle
      fieldType='required'
      label={arg.name}
      value={value}
      setValue={setValue}
      tooltipDescription={arg.tooltipDescription}
      key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}_required`}
    />
  )
}

/* ---------------------------- TYPES FOR BOOLEAN ARG ---------------------------- */

/**
 * The props for the `BooleanArg` component.
 */
type TBooleanArg_P = {
  /**
   * The boolean argument to render.
   */
  arg: TBooleanArg
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
