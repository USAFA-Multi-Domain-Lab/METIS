import { ClassList } from '@shared/toolbox/html/ClassList'

/* -- FUNCTIONS -- */

/**
 * Computes the base `ClassList` objects shared across all detail components.
 * Each returned `ClassList` may be further extended with component-specific
 * classes immediately after the hook is called.
 * @param options Configuration derived from the detail component's props.
 * @returns The `root`, `label`, `field`, and `fieldError` `ClassList` objects.
 */
export function useDetailClassNames({
  componentName,
  disabled,
  displayError,
  errorType,
  uniqueClassName = '',
  uniqueLabelClassName = '',
  uniqueFieldClassName = '',
}: TUseDetailClassNames_P): TUseDetailClassNames {
  let rootClasses = new ClassList(
    'Detail',
    componentName,
    uniqueClassName,
  ).set('Disabled', disabled)

  let labelClasses = new ClassList('Label', uniqueLabelClassName)
    .set('Error', displayError && errorType !== 'warning')
    .set('Warning', displayError && errorType === 'warning')

  let fieldClasses = new ClassList('Field', uniqueFieldClassName)
    .set('Error', displayError && errorType !== 'warning')
    .set('Warning', displayError && errorType === 'warning')

  let fieldErrorClasses = new ClassList('FieldErrorMessage')
    .set('Hidden', !displayError)
    .set('Warning', errorType === 'warning')

  return {
    rootClasses,
    labelClasses,
    fieldClasses,
    fieldErrorClasses,
  }
}

/* -- TYPES -- */

/**
 * Options for the `useDetailClassNames` hook.
 */
export type TUseDetailClassNames_P = {
  /**
   * The display name of the detail component (e.g. `'DetailString'`),
   * used to produce the component-specific root class.
   */
  componentName: string
  /**
   * Whether the detail field is disabled.
   */
  disabled: boolean
  /**
   * Whether an error or warning message is currently visible.
   */
  displayError: boolean
  /**
   * The visual style of the error indicator.
   */
  errorType: 'default' | 'warning'
  /**
   * An optional class added to the root element.
   * @default undefined
   */
  uniqueClassName?: string
  /**
   * An optional class added to the label element.
   * @default undefined
   */
  uniqueLabelClassName?: string
  /**
   * An optional class added to the field element.
   * @default undefined
   */
  uniqueFieldClassName?: string
}

/**
 * The `ClassList` objects returned by `useDetailClassNames`.
 */
export type TUseDetailClassNames = {
  /**
   * `ClassList` for the outermost root element.
   */
  rootClasses: ClassList
  /**
   * `ClassList` for the label element.
   */
  labelClasses: ClassList
  /**
   * `ClassList` for the interactive field element.
   */
  fieldClasses: ClassList
  /**
   * `ClassList` for the error or warning message element.
   */
  fieldErrorClasses: ClassList
}
