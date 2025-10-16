import { useEffect, useRef } from 'react'
import { TMetisClientComponents } from 'src'
import { compute } from 'src/toolbox'
import { TEffectType } from '../../../../../../../../shared/missions/effects'
import ClassList from '../../../../../../../../shared/toolbox/html/class-lists'
import StringToolbox from '../../../../../../../../shared/toolbox/strings'
import { useTimelineContext } from '../context'
import './TimelineItem.scss'
import TimelineDragHandle, {
  TIMELINE_DRAG_HANDLE_CLASS,
} from './cells/TimelineDragHandle'
import { TimelineItemCell } from './cells/TimelineItemCell'

/**
 * A single effect item within a timeline list.
 */
export function TimelineItem<TType extends TEffectType>({
  item,
}: TTimelineItem_P<TType>) {
  /* -- STATE -- */

  const timelineContext = useTimelineContext<TType>()
  const { host } = timelineContext
  const [draggedItem] = timelineContext.state.draggedItem
  const [draggedItemStartY] = timelineContext.state.draggedItemStartY
  const [_, setItemOrderUpdateId] = timelineContext.state.itemOrderUpdateId
  const { root: timeline } = timelineContext.elements
  const root = useRef<HTMLDivElement>(null)

  /* -- COMPUTED -- */

  /**
   * Root class name for the component.
   */
  const rootClass = compute<ClassList>(() =>
    new ClassList('TimelineItem', 'TimelineItemLike')
      // .set('Selected', selection?._id === item._id)
      .set('Dragged', item._id === draggedItem?._id),
  )

  /**
   * Whether this item is currently being dragged.
   */
  const isDragged = compute<boolean>(() => item._id === draggedItem?._id)

  const moveItemIfNeeded = (event: MouseEvent) => {
    // Only the dragged item should handle
    // reordering logic. Also, if no list element
    // is available, abort.
    if (!isDragged || !timeline.current) return

    const hoverOverOffset = -5

    let mouseY = event.clientY
    // Find all list items other than the dragged item.
    let potentialTargetElements = Array.from(
      timeline.current.querySelectorAll('.TimelineItem'),
    ).filter(
      (element) => !element.classList.contains('Dragged'),
    ) as HTMLElement[]
    let targetElement: HTMLElement | null = null
    let targetEffect: TMetisClientComponents[TType] | null = null
    let previousOrder = item.order

    // Find target effect.
    for (let element of potentialTargetElements) {
      let rect = element.getBoundingClientRect()

      // Check mouse position against element bounds.
      if (
        mouseY >= rect.top - hoverOverOffset &&
        mouseY <= rect.bottom + hoverOverOffset
      ) {
        // If in bounds for any given element,
        // mark that element as the target.
        targetElement = element

        // Find the effect associated with the element.
        let itemId = targetElement.getAttribute('data-item-id')
        targetEffect = host.effects.find((i) => i._id === itemId) ?? null

        // No need to continue looping.
        break
      }
    }

    console.log({ targetElement, targetEffect })

    // Abort if no target element or effect found.
    if (!targetElement || !targetEffect) return

    // Swap orders.
    item.order = targetEffect.order
    targetEffect.order = previousOrder

    console.log(item.order, targetEffect.order)

    // Trigger update.
    setItemOrderUpdateId(StringToolbox.generateRandomId())
  }

  /**
   * Looks at the state of the dragged item and the
   * movement of the mouse to determine if the item
   * should be moved in the list.
   * @param event The most recent mouse event.
   */
  const moveItemIfNeededLegacy = (event: MouseEvent) => {
    // Only the dragged item should handle
    // reordering logic. Also, if no list element
    // is available, abort.
    if (!isDragged || !timeline.current) return

    const hoverOverOffset = -5
    let mouseY = event.clientY

    // Find all list items and determine which one the mouse is over
    let listItems = Array.from(
      timeline.current.querySelectorAll('.ListItem'),
    ).filter(
      (element) => !element.classList.contains('Dragged'),
    ) as HTMLElement[]

    let targetItem: HTMLElement | null = null
    let targetIndex = -1

    // Find the item the mouse is currently over
    for (const element of listItems) {
      let rect = element.getBoundingClientRect()
      if (
        mouseY >= rect.top - hoverOverOffset &&
        mouseY <= rect.bottom + hoverOverOffset
      ) {
        targetItem = element
        break
      }
    }

    if (targetItem) {
      // Get the item ID from the element and find its index
      let itemId = targetItem.getAttribute('data-item-id')
      if (itemId) {
        targetIndex = host.effects.findIndex((i) => i._id === itemId)
      }
    }

    if (targetIndex !== -1) {
      const draggedIndex = host.effects.findIndex((i) => i._id === item._id)
      if (draggedIndex === -1) return

      // Track previous mouse Y position using a ref
      const prevMouseYRef = ((moveItemIfNeeded as any).prevMouseYRef ??= {
        value: null,
      })

      let insertIndex: number

      if (prevMouseYRef.value !== null) {
        if (mouseY > prevMouseYRef.value) {
          // Moving downward, place below target
          insertIndex = targetIndex + 1
        } else if (mouseY < prevMouseYRef.value) {
          // Moving upward, place above target
          insertIndex = targetIndex
        } else {
          // No movement
          return
        }
      } else {
        // First move, default to above target
        insertIndex = targetIndex
      }

      prevMouseYRef.value = mouseY

      // Adjust insert index if dragged item is before the target
      if (draggedIndex < insertIndex) {
        insertIndex--
      }

      // If the dragged item is not already at the target position, move it
      if (draggedIndex !== insertIndex) {
        host.effects.splice(draggedIndex, 1)
        host.effects.splice(insertIndex, 0, item)
        setItemOrderUpdateId(StringToolbox.generateRandomId())
      }
    }
  }

  /**
   * Offsets the position of the dragged item
   * to make it follow the mouse cursor.
   * @param event The most recent mouse event.
   */
  const offsetDraggedItem = (event: MouseEvent) => {
    // Abort if not dragging or if
    // the root element is not available.
    if (!isDragged || !root.current) return

    let rootElm = root.current

    // First clear the top to get accurate measurements.
    rootElm.style.top = `unset`

    // Find the drag-handle for the item,
    // aborting if it is not found.
    let dragHandle = rootElm.querySelector(`.${TIMELINE_DRAG_HANDLE_CLASS}`)
    if (!dragHandle) return

    // Determine the offset for the dragged
    // item based on the initially recorded
    // mouse Y position and the current mouse
    // Y position.
    let dragHandleRect = dragHandle.getBoundingClientRect()
    let offsetY = event.clientY - dragHandleRect.top - draggedItemStartY

    // Update the styling.`
    rootElm.style.top = `${offsetY}px`
  }

  /**
   * Callback for global mouse move events when this item is being dragged.
   */
  const onGlobalMouseMove = (event: MouseEvent) => {
    if (isDragged) {
      moveItemIfNeeded(event)
      offsetDraggedItem(event)
    }
  }

  /* -- EFFECTS -- */

  // Set up global mouse event listeners when this
  // item is being dragged
  useEffect(() => {
    if (isDragged) {
      window.addEventListener('mousemove', onGlobalMouseMove)

      return () => {
        window.removeEventListener('mousemove', onGlobalMouseMove)
      }
    } else {
      if (root.current) root.current.style.top = `${0}px`
    }
  }, [isDragged])

  /* -- RENDER -- */

  return (
    <div className={rootClass.value} data-item-id={item._id} ref={root}>
      <TimelineDragHandle item={item} />
      <TimelineItemCell>{item.name}</TimelineItemCell>
      <TimelineItemCell className='TimelineItemOptions'></TimelineItemCell>
    </div>
  )
}

export type TTimelineItem_P<TType extends TEffectType> = {
  /**
   * The effect item to display.
   */
  item: TMetisClientComponents[TType]
}
