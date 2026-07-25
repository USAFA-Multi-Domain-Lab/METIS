import type { ClientTargetArgument } from '@client/target-environments/arguments/ClientTargetArgument'
import { useObjectFormSync } from '@client/toolbox/hooks'
import { DetailLargeString } from '../../../../content/form/DetailLargeString'
import { useMissionPageContext } from '../../context'

/**
 * Renders a large string input box for the argument whose type is `"large-string"`.
 * @throws If the argument or parameter type is not `"large-string"`.
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

  // Unreachable: the caller only renders this for a matching large-string
  // parameter. Throwing rather than returning keeps the hook count below
  // constant, since a render that bails early would break the rules of hooks.
  if (
    context.type !== 'large-string' ||
    !parameter ||
    parameter.type !== 'large-string'
  ) {
    throw new Error(
      `LargeStringArgumentDetail rendered for argument "${argument._id}" with argument type "${context.type}" and parameter type "${parameter?.type ?? 'none'}". Only a matching large-string parameter should reach this component.`,
    )
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
      key={`arg-${argument._id}_name-${parameter.name}_type-${parameter.type}`}
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
