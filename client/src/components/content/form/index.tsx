/* ---------------------------- TYPES FOR FORMS ---------------------------- */

/**
 * The base properties for the details.
 */
export type TDetailBase_P = {
  /**
   * The label for the detail.
   * @note If null is passed, the label will not be displayed.
   */
  label: string | null
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
   * An error or warning message sourced externally (e.g. from an issue checker).
   * When non-empty, this error message is shown whenever the field is blurred,
   * or when the field is being corrected due to an existing error.
   * @default ''
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
   * This value is applied to the field on mount and on every blur when
   * the field is empty.
   * @note This only applies to required details.
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
