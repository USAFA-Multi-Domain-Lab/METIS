import PropertyBadge from '@client/components/content/general-layout/property-badges/PropertyBadge'
import type { ResourcePool } from '@shared/missions/forces/ResourcePool'

// ! No styles

/**
 * Uses the {@link PropertyBadge} component to render
 * a resource pool's icon and remaining amount in a
 * compact way.
 */
export default function ResourcePoolBadge({
  pool,
  infiniteResources = false,
}: TResourcePoolBadge_P): TReactElement | null {
  // Prepare display properties.
  let remaining = pool.remainingAmount ?? pool.initialAmount
  let value = remaining.toString()
  // Update value to infinity symbol if resources
  // are configured to be infinite.
  if (infiniteResources) {
    value = 'ထ'
  }

  return (
    <div className='ResourceBadge'>
      <PropertyBadge
        key={pool._id}
        icon={pool.icon}
        value={value}
        description={pool.name}
      />
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link ResourcePoolBadge}.
 */
export type TResourcePoolBadge_P = {
  /**
   * The pool which contains the icon and amount
   * to be rendered in the badge.
   */
  pool: ResourcePool
  /**
   * Whether the session configuration enables infinite
   * resources, which causes the badge to display an infinity
   * symbol instead of the remaining amount.
   * @default false
   */
  infiniteResources?: boolean
}
