import Tooltip from '@client/components/content/communication/Tooltip'
import { compute } from '@client/toolbox'
import { getIconPath } from '@client/toolbox/icons'
import { ClassList } from '@shared/toolbox/html/ClassList'
import type { TMissionOutlineItem } from './MissionOutline'
import { useMissionOutlineContext } from './MissionOutline'
import MissionOutlineChildren from './MissionOutlineChildren'

/**
 * Renders a single item row within the {@link MissionOutline} tree,
 * including its expand/collapse indicator, icon, name, and recursively
 * rendered children.
 * @note Must be used within a {@link MissionOutline} component.
 */
export default function MissionOutlineItem({
  item,
}: TMissionOutlineItem_P): TReactElement | null {
  const { filter, isSelectable, toggleItem, toggleSelection, state } =
    useMissionOutlineContext()
  const [selectedItems] = state.selectedItems

  let children = item.outlineChildren.filter(filter)
  let hasChildren = children.length > 0
  let expanded = item.expandedInOutline
  let selectable = isSelectable(item)
  let selected = selectedItems.has(item)
  let tooltipDescription = compute<string>(() => {
    if (!selectable) return ''
    return selected ? 'Deselect item' : 'Select item'
  })

  // Compute dynamic HTML class names.
  let itemClasses = new ClassList('OutlineItem')
    .set('Childless', !hasChildren)
    .set('Selectable', selectable)
    .set('Selected', selected)
  let indicatorClasses = new ClassList('Indicator').set(
    'isCollapsed',
    !expanded,
  )

  // Compute dynamic inline styles.
  let iconStyle = {
    backgroundImage: compute<string>(() => {
      let url = getIconPath(item.outlineIcon)
      return url ? `url(${url})` : 'none'
    }),
  }

  return (
    <div className={itemClasses.value}>
      <div className='OutlineItemContent'>
        <div
          className={indicatorClasses.value}
          onClick={() => {
            if (hasChildren) toggleItem(item)
          }}
        ></div>
        <div
          className='SelectionZone'
          onClick={() => {
            if (selectable) toggleSelection(item)
          }}
        >
          <div className='Icon' style={iconStyle}></div>
          <div className='Name'>{item.name}</div>
          <Tooltip description={tooltipDescription} />
        </div>
      </div>
      <MissionOutlineChildren parent={item} />
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for the {@link MissionOutlineItem} component.
 */
interface TMissionOutlineItem_P {
  /**
   * The outline item to render.
   */
  item: TMissionOutlineItem
}
