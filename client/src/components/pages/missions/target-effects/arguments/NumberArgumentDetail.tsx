import type { ClientTargetArgument } from '@client/target-environments/arguments/ClientTargetArgument'
import { useObjectFormSync } from '@client/toolbox/hooks'
import { DetailNumber } from '../../../../content/form/DetailNumber'
import { useMissionPageContext } from '../../context'

/**
 * Renders a number input box for the argument whose type is `"number"`.
 * @note Renders nothing if the argument or parameter type is not `"number"`.
 */
export default function NumberArgumentDetail({
  argument,
}: TNumberArgumentDetail_P): TReactElement | null {
  let { parameter } = argument

  /* -- STATE -- */

  const { onChange } = useMissionPageContext()
  const formState = useObjectFormSync(argument, ['context'], {
    onChange: () => onChange(argument),
  })
  const [context, setContext] = formState.context

  /* -- VALIDATION -- */

  if (context.type !== 'number' || !parameter || parameter.type !== 'number') {
    return null
  }

  /* -- STATE (CONTINUED) -- */

  const { value } = context

  /* -- RENDER -- */

  const sharedProps = {
    label: parameter.name,
    minimum: parameter.min,
    maximum: parameter.max,
    integersOnly: parameter.integersOnly,
    unit: parameter.unit,
    placeholder: 'Enter a number...',
    tooltipDescription: parameter.tooltipDescription,
    key: `arg-${argument._id}_name-${parameter.name}_type-${parameter.type}_${
      parameter.required ? 'required' : 'optional'
    }`,
  } as const

  if (parameter.required) {
    let defaultedValue = value ?? parameter.default

    return (
      <DetailNumber
        {...sharedProps}
        fieldType='required'
        value={defaultedValue}
        setValue={(newValue: TReactSetterParameter<number>): void => {
          newValue =
            typeof newValue === 'function' ? newValue(defaultedValue) : newValue
          if (newValue === null) {
            newValue = parameter.default
          }
          setContext({
            ...context,
            value: newValue,
          })
        }}
      />
    )
  } else {
    return (
      <DetailNumber
        {...sharedProps}
        fieldType='optional'
        value={context.value}
        setValue={(newValue: TReactSetterParameter<number | null>): void => {
          setContext({
            ...context,
            value:
              typeof newValue === 'function'
                ? newValue(context.value)
                : newValue,
          })
        }}
      />
    )
  }
}

/* -- TYPES -- */

/**
 * Props for {@link NumberArgumentDetail}.
 */
type TNumberArgumentDetail_P = {
  /**
   * A number argument to render for view/edit.
   */
  argument: ClientTargetArgument
}
