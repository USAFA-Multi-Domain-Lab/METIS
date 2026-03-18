import PropertyBadge from '@client/components/content/general-layout/property-badges/PropertyBadge'
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
  cheats = MissionSession.NO_CHEATS,
  config = MissionSession.DEFAULT_CONFIG,
}: TResourceCostBadges_P): TReactElement | null {
  return (
    <>
      {action.resourceCosts.map((cost) => {
        // Don't render badges for zero cost resources.
        if (cost.amount === 0) return null

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
            icon='coins'
            value={StringToolbox.sign(cost.amount, true)} // Cost should be displayed as a negative value.
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
