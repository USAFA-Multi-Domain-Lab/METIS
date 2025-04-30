import { useEffect, useState } from 'react'
import { ClientEffect } from 'src/missions/effects'
import ClientMissionForce from 'src/missions/forces'
import { compute } from 'src/toolbox'
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

  // Force
  const [defaultForce] = useState<ClientMissionForce>(effect.force)
  const [forceId] = useState<string>(ForceArg.FORCE_ID_KEY)
  const [forceName] = useState<string>(ForceArg.FORCE_NAME_KEY)
  const [forceValue, setForceValue] = useState<ClientMissionForce>(() => {
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

      // Otherwise, return the default force.
      return defaultForce
    }
    // Otherwise, return the default force.
    else {
      return defaultForce
    }
  })
  const [optionalForceValue, setOptionalForceValue] =
    useState<ClientMissionForce | null>(() => {
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
    })

  /* -- COMPUTED -- */

  /**
   * Determines if the argument is required.
   */
  const isRequired: boolean = compute(() => arg.required)

  /**
   * Determines if the argument is optional.
   */
  const isOptional: boolean = compute(() => !arg.required)

  /**
   * Determines if the argument is already present in the effect's arguments.
   */
  const existsInEffectArgs: boolean = compute(
    () => effectArgs[arg._id] !== undefined,
  )

  /**
   * The list of forces to display in the dropdown.
   */
  const forces: ClientMissionForce[] = compute(() => mission.forces)

  /**
   * The warning message to display when the force is no longer available in the mission.
   */
  const forceWarningMessage: string = compute(() => {
    if (existsInEffectArgs) {
      return (
        `"${
          effectArgs[arg._id][forceName]
        }" is no longer available in the mission. ` +
        `This is likely due to the force being deleted. Please select a valid force, or delete this effect.`
      )
    } else {
      return ''
    }
  })

  /**
   * Determines if the force value should be inserted or updated in the
   * effect's arguments.
   */
  const upsertForce: boolean = compute(() => {
    // If the argument is required then add the force value
    // to the effect's arguments.
    if (isRequired) return true

    // If the argument is optional and a force has been selected
    // then upsert the force to the effect's arguments.
    if (isOptional && optionalForceValue !== null) {
      return true
    }

    // Otherwise, return false.
    return false
  })

  /**
   * Determines if the force value should be removed from the
   * effect's arguments.
   */
  const removeForce: boolean = compute(() => {
    // If the argument is optional, a force hasn't been selected,
    // yet the argument exists in the effect's arguments then remove
    // the force value from the effect's arguments.
    if (isOptional && optionalForceValue === null && existsInEffectArgs) {
      return true
    }

    // Otherwise, return false.
    return false
  })

  /* -- EFFECTS -- */

  // Determine if the argument needs to be initialized.
  useEffect(() => {
    if (initialize) initializeArg()
  }, [initialize])

  // Update the argument's value in the effect's arguments
  // when any of the required argument's values in the state changes.
  // *** Note: this doesn't execute on the first render. ***
  usePostInitEffect(() => {
    if (upsertForce) {
      upsert({ force: forceValue })
    }
  }, [forceValue])

  // Update the argument's value in the effect's arguments
  // when any of the optional argument's values in the state changes.
  // *** Note: this doesn't execute on the first render. ***
  usePostInitEffect(() => {
    if (upsertForce) {
      upsert({ force: optionalForceValue })
    }

    if (removeForce) {
      remove(optionalForceValue)
    }
  }, [optionalForceValue])

  /* -- FUNCTIONS -- */

  /**
   * Initializes the argument within the effect's arguments.
   * @note *This is determined by the argument's dependencies
   * and whether the argument is required or not.*
   */
  const initializeArg = () => {
    // If the argument is required, then set the argument's
    // values to their default values.
    // *** Note: A default value is mandatory if the
    // *** argument is required.
    if (arg.required) {
      // If the force value stored in the state is the
      // same as the default force value, then manually
      // update the effect's arguments by adding this argument
      // and its value.
      if (forceValue === defaultForce) {
        // *** Note: An argument's value in the effect's
        // *** arguments is automatically set if the value
        // *** stored in this state changes. If the value
        // *** in the state doesn't change then the value
        // *** needs to be set manually.
        upsert({ force: forceValue })
      }
      // Otherwise, set the force value to the default force value.
      // *** Note: A default value is mandatory if the
      // *** argument is required.
      else {
        upsert({ force: defaultForce })
      }
    }
  }

  /**
   * Updates or inserts the provided argument(s) into the effect's arguments.
   * @param stateValues The values to set in the effect's arguments.
   * @param stateValues.force The force value to set in the effect's arguments.
   */
  const upsert = (stateValues: { force?: ClientMissionForce | null }) => {
    const { force } = stateValues
    let data: ClientEffect['args'] = {}

    if (force) {
      data = {
        forceId: force._id,
        forceName: force.name,
      }
    }

    setEffectArgs((prev) => ({
      ...prev,
      [arg._id]: {
        ...prev[arg._id],
        ...data,
      },
    }))
  }

  /**
   * Removes the argument from the effect's arguments.
   * @param forceValue The force value to remove.
   * @note An argument that is required should never be removed
   * from the effect's arguments.
   */
  const remove = (forceValue: ClientMissionForce | null) => {
    setEffectArgs((prev) => {
      if (!forceValue) {
        delete prev[arg._id][forceId]
        delete prev[arg._id][forceName]
      }

      // If the argument is empty, then remove the argument
      // from the effect's arguments.
      if (
        Object.keys(prev[arg._id]).length === 0 &&
        prev[arg._id][forceId] === undefined
      ) {
        delete prev[arg._id]
      }

      return prev
    })
  }

  /* -- RENDER -- */

  if (isRequired) {
    return (
      <DetailDropdown<ClientMissionForce>
        fieldType={'required'}
        label={'Force'}
        options={forces}
        stateValue={forceValue}
        setState={setForceValue}
        isExpanded={false}
        tooltipDescription={arg.tooltipDescription}
        getKey={({ _id }) => _id}
        render={(option) => option.name}
        handleInvalidOption={{
          method: 'warning',
          message: forceWarningMessage,
        }}
        key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}_force_required`}
      />
    )
  } else {
    return (
      <DetailDropdown<ClientMissionForce>
        fieldType={'optional'}
        label={'Force'}
        options={forces}
        stateValue={optionalForceValue}
        setState={setOptionalForceValue}
        isExpanded={false}
        tooltipDescription={arg.tooltipDescription}
        render={(option) => option?.name}
        getKey={(option) => option?._id}
        handleInvalidOption={{
          method: 'warning',
          message: forceWarningMessage,
        }}
        emptyText='Select a force'
        key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}_force_optional`}
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
  setEffectArgs: TReactSetter<ClientEffect['args']>
}
