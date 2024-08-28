import { useEffect, useState } from 'react'
import { ClientEffect } from 'src/missions/effects'
import ClientMissionForce from 'src/missions/forces'
import { usePostInitEffect } from 'src/toolbox/hooks'
import ForceArg, {
  TForceArg,
} from '../../../../../../shared/target-environments/args/force-arg'
import { DetailDropdown } from '../../form/DetailDropdown'

/**
 * Renders a dropdown for the argument whose type is `"force"`.
 */
export default function ArgForce({
  effect,
  effect: { mission },
  arg,
  initialize,
  effectArgs,
  setEffectArgs,
}: TForceArgEntry_P): JSX.Element | null {
  /* -- STATE -- */
  const [defaultValue] = useState<ClientMissionForce>(effect.force)
  const [forceId] = useState<string>(ForceArg.FORCE_ID_KEY)
  const [forceName] = useState<string>(ForceArg.FORCE_NAME_KEY)
  const [requiredValue, setRequiredValue] = useState<ClientMissionForce>(() => {
    // If the argument is required and the argument's value
    // is in the effect's arguments...
    if (arg.required && effectArgs[arg._id]) {
      // Search for the force in the mission.
      let force = mission.getForce(effectArgs[arg._id][forceId])
      // If the force is found then return the force.
      if (force) return force
      // If the force is not found, but the effect's arguments
      // contains the force's ID and name then return a force
      // object using the ID and name from the effect's arguments.
      // *** Note: This will display the user's previous selection
      // *** in the dropdown even though it no longer exists in the
      // *** mission.
      if (
        force === undefined &&
        effectArgs[arg._id][forceId] !== undefined &&
        effectArgs[arg._id][forceName] !== undefined
      ) {
        return new ClientMissionForce(mission, {
          _id: effectArgs[arg._id][forceId],
          name: effectArgs[arg._id][forceName],
        })
      }

      // Otherwise, return the default value.
      return defaultValue
    }
    // Otherwise, return the default value.
    else {
      return defaultValue
    }
  })
  const [optionalValue, setOptionalValue] = useState<ClientMissionForce | null>(
    () => {
      // If the argument is optional and the argument's value
      // is in the effect's arguments...
      if (!arg.required && effectArgs[arg._id]) {
        // Search for the force in the mission.
        let force = mission.getForce(effectArgs[arg._id][forceId])
        // If the force is found then return the force.
        if (force) return force
        // If the force is not found, but the effect's arguments
        // contains the force's ID and name then return a force
        // object using the ID and name from the effect's arguments.
        // *** Note: This will display the user's previous selection
        // *** in the dropdown even though it no longer exists in the
        // *** mission.
        if (
          force === undefined &&
          effectArgs[arg._id][forceId] !== undefined &&
          effectArgs[arg._id][forceName] !== undefined
        ) {
          return new ClientMissionForce(mission, {
            _id: effectArgs[arg._id][forceId],
            name: effectArgs[arg._id][forceName],
          })
        }

        // Otherwise, return null.
        return null
      }
      // Otherwise, return null.
      else {
        return null
      }
    },
  )

  /* -- EFFECTS -- */

  // Determine if the argument needs to be initialized.
  useEffect(() => {
    if (initialize) initializeArg()
  }, [initialize])

  // Update the argument's value in the effect's arguments
  // when the argument's value changes.
  // *** Note: this doesn't execute on the first render. ***
  usePostInitEffect(() => {
    // If the argument is required, then update the
    // required value in the effect's arguments.
    if (arg.required) {
      setEffectArgs((prev) => ({
        ...prev,
        [arg._id]: {
          forceId: requiredValue._id,
          forceName: requiredValue.name,
        },
      }))
    }
    // Or, if the argument is optional...
    else {
      // ...and the optional value is not null
      // then update the optional value in the
      // effect's arguments.
      if (optionalValue !== null) {
        setEffectArgs((prev) => ({
          ...prev,
          [arg._id]: {
            forceId: optionalValue._id,
            forceName: optionalValue.name,
          },
        }))
      }
      // Or, if the optional value is null and the
      // argument is in the effect's arguments, then
      // remove the argument from the effect's arguments.
      else if (optionalValue === null && effectArgs[arg._id] !== undefined) {
        setEffectArgs((prev) => {
          delete prev[arg._id]
          return prev
        })
      }
    }
  }, [requiredValue, optionalValue])

  /* -- FUNCTIONS -- */

  /**
   * Initializes the argument within the effect's arguments.
   * @note *This is determined by the argument's dependencies
   * and whether the argument is required or not.*
   */
  const initializeArg = () => {
    // If the argument is required, then set the argument's
    // value to the default value.
    // *** Note: The default value is mandatory if the
    // *** argument is required.
    if (arg.required) {
      // If the required value stored in the state is the
      // same as the default value, then manually update the
      // effect's arguments by adding this argument and its
      // value.
      if (requiredValue === defaultValue) {
        // *** Note: An argument's value in the effect's
        // *** arguments is automatically set if the value
        // *** stored in this state changes. If the value
        // *** in the state doesn't change then the value
        // *** needs to be set manually.
        setEffectArgs((prev) => ({
          ...prev,
          [arg._id]: {
            forceId: requiredValue._id,
            forceName: requiredValue.name,
          },
        }))
      }
      // Otherwise, set the required value to the default value.
      // *** Note: The default value is mandatory if the
      // *** argument is required.
      else {
        // *** Note: When this value in the state changes,
        // *** the effect's arguments automatically updates
        // *** with the current value.
        setRequiredValue(defaultValue)
      }
    }
  }

  /* -- RENDER -- */

  if (arg.required) {
    return (
      <DetailDropdown<ClientMissionForce>
        fieldType={'required'}
        label={arg.name}
        options={mission.forces}
        stateValue={requiredValue}
        setState={setRequiredValue}
        isExpanded={false}
        tooltipDescription={arg.tooltipDescription}
        renderDisplayName={(option) => option.name}
        handleInvalidOption={{
          method: 'warning',
          message: 'This force no longer exists in the mission.',
        }}
        key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}_required`}
      />
    )
  } else {
    return (
      <DetailDropdown<ClientMissionForce>
        fieldType={'optional'}
        label={arg.name}
        options={mission.forces}
        stateValue={optionalValue}
        setState={setOptionalValue}
        isExpanded={false}
        tooltipDescription={arg.tooltipDescription}
        renderDisplayName={(option) => option.name}
        handleInvalidOption={{
          method: 'warning',
          message: 'This force no longer exists in the mission.',
        }}
        key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}_optional`}
      />
    )
  }
}

/* ---------------------------- TYPES FOR FORCE ARG ENTRY ---------------------------- */

/**
 * The props for the `ForceArgEntry` component.
 */
type TForceArgEntry_P = {
  /**
   * The effect that the arguments belong to.
   */
  effect: ClientEffect
  /**
   * The force argument to render.
   */
  arg: TForceArg
  /**
   * Determines if the argument needs to be initialized.
   */
  initialize: boolean
  /**
   * The arguments that the effect uses to modify the target.
   */
  effectArgs: ClientEffect['args']
  /**
   * Function that updates the value of the effect's arguments
   * stored in the state.
   */
  setEffectArgs: ReactSetter<ClientEffect['args']>
}
