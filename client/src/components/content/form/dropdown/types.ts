import type { ReactNode } from 'react'
import type { TDetailBase_P, TDetailOptional_P, TDetailRequired_P } from '../'

/**
 * The base properties for the Detail Dropdown component.
 */
type TDetailDropdownBase_P = TDetailBase_P & {
  /**
   * The boolean that determines if the detail is expanded.
   */
  isExpanded: boolean
  /**
   * The unique class name for the detail.
   */
  uniqueClassName?: string
  /**
   * The unique class name for the current value.
   */
  uniqueStateValueClassName?: string
  /**
   * @note This is disabled for Dropdown details.
   */
  errorMessage?: ''
  /**
   * The text to display when the value is not set.
   */
  emptyText?: string
}

/**
 * The properties for the Detail Dropdown component.
 */
export type TDetailDropdown_P<TOption> =
  | TDetailDropdownRequired_P<TOption>
  | TDetailDropdownOptional_P<TOption | null>

/**
 * The required properties for the Detail Dropdown component.
 */
type TDetailDropdownRequired_P<TOption> = TDetailRequired_P<TOption> &
  TDetailDropdownBase_P & {
    /**
     * The options available for the detail.
     */
    options: NonNullable<TOption>[]
    /**
     * The function to render the display name for the option.
     */
    render: (option: NonNullable<TOption>) => ReactNode
    /**
     * Gets the key for the given option.
     * @param option The option for which to get the key.
     * @returns The key for the given option.
     */
    getKey: (option: NonNullable<TOption>) => string
    /**
     * How to handle the selected option if it's invalid or not in the list.
     * @methods
     * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
     * - `setToFirst` - Set the selected option to the first option in the list.
     * - `warning` - Display a warning icon.
     *
     * @example
     * ```
     * handleInvalidOption={{
     *  method: 'setToDefault',
     *  defaultValue: new Object()
     * }}
     * ```
     *
     * @example
     * ```
     * handleInvalidOption={{
     * method: 'setToFirst'
     * }}
     * ```
     *
     * @example
     * ```
     * handleInvalidOption={{
     * method: 'warning',
     * message: 'This is a warning message.'
     * }}
     * ```
     */
    handleInvalidOption: TRequiredHandleInvalidOption<TOption>
  }

/**
 * The optional properties for the Detail Dropdown component.
 */
type TDetailDropdownOptional_P<TOption> = TDetailOptional_P<TOption> &
  TDetailDropdownBase_P & {
    /**
     * The options available for the detail.
     */
    options: TOption[]
    /**
     * The function to render the display name for the option.
     */
    render: (option: TOption) => ReactNode | null | undefined
    /**
     * Gets the key for the given option.
     * @param option The option for which to get the key.
     * @returns The key for the given option.
     */
    getKey: (option: TOption) => string | null | undefined
    /**
     * How to handle the selected option if it's invalid or not in the list.
     * @methods
     * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
     * - `setToFirst` - Set the selected option to the first option in the list.
     * - `warning` - Display a warning icon.
     *
     * @example
     * ```
     * handleInvalidOption={{
     *  method: 'setToDefault',
     *  defaultValue: new Object()
     * }}
     * ```
     *
     * @example
     * ```
     * handleInvalidOption={{
     * method: 'setToFirst'
     * }}
     * ```
     *
     * @example
     * ```
     * handleInvalidOption={{
     * method: 'warning',
     * message: 'This is a warning message.'
     * }}
     * ```
     */
    handleInvalidOption: TOptionalHandleInvalidOption<TOption>
  }

/**
 * How to handle the selected option if it's invalid or not in the list.
 * @methods
 * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
 * - `setToFirst` - Set the selected option to the first option in the list.
 * - `warning` - Display a warning icon.
 *
 * @example
 * ```
 * handleInvalidOption={{
 *  method: 'setToDefault',
 *  defaultValue: new Object()
 * }}
 * ```
 *
 * @example
 * ```
 * handleInvalidOption={{
 * method: 'setToFirst'
 * }}
 * ```
 *
 * @example
 * ```
 * handleInvalidOption={{
 * method: 'warning',
 * message: 'This is a warning message.'
 * }}
 * ```
 */
