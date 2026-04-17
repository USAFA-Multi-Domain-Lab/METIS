import type { TMissionOutlineItem } from './MissionOutline'
import { useMissionOutlineContext } from './MissionOutline'
import MissionOutlineSelectionGroup from './MissionOutlineSelectionGroup'

/**
 * Renders the expanded children of the given outline item.
 * Returns null if the item is collapsed or has no visible children.
 * @note Must be used within a {@link MissionOutline} component.
 */
export default function MissionOutlineChildren({
  parent,
}: TMissionOutlineChildren_P): TReactElement | null {
  const { filter, isIndirectlySelectable, state } = useMissionOutlineContext()
  const [selectedItems] = state.selectedItems

  let children = parent.outlineChildren.filter(filter)
  let isExpanded = parent.expandedInOutline

  if (!isExpanded || children.length === 0) return null

  let indirectlySelectableChildren: TMissionOutlineItem[] = []
  let otherChildren: TMissionOutlineItem[] = []

  children.forEach((child) => {
    if (isIndirectlySelectable(child, parent)) {
      indirectlySelectableChildren.push(child)
    } else {
      otherChildren.push(child)
    }
  })

  return (
    <div className='MissionOutlineChildren'>
      <MissionOutlineSelectionGroup
        items={indirectlySelectableChildren}
        uniqueClassName='IndirectlySelectable'
      />
      <MissionOutlineSelectionGroup items={otherChildren} />
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for the {@link MissionOutlineChildren} component.
 */
interface TMissionOutlineChildren_P {
  /**
   * The parent outline item whose children will be rendered.
   */
  parent: TMissionOutlineItem
}
