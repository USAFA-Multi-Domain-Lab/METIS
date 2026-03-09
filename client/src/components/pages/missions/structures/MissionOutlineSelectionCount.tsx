import { useMissionOutlineContext } from './MissionOutline'

/**
 * Renders the selection count footer for {@link MissionOutline}.
 * Displays the number of currently selected items, or nothing when
 * no items are selected.
 * @note Must be used within a {@link MissionOutline} component.
 */
export default function MissionOutlineSelectionCount(): TReactElement | null {
  const { state } = useMissionOutlineContext()
  const [selectedItems] = state.selectedItems

  let count = selectedItems.size

  if (count === 0) return null

  return (
    <div className='SelectionCount'>
      ({count} {count === 1 ? 'item' : 'items'} selected)
    </div>
  )
}
