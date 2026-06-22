import Tooltip from '@client/components/content/communication/Tooltip'
import { compute } from '@client/toolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { s } from '@shared/toolbox/strings/StringToolbox'
import type { TMissionOutlineItem } from './MissionOutline'
import {
  computeOutlineIconStyling,
  useMissionOutlineContext,
} from './MissionOutline'
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
  const {
    filter,
    isExpanded,
    isSelectable,
    toggleItem,
    toggleSelection,
    toggleAllDescendants,
    selectionState,
    getDescendantSelectionCount,
    revealSelectedDescendants,
    state,
  } = useMissionOutlineContext()
  const [value] = selectionState
  const [searchText] = state.searchText

  let children = item.outlineChildren.filter(filter)
  let hasChildren = children.length > 0
  let expanded = isExpanded(item)
  let selectable = isSelectable(item)
  let selected = value.includes(item)
  let descendantSelectionCount = getDescendantSelectionCount(item)
  let showBadge = !expanded && descendantSelectionCount > 0
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

  return (
    <div className={itemClasses.value}>
      <div className='OutlineItemContent'>
        <div
          className={indicatorClasses.value}
          onClick={() => {
            if (hasChildren) toggleItem(item)
          }}
          onContextMenu={(event) => {
            if (!hasChildren) return
            event.preventDefault()
            toggleAllDescendants(item)
          }}
        ></div>
        <div
          className='SelectionZone'
          onClick={() => {
            if (selectable) toggleSelection(item)
          }}
        >
          <div className='Icon' style={computeOutlineIconStyling(item)}></div>
          <div className='Name'>{highlightName(item.name, searchText)}</div>
          <Tooltip description={tooltipDescription} />
        </div>
        {showBadge && (
          <div
            className='SelectionBadge'
            onClick={(event) => {
              event.stopPropagation()
              revealSelectedDescendants(item)
            }}
          >
            {descendantSelectionCount}
            <Tooltip
              description={`Click to reveal ${descendantSelectionCount} selected descendant${s(descendantSelectionCount)}`}
            />
          </div>
        )}
      </div>
      <MissionOutlineChildren parent={item} />
    </div>
  )
}

/* -- UTILITY FUNCTIONS -- */

/**
 * Renders `name` with the first case-insensitive match of `query` wrapped in a `SearchHighlight` span.
 * @param name The display name to render.
 * @param query The current search query to highlight within the name.
 * @returns A React element with the matching substring highlighted, or the name unstyled if there is no match.
 */
function highlightName(name: string, query: string): TReactElement {
  if (!query) return <>{name}</>
  let lowerName = name.toLowerCase()
  let index = lowerName.indexOf(query.toLowerCase())
  if (index === -1) return <>{name}</>
  return (
    <>
      {name.slice(0, index)}
      <span className='SearchHighlight'>
        {name.slice(index, index + query.length)}
      </span>
      {name.slice(index + query.length)}
    </>
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
