import { useRef } from 'react'
import { TMetisClientComponents } from 'src'
import Tooltip from 'src/components/content/communication/Tooltip'
import { TEffectType } from '../../../../../../../../../../shared/missions/effects'
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
  const [_, setDraggedItem] = timelineContext.state.draggedItem
  const [__, setDraggedItemStartY] = timelineContext.state.draggedItemStartY
  const rootRef = useRef<HTMLDivElement>(null)

  /* -- FUNCTIONS -- */

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

    // Register a global mouse up event to
    // clear the dragged item.
    window.addEventListener(
      'mouseup',
      () => {
        setDraggedItem(null)
        setDraggedItemStartY(0)
      },
      {
        once: true,
      },
    )
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
