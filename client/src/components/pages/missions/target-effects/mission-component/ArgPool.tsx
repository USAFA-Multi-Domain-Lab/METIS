import type {
  TOptionalHandleInvalidOption,
  TRequiredHandleInvalidOption,
} from '@client/components/content/form/dropdown/DetailDropdown'
import { DetailDropdown } from '@client/components/content/form/dropdown/DetailDropdown'
import type { TMetisClientComponents } from '@client/index'
import type { ClientMissionForce } from '@client/missions/forces/ClientMissionForce'
import { compute } from '@client/toolbox'
import { usePostInitEffect } from '@client/toolbox/hooks/lifecycles'
import type { ResourcePool } from '@shared/missions/forces/ResourcePool'
import type { TMissionComponentArg } from '@shared/target-environments/args/mission-component/MissionComponentArg'
import { useState } from 'react'

/**
 * Renders a dropdown for the argument whose type is `"pool"`.
 */
export default function ArgPool({
  arg: { name, type, tooltipDescription },
  existsInEffectArgs,
  poolIsActive,
  isRequired,
  isOptional,
  forceValue: [forceValue],
  optionalForceValue: [optionalForceValue],
  poolValue: [poolValue, setPoolValue],
  optionalPoolValue: [optionalPoolValue, setOptionalPoolValue],
}: TArgPool_P): TReactElement | null {
  /* -- STATE -- */

  /**
   * How to handle a pool that no longer exists in the selected force.
   * @note **A warning message is displayed upon initialization if the pool
   * is not found in the selected force.**
   * @note **Post-initialization, the pool is set to the first pool in the
   * force's resource pools if the pool is not found in the selected force.**
   */
  const [handleInvalidRequiredPool, setInvalidRequiredPoolHandler] = useState<
    TRequiredHandleInvalidOption<ResourcePool<TMetisClientComponents>>
  >(() => {
    if (existsInEffectArgs) {
      return {
        method: 'warning',
        message:
          `"${poolValue.name}" is no longer available in the force selected above. ` +
          `This is likely due to the pool being deleted. Please select a valid pool, or delete this effect.`,
      }
    } else {
      return {
        method: 'warning',
      }
    }
  })

  /**
   * How to handle a pool that no longer exists in the selected force.
   * @note **A warning message is displayed upon initialization if the pool
   * is not found in the selected force.**
   * @note **Post-initialization, the pool is set to null if the pool
   * is not found in the selected force.**
   */
  const [handleInvalidOptionalPool, setInvalidOptionalPoolHandler] = useState<
    TOptionalHandleInvalidOption<ResourcePool<TMetisClientComponents> | null>
  >(() => {
    if (existsInEffectArgs) {
      return {
        method: 'warning',
        message:
          `"${optionalPoolValue?.name}" is no longer available in the force selected above. ` +
          `This is likely due to the pool being deleted. Please select a valid pool, or delete this effect.`,
      }
    } else {
      return {
        method: 'warning',
      }
    }
  })

  /* -- COMPUTED -- */

  /**
   * Determines if the method for handling an invalid pool should
   * be set to the first pool in the list or not.
   * @note **The first pool should be selected if a previously selected pool
   * is no longer available in the force selected above.**
   */
  const selectFirstPool = compute<boolean>(() => {
    if (
      isRequired &&
      poolIsActive &&
      !forceValue.resourcePools.includes(poolValue) &&
      handleInvalidRequiredPool.method === 'warning'
    ) {
      return true
    }

    return false
  })

  /**
   * Determines if the pool value should be set to null
   * in the effect's arguments.
   */
  const selectDefaultPool = compute<boolean>(() => {
    if (
      isOptional &&
      poolIsActive &&
      optionalForceValue !== null &&
      optionalPoolValue !== null &&
      !optionalForceValue.resourcePools.includes(optionalPoolValue) &&
      handleInvalidRequiredPool.method === 'warning'
    ) {
      return true
    }

    return false
  })

  /**
   * The list of pools to display in the dropdown.
   */
  const pools = compute<ResourcePool<TMetisClientComponents>[]>(() => {
    if (isOptional) {
      return optionalForceValue ? optionalForceValue.resourcePools : []
    }
    return forceValue.resourcePools
  })

  /**
   * The tooltip description to display for a pool argument.
   */
  const poolTooltip = compute<string>(() => {
    if (type === 'pool' && tooltipDescription) {
      return tooltipDescription
    }

    return ''
  })

  /**
   * The label to display for a pool dropdown.
   */
  const label = compute<string>(() => (type === 'pool' ? name : 'Pool'))

  /**
   * Determines if the pool dropdown should be hidden or not.
   */
  const hidden = compute<boolean>(() => !poolIsActive || pools.length === 0)

  /* -- EFFECTS -- */

  // Determines what to do with the selected pool if a different
  // force is selected.
  // *** Note: this doesn't execute on the first render. ***
  usePostInitEffect(() => {
    // If the force's value in the state changes and the first pool
    // should be selected, then set the pool's value to the first pool
    // of the force selected above.
    if (selectFirstPool) {
      setInvalidRequiredPoolHandler({
        method: 'setToFirst',
      })
    }

    // If the force's value in the state changes and the default pool
    // should be selected, then set the pool's value to null.
    if (selectDefaultPool) {
      setInvalidOptionalPoolHandler({
        method: 'setToDefault',
        defaultValue: null,
      })
    }
  }, [forceValue, optionalForceValue])

  /* -- RENDER -- */

  if (hidden) return null

  if (isOptional) {
    return (
      <DetailDropdown<ResourcePool<TMetisClientComponents>>
        fieldType={'optional'}
        label={label}
        options={pools}
        value={optionalPoolValue}
        setValue={setOptionalPoolValue}
        tooltipDescription={poolTooltip}
        isExpanded={false}
        render={(option) => option?.name}
        getKey={(option) => option?._id}
        handleInvalidOption={handleInvalidOptionalPool}
        emptyText='Select a pool'
      />
    )
  }

  return (
    <DetailDropdown<ResourcePool<TMetisClientComponents>>
      fieldType={'required'}
      label={label}
      options={pools}
      value={poolValue}
      setValue={setPoolValue}
      tooltipDescription={poolTooltip}
      isExpanded={false}
      getKey={({ _id }) => _id}
      render={({ name }) => name}
      handleInvalidOption={handleInvalidRequiredPool}
    />
  )
}

/* ---------------------------- TYPES FOR POOL ARG ---------------------------- */

/**
 * The props for the `ArgPool` component.
 */
type TArgPool_P = {
  /**
   * The mission component argument to render.
   */
  arg: TMissionComponentArg
  /**
   * Determines if the argument is already present in the effect's arguments.
   */
  existsInEffectArgs: boolean
  /**
   * Determines if the pool should be present in the effect's arguments
   * and if the pool dropdown should be displayed.
   */
  poolIsActive: boolean
  /**
   * Determines if the argument is required.
   */
  isRequired: boolean
  /**
   * Determines if the argument is optional.
   */
  isOptional: boolean
  /**
   * The force value to display in the dropdown.
   */
  forceValue: TReactState<ClientMissionForce>
  /**
   * The optional force value to display in the dropdown.
   */
  optionalForceValue: TReactState<ClientMissionForce | null>
  /**
   * The pool value to display in the dropdown.
   */
  poolValue: TReactState<ResourcePool<TMetisClientComponents>>
  /**
   * The optional pool value to display in the dropdown.
   */
  optionalPoolValue: TReactState<ResourcePool<TMetisClientComponents> | null>
}
