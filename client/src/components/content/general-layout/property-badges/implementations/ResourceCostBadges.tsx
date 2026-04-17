import PropertyBadge from '@client/components/content/general-layout/property-badges/PropertyBadge'
import { ClientActionCost } from '@client/missions/actions/ClientActionCost'
import type { ClientMissionAction } from '@client/missions/actions/ClientMissionAction'
import { compute } from '@client/toolbox'
import type { TExecutionCheats } from '@shared/missions/actions/ActionExecution'
import type { TSessionConfig } from '@shared/sessions/MissionSession'
import { MissionSession } from '@shared/sessions/MissionSession'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'

// ! No styles

/**
 * Uses the {@link PropertyBadge} component to render
 * all resource costs which have a non-zero cost
 * associated with a given action.
 */
export default function ResourceCostBadges({
  action,
  effectiveTime = null,
  cheats = MissionSession.NO_CHEATS,
  config = MissionSession.DEFAULT_CONFIG,
}: TResourceCostBadges_P): TReactElement | null {
  return (
    <>
      {action.includedCosts.map((cost) => {
        let effectiveAmount = cost.amount
        if (effectiveTime) {
          effectiveAmount = cost.getEffectiveAmount(effectiveTime)
        }

        // Don't render badges for zero cost resources.
        if (effectiveAmount === 0) return null

        // Find associated resource.
        let resource = action.mission.getResourceById(cost.resourceId)
        if (!resource) {
          console.warn(
            `Resource with ID ${cost.resourceId} not found for action ${action.name}. Therefore, a badge was not rendered.`,
          )
          return null
        }

        let resourceCostStrikethroughReason = compute<string>(() => {
          if (cheats.zeroCost) return 'Cheats Applied'
          if (config.infiniteResources) return 'Infinite Resources Enabled'
          return ''
        })

        return (
          <PropertyBadge
            key={cost._id}
            icon={cost.icon}
            value={ClientActionCost.formatAmount(effectiveAmount, cost.hidden)}
            description={`${StringToolbox.toTitleCase(resource.name)} Cost`}
            strikethrough={Boolean(resourceCostStrikethroughReason)}
            strikethroughReason={resourceCostStrikethroughReason}
          />
        )
      })}
    </>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link ResourceCostBadges}.
 */
export type TResourceCostBadges_P = {
  /**
   * The action containing the details of the resource
   * cost to be rendered in the badge.
   */
  action: ClientMissionAction
  /**
   * Sets a specified time to evaluate the effective resource cost
   * value. This essentially tells the component to render the
   * resource cost as it was at the specified time, not the live value.
   * If `null`, the cost will be the live value, and it will update
   * accordingly if the cost is modified.
   */
  effectiveTime?: number | Date | null
  /**
   * The cheats that will be applied to the action, which
   * may disable the resource cost if the zero cost cheat
   * is enabled.
   * @default MissionSession.NO_CHEATS
   */
  cheats?: TExecutionCheats
  /**
   * The session configuration, which may disable the resource cost
   * if infinite resources is enabled.
   * @default MissionSession.DEFAULT_CONFIG
   */
  config?: TSessionConfig
}
