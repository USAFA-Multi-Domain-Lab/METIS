import type { ClientTargetArgument } from '@client/target-environments/arguments/ClientTargetArgument'
import { useObjectFormSync } from '@client/toolbox/hooks'
import { DetailToggle } from '../../../../content/form/DetailToggle'
import { useMissionPageContext } from '../../context'

/**
 * Renders a toggle switch for the argument whose type is `"boolean"`.
 * @throws If the argument or parameter type is not `"boolean"`.
 */
export default function BooleanArgumentDetail({
  argument,
}: TBooleanArgumentDetail_P): TReactElement | null {
  let { parameter } = argument

  /* -- STATE -- */

  const { onChange } = useMissionPageContext()
  const formState = useObjectFormSync(argument, ['context'], {
    onChange: () => onChange(argument),
  })
  const [context, setContext] = formState.context

  /* -- VALIDATION -- */

  // Unreachable: the caller only renders this for a matching boolean
  // parameter. Throwing rather than returning keeps the hook count below
  // constant, since a render that bails early would break the rules of hooks.
  if (
    context.type !== 'boolean' ||
    !parameter ||
    parameter.type !== 'boolean'
  ) {
    throw new Error(
      `BooleanArgumentDetail rendered for argument "${argument._id}" with argument type "${context.type}" and parameter type "${parameter?.type ?? 'none'}". Only a matching boolean parameter should reach this component.`,
    )
  }

  /* -- STATE (CONTINUED) -- */

  const setValue: TReactSetter<boolean> = (
    newValue: TReactSetterParameter<boolean>,
  ): void => {
    setContext({
      ...context,
      value:
        typeof newValue === 'function' ? newValue(context.value) : newValue,
    })
  }

  /* -- RENDER -- */

  return (
    <DetailToggle
      fieldType='required'
      label={parameter.name}
      value={context.value}
      setValue={setValue}
      tooltipDescription={parameter.tooltipDescription}
      key={`arg-${argument._id}_name-${parameter.name}_type-${parameter.type}_required`}
    />
  )
}

/* -- TYPES -- */

/**
 * Props for {@link BooleanArgumentDetail}.
 */
type TBooleanArgumentDetail_P = {
  /**
   * A boolean argument to render for view/edit.
   */
  argument: ClientTargetArgument
}
