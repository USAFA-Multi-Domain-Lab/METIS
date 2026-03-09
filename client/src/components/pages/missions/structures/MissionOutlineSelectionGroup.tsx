import { ClassList } from '@shared/toolbox/html/ClassList'
import type { TMissionOutlineItem } from './MissionOutline'
import MissionOutlineItem from './MissionOutlineItem'

/**
 * Renders a labeled group of outline items within a styled container.
 * @note Must be used within a {@link MissionOutline} component.
 */
export default function MissionOutlineSelectionGroup({
  items,
  uniqueClassName = '',
}: TMissionOutlineSelectionGroup_P): TReactElement | null {
  if (items.length === 0) return null

  let groupClasses = new ClassList(
    'MissionOutlineSelectionGroup',
    uniqueClassName,
  )

  return (
    <div className={groupClasses.value}>
      {items.map((item) => (
        <MissionOutlineItem item={item} key={item._id} />
      ))}
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for the {@link MissionOutlineSelectionGroup} component.
 */
interface TMissionOutlineSelectionGroup_P {
  /**
   * The items to render within the group.
   */
  items: TMissionOutlineItem[]
  /**
   * An optional unique CSS class name appended to the group container,
   * used to identify and style this group type independently.
   * @default undefined
   */
  uniqueClassName?: string
}
