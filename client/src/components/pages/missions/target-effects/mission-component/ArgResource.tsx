import { DetailDropdown } from '@client/components/content/form/dropdowns/standard/DetailDropdown'
import type { TMetisClientComponents } from '@client/index'
import type { ClientEffect } from '@client/missions/effects/ClientEffect'
import { compute } from '@client/toolbox'
import type { MissionResource } from '@shared/missions/MissionResource'
import type { TMissionComponentArg } from '@shared/target-environments/args/mission-component/MissionComponentArg'

/**
 * Renders a dropdown for the argument whose type is `"resource"`.
 */
export default function ArgResource({
  effect: { mission },
  arg: { name, type, tooltipDescription, required },
  existsInEffectArgs,
  resourceIsActive,
  resourceValue: [resourceValue, setResourceValue],
  optionalResourceValue: [optionalResourceValue, setOptionalResourceValue],
}: TArgResource_P): TReactElement | null {
  /* -- COMPUTED -- */

  /**
   * The list of resources to display in the dropdown.
   */
  const resources = compute<MissionResource<TMetisClientComponents>[]>(
    () => mission.resources,
  )

  /**
   * The warning message to display when the resource is no longer available in the mission.
   */
  const warningMessage = compute<string>(() => {
    if (existsInEffectArgs) {
      const name = required ? resourceValue.name : optionalResourceValue?.name
      return (
        `"${name}" is no longer available in the mission. ` +
        `This is likely due to the resource being deleted. Please select a valid resource, or delete this effect.`
      )
    } else {
      return ''
    }
  })

  /**
   * The tooltip description to display for a resource argument.
   */
  const resourceTooltip = compute<string>(() => {
    if (type === 'resource' && tooltipDescription) {
      return tooltipDescription
    }

    return ''
  })

  /**
   * The label to display for the resource dropdown.
   */
  const label = compute<string>(() => (type === 'resource' ? name : 'Resource'))

  /**
   * Determines if the resource dropdown should be hidden or not.
   */
  const hidden = compute<boolean>(() => !resourceIsActive)

  /* -- RENDER -- */

  if (hidden) return null

  if (!required) {
    return (
      <DetailDropdown<MissionResource<TMetisClientComponents>>
        fieldType={'optional'}
        label={label}
        options={resources}
        value={optionalResourceValue}
        setValue={setOptionalResourceValue}
        tooltipDescription={resourceTooltip}
        isExpanded={false}
        render={(option) => option?.name}
        getKey={(option) => option?._id}
        handleInvalidOption={{
          method: 'warning',
          message: warningMessage,
        }}
        emptyText='Select a resource'
      />
    )
  }

  return (
    <DetailDropdown<MissionResource<TMetisClientComponents>>
      fieldType={'required'}
      label={label}
      options={resources}
      value={resourceValue}
      setValue={setResourceValue}
      tooltipDescription={resourceTooltip}
      isExpanded={false}
      getKey={({ _id }) => _id}
      render={({ name }) => name}
      handleInvalidOption={{
        method: 'warning',
        message: warningMessage,
      }}
    />
  )
}

/* ---------------------------- TYPES FOR RESOURCE ARG ---------------------------- */

/**
 * The props for the `ArgResource` component.
 */
type TArgResource_P = {
  /**
   * The effect that the arguments belong to.
   */
  effect: ClientEffect
  /**
   * The mission component argument to render.
   */
  arg: TMissionComponentArg
  /**
   * Determines if the argument is already present in the effect's arguments.
   */
  existsInEffectArgs: boolean
  /**
   * Determines if the resource should be present in the effect's arguments
   * and if the resource dropdown should be displayed.
   */
  resourceIsActive: boolean
  /**
   * The resource value to display in the dropdown.
   */
  resourceValue: TReactState<MissionResource<TMetisClientComponents>>
  /**
   * The optional resource value to display in the dropdown.
   */
  optionalResourceValue: TReactState<MissionResource<TMetisClientComponents> | null>
}