export type TRequiredHandleInvalidOption<TOption> =
  | TRequiredSetToDefault<TOption>
  | TSetToFirst
  | TWarning

/**
 * How to handle the selected option if it's invalid or not in the list.
 * @methods
 * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
 * - `setToFirst` - Set the selected option to the first option in the list.
 * - `warning` - Display a warning icon.
 *
 * @example
 * ```
 * handleInvalidOption={{
 *  method: 'setToDefault',
 *  defaultValue: new Object()
 * }}
 * ```
 *
 * @example
 * ```
 * handleInvalidOption={{
 * method: 'setToFirst'
 * }}
 * ```
 *
 * @example
 * ```
 * handleInvalidOption={{
 * method: 'warning',
 * message: 'This is a warning message.'
 * }}
 * ```
 */
export type TOptionalHandleInvalidOption<TOption> =
  | TOptionalSetToDefault<TOption>
  | TSetToFirst
  | TWarning

/**
 * The method that handles an invalid option by setting the selected option to the default value provided.
 * @note If the fieldType is 'required', then the default value provided cannot be null or undefined.
 * @note If the fieldType is 'optional', then the default value provided can be null or undefined.
 */
type TRequiredSetToDefault<TOption> = {
  /**
   * The method to handle the invalid option.
   * @options
   * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
   * - `setToFirst` - Set the selected option to the first option in the list.
   * - `warning` - Display a warning icon.
   */
  method: 'setToDefault'
  /**
   * The default value to set the selected option to.
   * @note If the fieldType is 'required', then the default value provided cannot be null or undefined.
   * @note If the fieldType is 'optional', then the default value provided can be null or undefined.
   */
  defaultValue: NonNullable<TOption>
}

/**
 * The method that handles an invalid option by setting the selected option to the default value provided.
 * @note If the fieldType is 'required', then the default value provided cannot be null or undefined.
 * @note If the fieldType is 'optional', then the default value provided can be null or undefined.
 */
type TOptionalSetToDefault<TOption> = {
  /**
   * The method to handle the invalid option.
   * @options
   * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
   * - `setToFirst` - Set the selected option to the first option in the list.
   * - `warning` - Display a warning icon.
   */
  method: 'setToDefault'
  /**
   * The default value to set the selected option to.
   * @note If the fieldType is 'required', then the default value provided cannot be null or undefined.
   * @note If the fieldType is 'optional', then the default value provided can be null or undefined.
   */
  defaultValue: TOption
}

/**
 * The method that handles an invalid option by setting the selected option to the first option in the list.
 */
type TSetToFirst = {
  /**
   * The method to handle the invalid option.
   * @options
   * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
   * - `setToFirst` - Set the selected option to the first option in the list.
   * - `warning` - Display a warning icon.
   */
  method: 'setToFirst'
}

/**
 * The method that handles an invalid option by displaying a warning icon with a message.
 */
type TWarning = {
  /**
   * The method to handle the invalid option.
   * @options
   * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
   * - `setToFirst` - Set the selected option to the first option in the list.
   * - `warning` - Display a warning icon.
   */
  method: 'warning'
  /**
   * The message that displays when hovering over the warning icon.
   */
  message?: string
}

/**
 * Consolidated state for the {@link DetailDropdown}
 * component.
 */
export interface TDetailDropdown_S {
  /**
   * Whether the dropdown is expanded or not.
   */
  expanded: TReactState<boolean>
}

/**
 * Props for the {@link DropdownOption} component.
 */
export type TDropdownOption_P = {
  /**
   * The React children to be displayed inside the dropdown option.
   * @note Typically this will be plain text.
   */
  children?: ReactNode
  /**
   * Whether the option is selected or not.
   * @note Applies special styling to the option.
   * @default false
   */
  selected?: boolean
  /**
   * Callback for when the option is clicked.
   */
  onClick?: () => void
}
