import { DetailDropdown } from 'src/components/content/form/DetailDropdown'
import { ClientEffect } from 'src/missions/effects'
import ClientMissionForce from 'src/missions/forces'
import { compute } from 'src/toolbox'
import { TMissionComponentArg } from '../../../../../../../shared/target-environments/args/mission-component'

/**
 * Renders a dropdown for the argument whose type is `"force"`.
 */
export default function ArgForce({
  effect: { mission },
  arg: { name, type, tooltipDescription, required },
  existsInEffectArgs,
  forceIsActive,
  forceValue: [forceValue, setForceValue],
  optionalForceValue: [optionalForceValue, setOptionalForceValue],
}: TArgForce_P): JSX.Element | null {
  /* -- COMPUTED -- */

  /**
   * The list of forces to display in the dropdown.
   */
  const forces: ClientMissionForce[] = compute(() => mission.forces)

  /**
   * The warning message to display when the force is no longer available in the mission.
   */
  const warningMessage: string = compute(() => {
    if (existsInEffectArgs) {
      const forceName = required ? forceValue.name : optionalForceValue?.name
      return (
        `"${forceName}" is no longer available in the mission. ` +
        `This is likely due to the force being deleted. Please select a valid force, or delete this effect.`
      )
    } else {
      return ''
    }
  })

  /**
   * The tooltip description to display for a force argument.
   */
  const forceTooltip: string = compute(() => {
    if (type === 'force' && tooltipDescription) {
      return tooltipDescription
    }

    return ''
  })

  /**
   * The label to display for the force dropdown.
   */
  const label: string = compute(() => (type === 'force' ? name : 'Force'))

  /* -- RENDER -- */

  if (!forceIsActive) return null

  if (required) {
    return (
      <DetailDropdown<ClientMissionForce>
        fieldType={'required'}
        label={label}
        options={forces}
        stateValue={forceValue}
        setState={setForceValue}
        tooltipDescription={forceTooltip}
        isExpanded={false}
        getKey={({ _id }) => _id}
        render={({ name }) => name}
        handleInvalidOption={{
          method: 'warning',
          message: warningMessage,
        }}
      />
    )
  } else {
    return (
      <DetailDropdown<ClientMissionForce>
        fieldType={'optional'}
        label={label}
        options={forces}
        stateValue={optionalForceValue}
        setState={setOptionalForceValue}
        tooltipDescription={forceTooltip}
        isExpanded={false}
        render={(option) => option?.name}
        getKey={(option) => option?._id}
        handleInvalidOption={{
          method: 'warning',
          message: warningMessage,
        }}
        emptyText='Select a force'
      />
    )
  }
}

/* ---------------------------- TYPES FOR FORCE ARG ---------------------------- */

/**
 * The props for the `ArgForce` component.
 */
type TArgForce_P = {
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
   * Determines if the force should be present in the effect's arguments
   * and if the force dropdown should be displayed.
   */
  forceIsActive: boolean
  /**
   * The force value to display in the dropdown.
   */
  forceValue: TReactState<ClientMissionForce>
  /**
   * The optional force value to display in the dropdown.
   */
  optionalForceValue: TReactState<ClientMissionForce | null>
}
