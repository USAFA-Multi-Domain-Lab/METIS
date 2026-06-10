import type { ClientTargetArgument } from '@client/target-environments/arguments/ClientTargetArgument'
import { useObjectFormSync } from '@client/toolbox/hooks'
import type { TDropdownTargetParameterOption } from '@shared/target-environments/parameters/DropdownTargetParameter'
import { DetailDropdown } from '../../../../content/form/dropdowns/standard/DetailDropdown'
import { useMissionPageContext } from '../../context'

/**
 * Renders a dropdown for the argument whose type is `"dropdown"`.
 * @note Renders nothing if the argument or parameter type is not `"dropdown"`.
 */
export default function DropdownArgumentDetail({
  argument,
}: TDropdownArgumentDetail_P): TReactElement | null {
  let { parameter } = argument

  /* -- STATE -- */

  const { onChange } = useMissionPageContext()
  const formState = useObjectFormSync(argument, ['context'], {
    onChange: () => onChange(argument),
  })
  const [context, setContext] = formState.context

  /* -- VALIDATION -- */

  if (
    context.type !== 'dropdown' ||
    !parameter ||
    parameter.type !== 'dropdown'
  ) {
    return null
  }

  /* -- STATE (CONTINUED) -- */

  const { value } = context

  /* -- COMPUTED -- */

  let currentOption =
    parameter.options.find((option) => option.value === value) ?? null
  let staleWarningMessage =
    'The previously selected option is no longer available. Please select a new option.'

  /* -- RENDER -- */

  if (parameter.required) {
    let displayValue: TDropdownTargetParameterOption =
      currentOption ?? {
        _id: `${argument._id}-stale`,
        name: `${String(value)} (no longer available)`,
        value: value,
      }

    const setValue: TReactSetter<TDropdownTargetParameterOption> = (
      newValue: TReactSetterParameter<TDropdownTargetParameterOption>,
    ): void => {
      const option =
        typeof newValue === 'function' ? newValue(displayValue) : newValue
      setContext({ ...context, value: option.value })
    }

    return (
      <DetailDropdown<TDropdownTargetParameterOption>
        fieldType='required'
        label={parameter.name}
        options={parameter.options}
        value={displayValue}
        setValue={setValue}
        isExpanded={false}
        tooltipDescription={parameter.tooltipDescription}
        getKey={({ _id }) => _id}
        render={({ name }) => name}
        handleInvalidOption={{ method: 'warning', message: staleWarningMessage }}
        key={`arg-${argument._id}_type-${parameter.type}_required`}
      />
    )
  } else {
    let isStale =
      value !== null && value !== undefined && currentOption === null
    let displayValue: TDropdownTargetParameterOption | null = isStale
      ? {
          _id: `${argument._id}-stale`,
          name: `${String(value)} (no longer available)`,
          value: value,
        }
      : currentOption

    const setValue: TReactSetter<TDropdownTargetParameterOption | null> = (
      newValue: TReactSetterParameter<TDropdownTargetParameterOption | null>,
    ): void => {
      let option =
        typeof newValue === 'function' ? newValue(displayValue) : newValue
      setContext({
        ...context,
        value: option?.value ?? null,
      })
    }

    return (
      <DetailDropdown<TDropdownTargetParameterOption>
        fieldType='optional'
        label={parameter.name}
        options={parameter.options}
        value={displayValue}
        setValue={setValue}
        isExpanded={false}
        tooltipDescription={parameter.tooltipDescription}
        getKey={(option) => option?._id}
        render={(option) => option?.name}
        handleInvalidOption={{ method: 'warning', message: staleWarningMessage }}
        key={`arg-${argument._id}_type-${parameter.type}_optional`}
      />
    )
  }
}

/* -- TYPES -- */

/**
 * Props for {@link DropdownArgumentDetail}.
 */
type TDropdownArgumentDetail_P = {
  /**
   * A dropdown argument to render for view/edit.
   */
  argument: ClientTargetArgument
}
