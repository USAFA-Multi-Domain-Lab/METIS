import { useEffect, useRef } from 'react'
import { TMetisClientComponents } from 'src'
import Tooltip from 'src/components/content/communication/Tooltip'
import { useButtonMenuEngine } from 'src/components/content/user-controls/buttons/ButtonMenu'
import ButtonMenuController from 'src/components/content/user-controls/buttons/ButtonMenuController'
import ButtonSvgPanel from 'src/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from 'src/components/content/user-controls/buttons/panels/hooks'
import useEffectItemButtonCallbacks from 'src/components/pages/missions/hooks/mission-components/effects'
import { useGlobalContext } from 'src/context/global'
import { compute } from 'src/toolbox'
import { useRequireLogin } from 'src/toolbox/hooks'
import { TEffectType } from '../../../../../../../../../shared/missions/effects'
import { ifNonNullable } from '../../../../../../../../../shared/toolbox/calls'
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

  const { isAuthorized } = useRequireLogin()
  const globalContext = useGlobalContext()
  const { showButtonMenu } = globalContext.actions
  const timelineContext = useTimelineContext<TType>()
  const { host, state } = timelineContext
  const [selection, setSelection] = state.selection
  const [draggedItem] = state.draggedItem
  const [draggedItemStartY] = state.draggedItemStartY
  const [_, setItemOrderUpdateId] = state.itemOrderUpdateId
  const { root: timeline } = timelineContext.elements
  const { onDuplicateRequest, onDeleteRequest } =
    useEffectItemButtonCallbacks(host)
  const root = useRef<HTMLDivElement>(null)
  const viewOptionsButtonEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'options',
        type: 'button',
        icon: 'options',
        onClick: (event) => onOptionsClick(event),
        label: 'View option menu',
      },
    ],
  })
  const optionMenuEngine = useButtonMenuEngine({
    elements: [
      {
        key: 'open',
        icon: 'open',
        type: 'button',
        label: compute<string>(() => {
          if (isAuthorized('missions_write')) {
            return 'View/Edit effect.'
          } else {
            return 'View effect.'
          }
        }),
        description: compute<string>(() => {
          if (!item.environment || !item.target) {
            return 'This effect cannot be edited because either the target environment or the target associated with this effect is not available.'
          } else {
            return ''
          }
        }),
        permissions: ['missions_read'],
        onClick: () => {
          if (selection) {
            host.mission.select(selection)
          }
        },
      },
      {
        key: 'duplicate',
        icon: 'copy',
        type: 'button',
        label: 'Duplicate',
        description: 'Duplicate the selected effect.',
        permissions: ['missions_write'],
        onClick: () => ifNonNullable(onDuplicateRequest, selection),
      },
      {
        key: 'delete',
        icon: 'remove',
        type: 'button',
        label: 'Delete',
        description: 'Delete the selected effect.',
        permissions: ['missions_write'],
        onClick: () => ifNonNullable(onDeleteRequest, selection),
      },
    ],
  })

  /* -- COMPUTED -- */

  /**
   * Root class name for the component.
   */
  const rootClass = compute<ClassList>(() =>
    new ClassList('TimelineItem', 'TimelineItemLike')
      .set('Selected', selection?._id === item._id)
      .set('Dragged', item._id === draggedItem?._id),
  )

  /**
   * Whether this item is currently being dragged.
   */
  const isDragged = compute<boolean>(() => item._id === draggedItem?._id)

  /**
   * The tooltip description for the item.
   */
  const tooltipDescription = compute<string>(() => {
    let description: string = ''
    description += `\`L-Click\` to select \n\t\n`
    description += `\`R-Click\` for options`
    return description
  })

  /* -- FUNCTIONS -- */

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

  /**
   * Callback for when the item-name cell is clicked.
   */
  const onNameClick = () => {
    if (selection?._id === item._id) setSelection(null)
    else setSelection(item)
  }

  /**
   * Handles the click event for the item
   * options button.
   */
  const onOptionsClick = (event: React.MouseEvent) => {
    // Show the button menu.
    showButtonMenu(optionMenuEngine, {
      positioningTarget: event.target as HTMLDivElement,
      highlightTarget: root.current ?? undefined,
    })
    // Force selection of the item.
    setSelection(item)
  }

  /**
   * Callback for when the button menu is activated.
   */
  const onButtonMenuActivate = () => {
    // Force selection of the item.
    setSelection(item)
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
    >
      <ButtonMenuController
        target={root}
        engine={optionMenuEngine}
        highlightTarget={root.current ?? undefined}
        trigger={'r-click'}
        onActivate={onButtonMenuActivate}
      />
      <TimelineDragHandle item={item} />
      <TimelineItemCell
        onClick={onNameClick}
        onDoubleClick={() => host.mission.select(item)}
      >
        {item.name}
        <Tooltip description={tooltipDescription} />
      </TimelineItemCell>
      <TimelineItemCell className='TimelineItemOptions'>
        <ButtonSvgPanel engine={viewOptionsButtonEngine} />
      </TimelineItemCell>
    </div>
  )
}

export type TTimelineItem_P<TType extends TEffectType> = {
  /**
   * The effect item to display.
   */
  item: TMetisClientComponents[TType]
}
