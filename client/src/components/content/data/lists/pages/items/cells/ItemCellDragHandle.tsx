import { useRef } from 'react'
import Tooltip from 'src/components/content/communication/Tooltip'
import { MetisComponent } from '../../../../../../../../../shared'
import { useListContext } from '../../../List'

export default function ItemCellDragHandle<TItem extends MetisComponent>({
  item,
}: TItemCellDragHandle_P<TItem>): TReactElement | null {
  /* -- STATE -- */

  const listContext = useListContext<TItem>()
  const [_, setDraggedItem] = listContext.state.draggedItem
  const [__, setDraggedItemStartY] = listContext.state.draggedItemStartY
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
    <div
      className='ItemCellLike ItemCellDragHandle'
      key='drag-handle'
      ref={rootRef}
      onMouseDown={onMouseDown}
    >
      <div className='DragIcon' />
      <Tooltip description='Drag to reorder item' />
    </div>
  )
}

/**
 * Props for {@link ItemCellDragHandle}.
 */
export type TItemCellDragHandle_P<TItem extends MetisComponent> = {
  /**
   * The item which will be dragged.
   */
  item: TItem
}
