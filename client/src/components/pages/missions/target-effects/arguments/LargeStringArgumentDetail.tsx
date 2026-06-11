import type { ClientTargetArgument } from '@client/target-environments/arguments/ClientTargetArgument'
import { useObjectFormSync } from '@client/toolbox/hooks'
import { DetailLargeString } from '../../../../content/form/DetailLargeString'
import { useMissionPageContext } from '../../context'

/**
 * Renders a large string input box for the argument whose type is `"large-string"`.
 * @note Renders nothing if the argument or parameter type is not `"large-string"`.
 */
export default function LargeStringArgumentDetail({
  argument,
}: TLargeStringArgumentDetail_P): TReactElement | null {
  let { parameter } = argument

  /* -- STATE -- */

  const { onChange } = useMissionPageContext()
  const formState = useObjectFormSync(argument, ['context'], {
    onChange: () => onChange(argument),
  })
  const [context, setContext] = formState.context

  /* -- VALIDATION -- */

  if (
    context.type !== 'large-string' ||
    !parameter ||
    parameter.type !== 'large-string'
  ) {
    return null
  }

  /* -- STATE (CONTINUED) -- */

  const { value } = context
  const setValue: TReactSetter<string> = (
    newValue: TReactSetterParameter<string>,
  ): void => {
    setContext({
      ...context,
      value: typeof newValue === 'function' ? newValue(value) : newValue,
    })
  }

  /* -- RENDER -- */

  return (
    <DetailLargeString
      fieldType={parameter.required ? 'required' : 'optional'}
      label={parameter.name}
      value={value}
      setValue={setValue}
      defaultValue={parameter.required ? parameter.default : undefined}
      tooltipDescription={parameter.tooltipDescription}
      key={`arg-${argument._id}_name-${parameter.name}_type-${parameter.type}_${
        parameter.required ? 'required' : 'optional'
      }`}
    />
  )
}

/* -- TYPES -- */

/**
 * Props for {@link LargeStringArgumentDetail}.
 */
type TLargeStringArgumentDetail_P = {
  /**
   * A large-string argument to render for view/edit.
   */
  argument: ClientTargetArgument
}
