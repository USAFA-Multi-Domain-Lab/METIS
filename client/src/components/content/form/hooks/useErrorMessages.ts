import { useMountHandler, usePostInitEffect } from '@client/toolbox/hooks'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { useState } from 'react'

/**
 * Used by various detail components to manage when error messages
 * are displayed.
 *
 * Determines the active error message to display based on the
 * provided arguments. This hook manages the logic for when to
 * show the error message, gating it to create a clean user experience.
 * Even when errors are present, they are deferred while the user
 * is typing until they leave the field. However, if an error is found
 * after they leave the field, reentering the field to correct the error
 * will show live updates of the error message as they type. Leaving the
 * field again without an error will reset it to the deferred behavior.
 */
export function useErrorMessages(options: TUseErrorMessages_P): TResult {
  const {
    errorMessage,
    fieldType,
    inputValue,
    focused,
    blankErrorMessage = '',
  } = options

  /* -- STATE -- */

  const [liveMode, setLiveMode] = useState(false)

  /* -- COMPUTED -- */

  let customErrorProvided = StringToolbox.isFilled(errorMessage)
  let blankErrorProvided = StringToolbox.isFilled(blankErrorMessage)
  let inputValueIsFilled = StringToolbox.isFilled(inputValue)
  let fieldIsRequired = fieldType === 'required'
  let blankErrorApplies =
    fieldIsRequired && blankErrorProvided && !inputValueIsFilled
  let pendingError = customErrorProvided || blankErrorApplies
  let activeErrorMessage = ''

  // Determine the active error message. Prioritize custom
  // errors over the blank error.
  if (liveMode && customErrorProvided) activeErrorMessage = errorMessage
  else if (liveMode && blankErrorApplies) activeErrorMessage = blankErrorMessage

  /* -- EFFECTS -- */

  // Immediately present custom errors on mount.
  useMountHandler((done) => {
    if (customErrorProvided) setLiveMode(true)
    done()
  })

  // Enter live mode if an error is found when blurred. Errors that
  // arrive after the field is left, such as the result of a lookup
  // started on blur, are picked up here as well.
  usePostInitEffect(() => {
    if (!focused) setLiveMode(pendingError)
  }, [inputValue, focused, pendingError])

  /* -- RENDER -- */

  return {
    displayError: StringToolbox.isFilled(activeErrorMessage),
    activeErrorMessage,
  }
}

/* -- TYPES -- */

/**
 * Props for {@link useErrorMessages}.
 */
export type TUseErrorMessages_P = {
  /**
   * An error or warning message sourced externally (e.g. from the issue
   * checker). A non-empty value causes the error to show immediately.
   */
  errorMessage: string
  /**
   * Whether the field is required or optional.
   * Required when blank-field validation is needed.
   */
  fieldType: 'required' | 'optional'
  /**
   * The current value in the input field.
   */
  inputValue: string
  /**
   * Whether the field is currently focused.
   */
  focused: boolean
  /**
   * The message to display when the field is required but empty.
   * Only shown after the user has left the field at least once.
   */
  blankErrorMessage?: string
}

/**
 * Return value of `useErrorMessages`.
 */
type TResult = {
  /**
   * Whether the error or warning message should currently be visible.
   */
  displayError: boolean
  /**
   * The message to display. Empty string when `displayError` is `false`.
   */
  activeErrorMessage: string
}
