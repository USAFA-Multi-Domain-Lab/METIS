import Tooltip from '@client/components/content/communication/Tooltip'
import type { ClientTargetArgument } from '@client/target-environments/arguments/ClientTargetArgument'
import { useObjectFormSync } from '@client/toolbox/hooks'
import { TargetArgument } from '@shared/target-environments/arguments/TargetArgument'
import type { TDropdownTargetParameterOption } from '@shared/target-environments/parameters/DropdownTargetParameter'
import { useEffect } from 'react'
import { DetailDropdown } from '../../../../content/form/dropdowns/standard/DetailDropdown'
import { useMissionPageContext } from '../../context'

/**
 * Renders a dropdown for the argument whose type is `"dropdown"`.
 * @throws If the argument or parameter type is not `"dropdown"`.
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

  // Unreachable: the caller only renders this for a matching dropdown
  // parameter. Throwing rather than returning keeps the hook count below
  // constant, since a render that bails early would break the rules of hooks.
  if (
    context.type !== 'dropdown' ||
    !parameter ||
    parameter.type !== 'dropdown'
  ) {
    throw new Error(
      `DropdownArgumentDetail rendered for argument "${argument._id}" with argument type "${context.type}" and parameter type "${parameter?.type ?? 'none'}". Only a matching dropdown parameter should reach this component.`,
    )
  }

  /* -- STATE (CONTINUED) -- */

  const { value } = context

  /* -- COMPUTED -- */

  let currentOption =
    parameter.options.find((option) => option.value === value) ?? null
  let staleWarningMessage =
    'The previously selected option is no longer available. Please select a new option.'

  /* -- EFFECTS -- */

  useEffect(() => {
    if (argument.hasIssue(TargetArgument.ISSUE_KEY_DROPDOWN_VALUE_MISMATCH)) {
      argument.value = value // Protects against race condition making sure that the value is synced when the check occurs.
      argument.triggerIssueCheck('dropdown-mismatch-resolved')
    }
  }, [value])

  /* -- RENDER -- */

  if (parameter.required) {
    let displayValue: TDropdownTargetParameterOption = currentOption ?? {
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
        render={({ name, tooltipDescription }) => {
          return (
            <>
              {name}
              <Tooltip description={tooltipDescription ?? ''} />
            </>
          )
        }}
        handleInvalidOption={{
          method: 'warning',
          message: staleWarningMessage,
        }}
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
        render={(option) => {
          return (
            <div>
              {option?.name}
              <Tooltip description={option?.tooltipDescription ?? ''} />
            </div>
          )
        }}
        handleInvalidOption={{
          method: 'warning',
          message: staleWarningMessage,
        }}
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
