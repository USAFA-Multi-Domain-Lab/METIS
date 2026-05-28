import type { ClientTargetArgument } from '@client/target-environments/arguments/ClientTargetArgument'
import { compute } from '@client/toolbox'
import { useObjectFormSync } from '@client/toolbox/hooks'
import { useMemo } from 'react'
import { DetailString } from '../../../../content/form/DetailString'
import { useMissionPageContext } from '../../context'

/**
 * Renders a string input box for the argument whose type is `"string"`.
 * @note Renders nothing if the argument or parameter type is not `"string"`.
 */
export default function StringArgumentDetail({
  argument,
}: TStringArgumentDetail_P): TReactElement | null {
  let { parameter } = argument

  /* -- STATE -- */

  const { onChange } = useMissionPageContext()
  const formState = useObjectFormSync(argument, ['context'], {
    onChange: () => onChange(argument),
  })
  const [context, setContext] = formState.context

  /* -- VALIDATION -- */

  // Make sure the argument and parameter are
  // both strings, otherwise this react component
  // cannot function, therefore return null so
  // nothing is rendered.
  if (context.type !== 'string' || !parameter || parameter.type !== 'string') {
    return null
  }

  /* -- STATE (CONTINUED) -- */

  const { value } = context
  const setValue: TReactSetter<string> = (
    newValue: TReactSetterParameter<string>,
  ): void => {
    console.log('setting value')
    setContext({
      ...context,
      value: typeof newValue === 'function' ? newValue(value) : newValue,
    })
  }

  /* -- COMPUTED -- */

  // An error message to display in the detail
  // when the string doesn't match the required
  // pattern of the parameter.
  let patternErrorMessage = useMemo(() => {
    const defaultMessage =
      'This field cannot be left empty. Please enter a value.'
    const emptyStringPattern = /^\s*$/
    const valueIsEmptyString = emptyStringPattern.test(value)
    const defaultValueIsEmptyString = parameter.required
      ? emptyStringPattern.test(parameter.default)
      : false

    // Skip validation for optional args with empty values.
    if (!parameter.required && valueIsEmptyString) return undefined

    // If no pattern is provided, fall back to a generic
    // required-field check only when the default value is
    // also empty. Fields with a non-empty default will
    // repopulate on blur instead.
    if (!(parameter.pattern instanceof RegExp)) {
      if (valueIsEmptyString && defaultValueIsEmptyString) {
        return defaultMessage
      }

      return undefined
    }

    // Validate the value against the pattern.
    if (!parameter.pattern.test(value)) {
      return parameter.title ?? 'The value does not match the required format.'
    }

    return undefined
  }, [value, parameter])
  let handleOnBlur = compute<'deliverError' | 'repopulateValue' | 'none'>(
    () => {
      if (patternErrorMessage) {
        return 'deliverError'
      } else if (parameter.required) {
        return 'repopulateValue'
      } else {
        return 'none'
      }
    },
  )

  /* -- RENDER -- */
  return (
    <DetailString
      fieldType={parameter.required ? 'required' : 'optional'}
      handleOnBlur={handleOnBlur}
      label={parameter.name}
      value={value}
      setValue={setValue}
      defaultValue={parameter.required ? parameter.default : undefined}
      errorMessage={patternErrorMessage}
      errorType='warning'
      errorDisplay={'immediate'}
      tooltipDescription={parameter.tooltipDescription}
      key={`arg-${argument._id}_name-${parameter.name}_type-${parameter.type}_${
        parameter.required ? 'required' : 'optional'
      }`}
    />
  )
}

/* -- TYPES -- */

/**
 * The props for the {@link StringArgumentDetail} component.
 */
type TStringArgumentDetail_P = {
  /**
   * A string argument to render for view/edit.
   */
  argument: ClientTargetArgument
}
