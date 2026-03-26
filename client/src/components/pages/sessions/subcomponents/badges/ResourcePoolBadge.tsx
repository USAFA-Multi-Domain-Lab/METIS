import PropertyBadge from '@client/components/content/general-layout/property-badges/PropertyBadge'
import type { ResourcePool } from '@shared/missions/forces/ResourcePool'
import { NumberToolbox } from '@shared/toolbox/numbers/NumberToolbox'
import { useSessionPageContext } from '../../context'

// ! No styles

/**
 * Uses the {@link PropertyBadge} component to render
 * a resource pool's icon and remaining amount in a
 * compact way.
 */
export default function ResourcePoolBadge({
  pool,
  infiniteResources = false,
  compactFormattingEnabled = false,
}: TResourcePoolBadge_P): TReactElement | null {
  useSessionPageContext() // Only use on the session page.

  // Prepare display properties.
  let remaining = pool.balance ?? pool.initialBalance
  let value = compactFormattingEnabled
    ? NumberToolbox.formatCompact(remaining)
    : remaining.toLocaleString('en-US')
  let description = `**${pool.name}:** *${remaining.toLocaleString('en-US')}*`
  // Update value to infinity symbol if resources
  // are configured to be infinite.
  if (infiniteResources) {
    value = 'ထ'
  }

  return (
    <div className='ResourcePoolBadge'>
      <PropertyBadge
        key={pool._id}
        icon={pool.icon}
        value={value}
        description={description}
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
  /**
   * Whether the badge should be rendered in a compact form,
   * which uses a shorter number format for the remaining amount.
   * @default false
   */
  compactFormattingEnabled?: boolean
}
