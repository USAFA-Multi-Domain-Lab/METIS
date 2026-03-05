/* ---------------------------- TYPES FOR FORMS ---------------------------- */

/**
 * Controls when a detail component shows its error or warning message.
 * @option `'on-blur'` errors appear after the user leaves the field (default behaviour).
 * @option `'immediate'` errors and warnings appear on mount or on change, without
 * requiring user interaction. Use this when embedding details in a context where
 * validation state should always be visible (e.g. the effect entry side panel).
 */
export type TErrorDisplay = 'on-blur' | 'immediate'

/**
 * The base properties for the details.
 */
export type TDetailBase_P = {
  /**
   * The label for the detail.
   */
  label: string
  /**
   * Boolean that determines if the detail should be disabled.
   */
  disabled?: boolean
  /**
   * The unique class name for the label.
   */
  uniqueLabelClassName?: string
  /**
   * The unique class name for the field.
   */
  uniqueFieldClassName?: string
  /**
   * The error message to display if the detail has an error.
   * @default 'At least one character is required here.'
   */
  errorMessage?: string
  /**
   * The type of error message to display if the detail has an error.
   * @default 'default'
   * @option 'default' will display the error message in a red error style.
   * @option 'warning' will display the error message in a yellow warning style.
   */
  errorType?: 'default' | 'warning'
  /**
   * The tooltip description for the detail.
   */
  tooltipDescription?: string
  /**
   * Controls when the error or warning message is shown.
   * Overrides the mode set by a surrounding {@link DetailContextProvider}.
   * @default 'on-blur' (or whatever the nearest provider specifies)
   */
  errorDisplay?: TErrorDisplay
}

/**
 * The properties needed for required details.
 */
export interface TDetailRequired_P<Type> extends TDetailBase_P {
  /**
   * Field type for the detail.
   * @note Determines if the field should allow empty strings
   * and/or if the field should display the optional text.
   */
  fieldType: 'required'
  /**
   * The value stored in a component's state that
   * will be displayed in the detail.
   */
  value: NonNullable<Type>
  /**
   * React setter function used to update the value stored
   * in a component's state.
   */
  setValue: TReactSetter<NonNullable<Type>>
}

/**
 * The properties needed for optional details.
 */
export interface TDetailOptional_P<Type> extends TDetailBase_P {
  /**
   * Field type for the detail.
   * @note Determines if the field should allow empty strings
   * and/or if the field should display the optional text.
   */
  fieldType: 'optional'
  /**
   * The value stored in a component's state that
   * will be displayed in the detail.
   */
  value: Type
  /**
   * React setter function used to update the value stored
   * in a component's state.
   */
  setValue: TReactSetter<Type>
}

/**
 * The properties needed for every type of detail component.
 */
export type TDetail_P<Type> = TDetailRequired_P<Type> | TDetailOptional_P<Type>

/**
 * The properties for the details that use an input field.
 */
export type TDetailWithInput_P<Type> = TDetail_P<Type> & {
  /**
   * **Determines what happens when the user leaves the field.**
   * @type `'repopulateValue'` will repopulate the field with the default value
   * if the field is empty or in a default state. (*The field type must be required
   * and the default value must be correctly defined for this to work.*)
   * @type `'deliverError'` will deliver an error message if the field is empty.
   * (*The field type must be required for this to work.*)
   * @type `'none'` will do nothing when the user leaves the field.
   */
  handleOnBlur: 'repopulateValue' | 'deliverError' | 'none'
  /**
   * The default value that is used if the field is empty.
   */
  defaultValue?: Type
  /**
   * The placeholder for the input.
   * @default 'Enter [input value type] here...'
   * @note The default value is determined by the input type.
   * For example, if the input type is 'text', then the default
   * value will be 'Enter text here...'.
   */
  placeholder?: string
}
