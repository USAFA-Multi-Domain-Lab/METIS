import PropertyBadges from '@client/components/content/general-layout/property-badges/PropertyBadges'
import type { TMetisClientComponents } from '@client/index'
import type { ResourcePool } from '@shared/missions/forces/ResourcePool'
import { useSessionPageContext } from '../../context'
import SessionTopBar from '../SessionTopBar'
import ResourcePoolBadge from './ResourcePoolBadge'

// ! Styles in SessionPage.scss

/**
 * A row of resource pool badges on the {@link SessionTopBar} component.
 */
export default function ResourcePoolBadgeRow({
  rowNumber,
}: TResourcePoolBadgeRow_P): TReactElement | null {
  const { session, state } = useSessionPageContext()
  const [resourcePools] = state.resourcePools
  let poolsInRow: ResourcePool<TMetisClientComponents>[] = Array.from(
    resourcePools,
  ).slice((rowNumber - 1) * 4, rowNumber * 4)

  return (
    <div className='ResourcePoolBadgeRow'>
      <PropertyBadges>
        {poolsInRow.map((pool) => (
          <ResourcePoolBadge
            key={`pool-badge_${pool._id}`}
            pool={pool}
            infiniteResources={session.config.infiniteResources}
            compactFormattingEnabled
          />
        ))}
      </PropertyBadges>
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link ResourcePoolBadgeRow}.
 */
export type TResourcePoolBadgeRow_P = {
  /**
   * Defines which badges to display in the row. This
   * will be the badges within the following range:
   * ```
   * (rowNumber - 1) * 4 <= poolIndex < rowNumber * 4
   * ```
   * For example, rowNumber 1 will display badges 0-3,
   * rowNumber 2 will display badges 4-7, and etc.
   */
  rowNumber: number
}
