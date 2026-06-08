import { useState } from 'react'
import type { TErrorDisplay } from '.'

/**
 * Computes `displayError` and `activeErrorMessage` shared across all detail
 * components. Use `errorMethod: 'simple'` for non-interactive details (e.g.
 * `DetailLocked`) and `errorMethod: 'interactive'` for input-based details to
 * get interaction-aware error gating and the `markLeftField` callback for use
 * in blur handlers.
 */
export function useErrorMessages(options: TSimpleErrorMessages_P): TSimpleResult
export function useErrorMessages(
  options: TInteractiveDisplayError_P,
): TInteractiveResult
export function useErrorMessages(
  options: TSimpleErrorMessages_P | TInteractiveDisplayError_P,
): TSimpleResult | TInteractiveResult {
  const [leftField, setLeftField] = useState(false)

  let { errorMessage } = options

  switch (options.errorMethod) {
    case 'simple':
      errorMessage = options.errorMessage.trim()
      return {
        displayError: Boolean(errorMessage),
        activeErrorMessage: errorMessage,
      }
    case 'interactive':
      let {
        errorDisplay,
        handleOnBlur,
        fieldType,
        stateIsEmpty,
        blankErrorMessage,
      } = options

      let interactionSatisfied =
        errorDisplay === 'immediate' ||
        (handleOnBlur === 'deliverError' && leftField)
      let displayError = false
      let activeErrorMessage = ''
      let errorMessageProvided = errorMessage.trim() !== ''
      let blankErrorMessageProvided = blankErrorMessage.trim() !== ''
      let fieldIsRequired = fieldType === 'required'

      // Conditional determine the state of the error message.
      if (interactionSatisfied && errorMessageProvided) {
        activeErrorMessage = errorMessage.trim()
        displayError = true
      } else if (
        interactionSatisfied &&
        fieldIsRequired &&
        blankErrorMessageProvided &&
        stateIsEmpty
      ) {
        activeErrorMessage = blankErrorMessage
        displayError = true
      }

      return {
        displayError,
        activeErrorMessage,
        markLeftField: () => setLeftField(true),
      }

    default:
      throw new Error(
        `Invalid errorMethod provided to useErrorMessages: ${(options as any).errorMethod}`,
      )
  }
}

/* -- TYPES -- */

/**
 * Options for the simple (non-interactive) variant of `useDisplayError`.
 * Use for details that have no blur event, such as `DetailLocked`.
 */
type TSimpleErrorMessages_P = {
  /**
   * The method in which the error message display is triggered.
   * @option 'simple' - A standard error that is non-interactive and does
   * not change based on user interaction with the detail.
   * @option 'interactive' - An error that supports gating the visibility of
   * the error based on user interaction with the detail.
   */
  errorMethod: 'simple'
  /**
   * The error or warning message to display.
   * @note An empty string will not display an error.
   */
  errorMessage: string
}

/**
 * Options for the interactive variant of `useDisplayError`.
 * Use for input-based details that track when the user has left the field,
 * such as `DetailString` and `DetailLargeString`.
 */
type TInteractiveDisplayError_P = {
  /**
   * The method in which the error message display is triggered.
   * @option 'simple' - A standard error that is non-interactive and does
   * not change based on user interaction with the detail.
   * @option 'interactive' - An error that supports gating the visibility of
   * the error based on user interaction with the detail.
   */
  errorMethod: 'interactive'
  /**
   * The error or warning message to display.
   * @note An empty string will not display an error.
   */
  errorMessage: string
  /**
   * Controls whether the message is shown immediately or gated behind the
   * user having left the field at least once.
   * @default 'immediate'
   */
  errorDisplay: TErrorDisplay
  /**
   * Determines what happens on blur. Only `'deliverError'` can trigger the
   * error state; other values leave `displayError` as `false`.
   */
  handleOnBlur: 'repopulateValue' | 'deliverError' | 'none'
  /**
   * Whether the field is required or optional.
   */
  fieldType: 'required' | 'optional'
  /**
   * Whether the current state value is considered empty.
   */
  stateIsEmpty: boolean
  /**
   * The string used as the error message when the field is required
   * but empty.
   * @note If another error message is passed via {@link errorMessage},
   * that message will be displayed instead.
   */
  blankErrorMessage: string
}

/**
 * Return value of the simple variant of `useDisplayError`.
 */
type TSimpleResult = {
  /**
   * Whether the error or warning message should currently be visible.
   */
  displayError: boolean
  /**
   * The resulting error message to display. This will be an empty string
   * if {@link displayError} is `false`.
   */
  activeErrorMessage: string
}

/**
 * Return value of the interactive variant of `useDisplayError`.
 */
interface TInteractiveResult extends TSimpleResult {
  /**
   * Call this inside the field's blur handler to record that the user
   * has left the field, which gates `'on-blur'` error visibility.
   */
  markLeftField: () => void
}
