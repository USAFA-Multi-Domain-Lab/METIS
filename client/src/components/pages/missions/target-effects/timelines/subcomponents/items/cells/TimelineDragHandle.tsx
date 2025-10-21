import { useRef } from 'react'
import { TMetisClientComponents } from 'src'
import Tooltip from 'src/components/content/communication/Tooltip'
import { TEffectType } from '../../../../../../../../../../shared/missions/effects'
import StringToolbox from '../../../../../../../../../../shared/toolbox/strings'
import { useTimelineContext } from '../../../context'
import './TimelineDragHandle.scss'
import { TimelineItemCell } from './TimelineItemCell'

/**
 * The class name used for the root element
 * of the {@link TimelineDragHandle} component.
 */
export const TIMELINE_DRAG_HANDLE_CLASS = 'TimelineDragHandle'

/**
 * A handle placed beside an effect item to allow
 * the user to drag the item to reorder it.
 */
export default function TimelineDragHandle<TType extends TEffectType>({
  item,
}: TTimelineDragHandle_P<TType>): JSX.Element | null {
  /* -- STATE -- */

  const timelineContext = useTimelineContext<TType>()
  const { host } = timelineContext
  const [draggedItem, setDraggedItem] = timelineContext.state.draggedItem
  const [, setDraggedItemStartY] = timelineContext.state.draggedItemStartY
  const [targetedItem, setTargetedItem] = timelineContext.state.targetedItem
  const [hoverOver, setHoverOver] = timelineContext.state.hoverOver
  const [, setSelection] = timelineContext.state.selection
  const [, setItemOrderUpdateId] = timelineContext.state.itemOrderUpdateId
  const rootRef = useRef<HTMLDivElement>(null)

  /* -- FUNCTIONS -- */

  const moveItemIfNeeded = (): void => {
    if (
      !draggedItem ||
      !targetedItem ||
      draggedItem._id === targetedItem._id ||
      hoverOver === 'nothing'
    ) {
      return
    }

    // Track previous dragged trigger
    // and order values.
    let prevDraggedTrigger = draggedItem.trigger
    let prevDraggedOrder = draggedItem.order

    // Update the trigger to the targeted
    // trigger regardless of how the order
    // is processed.
    draggedItem.trigger = targetedItem.trigger

    // Place relative to the targeted item's
    // top or bottom depending on the hover-over
    // state.
    if (hoverOver === 'top') {
      draggedItem.order = targetedItem.order

      // Make room for the dropped item by shifting
      // down all items at or after the targeted item's
      // order.
      for (let effect of host.effects) {
        if (
          effect.trigger === targetedItem.trigger &&
          effect._id !== draggedItem._id &&
          effect.order >= targetedItem.order
        ) {
          effect.order += 1
        }
      }
    } else if (hoverOver === 'bottom') {
      draggedItem.order = targetedItem.order + 1

      // Make room for the dropped item by shifting
      // down all items after the targeted item's
      // order.
      for (let effect of host.effects) {
        if (
          effect.trigger === targetedItem.trigger &&
          effect._id !== draggedItem._id &&
          effect.order > targetedItem.order
        ) {
          effect.order += 1
        }
      }
    }

    // Fill in any gap left by the moved item
    // in its previous position.
    for (let effect of host.effects) {
      if (
        effect.trigger === prevDraggedTrigger &&
        effect.order > prevDraggedOrder
      ) {
        effect.order -= 1
      }
    }

    // Trigger update.
    setItemOrderUpdateId(StringToolbox.generateRandomId())
  }

  /**
   * Callback to handle mouse up events on the
   * root element.
   */
  const onMouseUp = useRef<() => void>(() => {})
  onMouseUp.current = () => {
    moveItemIfNeeded()
    setDraggedItem(null)
    setDraggedItemStartY(0)
    setTargetedItem(null)
    setHoverOver('nothing')
  }

  /**
   * Callback to handle mouse down events on the
   * root element.
   */
  const onMouseDown = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (!rootRef.current) {
      return
    }

    const rect = rootRef.current.getBoundingClientRect()
    const startY = event.clientY - rect.top

    setDraggedItem(item)
    setDraggedItemStartY(startY)
    setSelection(null)

    // Register a global mouse up event to
    // clear the dragged item.
    window.addEventListener('mouseup', () => onMouseUp.current(), {
      once: true,
    })
  }

  /* -- RENDER -- */

  return (
    <TimelineItemCell
      className='TimelineDragHandle'
      rootRef={rootRef}
      onMouseDown={onMouseDown}
    >
      <div className='DragIcon' />
      <Tooltip description='Drag to reorder effect' />
    </TimelineItemCell>
  )
}

/**
 * Props for {@link TimelineDragHandle}.
 */
export type TTimelineDragHandle_P<TType extends TEffectType> = {
  /**
   * The effect which will be dragged.
   */
  item: TMetisClientComponents[TType]
}
