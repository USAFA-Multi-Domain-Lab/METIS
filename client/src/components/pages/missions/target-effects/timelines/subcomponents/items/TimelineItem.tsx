import { useEffect, useRef } from 'react'
import { TMetisClientComponents } from 'src'
import { compute } from 'src/toolbox'
import { TEffectType } from '../../../../../../../../../shared/missions/effects'
import ClassList from '../../../../../../../../../shared/toolbox/html/class-lists'
import StringToolbox from '../../../../../../../../../shared/toolbox/strings'
import { useTimelineContext } from '../../context'
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
  const prevMouseY = timelineContext.state.previousMouseY
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

  /**
   * Looks at the state of the dragged item and the
   * movement of the mouse to determine if the item
   * should be moved in the list.
   * @param event The most recent mouse event.
   */
  const moveItemIfNeeded = (event: MouseEvent) => {
    // Only the dragged item should handle
    // reordering logic. Also, if no list element
    // is available, abort.
    if (!draggedItem || !timeline.current) return

    const hoverOverOffset = -5

    let mouseY = event.clientY
    // Find all list items other than the dragged item.
    let potentialTargetElements = Array.from(
      timeline.current.querySelectorAll('.TimelineItem, .TimelineLandingPad'),
    ).filter((element) => !element.classList.contains('Dragged'))

    // Gather details about dragged and targeted items.
    let draggedEffect = draggedItem
    let draggedOrderPrev = draggedEffect.order
    let draggedTriggerPrev = draggedEffect.trigger
    let targetedEffect: TMetisClientComponents[TType] | null = null
    let targetedTrigger: TMetisClientComponents[TType]['trigger'] | null = null
    let targetedOrder: number = -1

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
        let targetedElement = element

        // Find the effect associated with the element.
        let effectId = targetedElement.getAttribute('data-id')

        targetedEffect = host.effects.find((i) => i._id === effectId) ?? null
        targetedTrigger = targetedElement.getAttribute(
          'data-trigger',
        ) as TMetisClientComponents[TType]['trigger']
        targetedOrder = parseInt(
          targetedElement.getAttribute('data-order') ?? '-1',
        )

        // No need to continue looping.
        break
      }
    }

    // Abort if no targeted order or trigger.
    if (!targetedOrder || !targetedTrigger) return

    // If the triggers match, then the order is simply
    // swapped between the two effects.
    if (draggedEffect.trigger === targetedTrigger) {
      if (!targetedEffect) return

      draggedEffect.order = targetedOrder
      targetedEffect.order = draggedOrderPrev
    }
    // If the trigger differs, then the dragged effect
    // still takes the order of the targeted effect,
    // but the targeted effect, and the effects from
    // both triggers must be adjusted accordingly.
    else {
      draggedEffect.order = targetedOrder
      draggedEffect.trigger = targetedTrigger

      for (let effect of host.effects) {
        // Adjust effects in the original trigger section
        // to close the gap left by the moved effect.
        if (
          effect.trigger === draggedTriggerPrev &&
          effect.order > draggedOrderPrev
        ) {
          effect.order--
        }
        // Adjust effects in the targeted trigger section
        // to make room for the incoming effect.
        if (
          effect.trigger === targetedTrigger &&
          effect._id !== draggedEffect._id &&
          effect.order >= targetedOrder
        ) {
          effect.order++
        }
      }
    }

    // Trigger update.
    setItemOrderUpdateId(StringToolbox.generateRandomId())
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
    <div
      className={rootClass.value}
      data-id={item._id}
      data-trigger={item.trigger}
      data-order={item.order}
      ref={root}
      onDoubleClick={() => host.mission.select(item)}
    >
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
