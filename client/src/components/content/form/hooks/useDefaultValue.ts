import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { useEffect } from 'react'

export function useDefaultValue(options: TUseDefaultValue_P): void {
  const {
    fieldType,
    stateValue,
    setState,
    defaultValue,
    focused,
    onApply = () => {},
  } = options

  // Enforce the default value on mount and
  // on blur, setting the state value to the
  // default value if the current value is
  // empty and the detail is required.
  useEffect(() => {
    if (
      !focused &&
      fieldType === 'required' &&
      StringToolbox.isEmpty(stateValue)
    ) {
      setState(defaultValue)
      onApply(defaultValue)
    }
  }, [focused])
}

/* -- TYPES -- */

/**
 * Props for {@link useDefaultValue}.
 */
export type TUseDefaultValue_P = {
  /**
   * Whether the field is required or optional.
   * Required when blank-field validation is needed.
   */
  fieldType: 'required' | 'optional'
  /**
   * The current value set in the detail.
   */
  stateValue: string
  /**
   * The state setter function for the detail's value.
   */
  setState: TReactSetter<string>
  /**
   * A default value to enforce when the current value
   * is empty and the field is required and the detail
   * is blurred.
   */
  defaultValue: string
  /**
   * Whether the field is currently focused.
   */
  focused: boolean
  /**
   * Optional callback fired after the default is applied, receiving the
   * default value. Use this to sync external representations of the field
   * (e.g. a rich-text editor's internal content) with the new value.
   * @default () => {}
   */
  onApply?: (value: string) => void
}
