import { useEffect, useRef } from 'react'
import { TMetisClientComponents } from 'src'
import Tooltip from 'src/components/content/communication/Tooltip'
import { useButtonMenuEngine } from 'src/components/content/user-controls/buttons/ButtonMenu'
import ButtonMenuController from 'src/components/content/user-controls/buttons/ButtonMenuController'
import ButtonSvgPanel from 'src/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from 'src/components/content/user-controls/buttons/panels/hooks'
import { useMissionPageContext } from 'src/components/pages/missions/context'
import useEffectItemButtonCallbacks from 'src/components/pages/missions/hooks/mission-components/effects'
import { useGlobalContext } from 'src/context/global'
import { compute } from 'src/toolbox'
import { useRequireLogin } from 'src/toolbox/hooks'
import {
  TEffectTrigger,
  TEffectType,
} from '../../../../../../../../../shared/missions/effects'
import { ifNonNullable } from '../../../../../../../../../shared/toolbox/calls'
import ClassList from '../../../../../../../../../shared/toolbox/html/ClassList'
import { TTimelineDragDropItem } from '../../EffectTimeline'
import { useTimelineContext } from '../../context'
import './TimelineItem.scss'
import { NO_TIMELINE_ITEMS_ID } from './TimelineNoItems'
import TimelineDefectiveCell from './cells/TimelineDefectiveCell'
import TimelineDragHandle from './cells/TimelineDragHandle'
import { TimelineItemCell } from './cells/TimelineItemCell'

/**
 * The rate (in seconds) at which the timeline
 * scroll container should scroll when an item
 * is dragged to the top/bottom edge.
 */
const SCROLL_RATE = 50

/**
 * The amount of pixels scrolled every
 * {@link SCROLL_RATE} elapsed.
 */
const SCROLL_AMOUNT = 5

/**
 * A single effect item within a timeline list.
 */
export function TimelineItem<TType extends TEffectType>({
  item,
}: TTimelineItem_P<TType>) {
  /* -- STATE -- */

  const { isAuthorized } = useRequireLogin()
  const globalContext = useGlobalContext()
  const pageContext = useMissionPageContext()
  const { state: pageState } = pageContext
  const [missionDefects] = pageState.defects
  const { showButtonMenu } = globalContext.actions
  const timelineContext = useTimelineContext<TType>()
  const { host, state, elements } = timelineContext
  const [selection, setSelection] = state.selection
  const [draggedItem] = state.draggedItem
  const [hoverOver, setHoverOver] = state.hoverOver
  const [targetedItem, setTargetedItem] = state.targetedItem
  const { onDuplicateRequest, onDeleteRequest } =
    useEffectItemButtonCallbacks(host)
  const lastScrollTime = useRef<number>(0)
  const lastMouseMove = useRef<MouseEvent | null>(null)
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
   * The defects applicable to the given item.
   * @note This could be easily accessed via item.defects.
   * However, that has performance implications as it
   * creates a new array each time it is accessed via
   * a potentially expensive algorithm.
   */
  const defects = compute(() => {
    return missionDefects.filter((defect) => {
      return defect.component._id === item._id
    })
  })

  /**
   * Whether or not this item is defective.
   */
  const defective = compute<boolean>(() => {
    return Boolean(defects.length)
  })

  /**
   * Whether this item is currently being dragged.
   */
  const isDragged = compute<boolean>(() => item._id === draggedItem?._id)

  /**
   * Whether this item is the current target of a
   * drag-and-drop operation.
   */
  const isTargeted = compute<boolean>(() => item._id === targetedItem?._id)

  /**
   * Root class name for the component.
   */
  const rootClass = compute<ClassList>(() =>
    new ClassList('TimelineItem', 'TimelineItemLike')
      .set('Defective', defective)
      .set('Selected', selection?._id === item._id)
      .set('Dragged', item._id === draggedItem?._id)
      .set('HoverTop', isTargeted && hoverOver === 'top')
      .set('HoverBottom', isTargeted && hoverOver === 'bottom'),
  )

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
   * Called every mouse move event in order to
   * determine if this item is the target of a
   * drag-and-drop operation, and if so, the
   * hover position is marked in the styles to
   * indicate where the dragged item will be
   * dropped if released.
   */
  const highlightTarget = () => {
    // Only the dragged item should run this logic.
    if (
      !isDragged ||
      !draggedItem ||
      !elements.root.current ||
      !lastMouseMove.current
    ) {
      return
    }

    let event = lastMouseMove.current
    let timeline = elements.root.current
    let mouseY = event.clientY

    // Find all potential target items (excluding the dragged item).
    let potentialTargetElements = Array.from(
      timeline.querySelectorAll('.TimelineItem, .TimelineNoItems'),
    )

    let newHoverOver: 'top' | 'bottom' | 'nothing' = 'nothing'
    let newTargetedItem: TTimelineDragDropItem<TType> | null = null

    // Find the target element under the mouse.
    for (let element of potentialTargetElements) {
      let rect = element.getBoundingClientRect()

      // Check if mouse is within bounds of this element.
      if (mouseY >= rect.top && mouseY <= rect.bottom) {
        let targetedElement: Element = element
        let idData = targetedElement.getAttribute('data-id')
        let triggerData = targetedElement.getAttribute('data-trigger')
        let orderData = targetedElement.getAttribute('data-order')

        // Abort if necessary data is missing.
        if (!idData || !triggerData || !orderData) {
          console.warn(
            'TimelineItem: Missing data attributes on targeted element.',
          )
          return
        }

        // Construct the new targeted item from
        // the HTML data attributes.
        newTargetedItem = {
          _id: idData,
          trigger: triggerData as TEffectTrigger,
          order: parseInt(orderData),
        }

        // Use top-half indicator if hovering over the top half
        // of the dragged item, or if the targeted item is the
        // dragged item.
        if (
          mouseY <= rect.top + rect.height / 2 ||
          newTargetedItem?._id === draggedItem._id ||
          newTargetedItem?._id === NO_TIMELINE_ITEMS_ID
        ) {
          newHoverOver = 'top'
        }
        // Otherwise, if hovering over bottom half, use
        // bottom-half indicator.
        else {
          newHoverOver = 'bottom'
        }

        break
      }
    }

    // Update targeted item if it has changed.
    if (newTargetedItem?._id !== targetedItem?._id) {
      setTargetedItem(newTargetedItem)
    }
    // Update hover state if it has changed.
    if (newHoverOver !== hoverOver) {
      setHoverOver(newHoverOver)
    }
  }

  /**
   * Scrolls the scrollable container of the timeline
   * if the mouse is near the top or bottom edges of
   * the container, and part of the timeline is out
   * of view.
   * @param event The most recent mouse event.
   */
  const scrollIfNeeded = () => {
    // Abort if necessary conditions are not met.
    if (
      !isDragged ||
      !elements.root.current ||
      !elements.scrollContainer.current ||
      !elements.controlPanel.current ||
      !lastMouseMove.current ||
      // Abort if mouse movement is made before
      // the scroll rate time has elapsed.
      lastScrollTime.current + SCROLL_RATE > Date.now()
    ) {
      return
    }

    // Gather element details.
    let event = lastMouseMove.current
    let timeline = elements.root.current
    let scrollContainer = elements.scrollContainer.current
    let controlPanel = elements.controlPanel.current
    let timelineRect = timeline.getBoundingClientRect()
    let scrollContainerRect = scrollContainer.getBoundingClientRect()
    let controlPanelRect = controlPanel.getBoundingClientRect()

    // Scroll up if an item is dragged near the
    // top edge and the timeline is not fully visible
    // within the scroll container.
    if (
      event.clientY < controlPanelRect.bottom &&
      timelineRect.top < scrollContainerRect.top &&
      scrollContainer.scrollTop > 0
    ) {
      scrollContainer.scrollTop -= SCROLL_AMOUNT
      scrollContainer.scrollTop = Math.max(0, scrollContainer.scrollTop)
    }
    // Scroll down if an item is dragged near the
    // bottom edge and the timeline is not fully visible
    // within the scroll container.
    else if (
      event.clientY > scrollContainerRect.bottom &&
      timelineRect.bottom > scrollContainerRect.bottom
    ) {
      // Scroll but not beyond the bottom limit.
      scrollContainer.scrollTop += Math.min(
        SCROLL_AMOUNT,
        timelineRect.bottom - scrollContainerRect.bottom,
      )
    }
    // Else, break loop.
    else {
      return
    }

    // Record the last scroll time.
    lastScrollTime.current = Date.now()

    // Repeat scrolling until a condition breaks
    // the loop.
    setTimeout(() => {
      scrollIfNeeded()
    }, SCROLL_RATE)
  }

  /**
   * Callback for global mouse move events when this item is being dragged.
   */
  const onGlobalMouseMove = useRef<(event: MouseEvent) => void>(() => {})
  onGlobalMouseMove.current = (event: MouseEvent) => {
    lastMouseMove.current = event
    highlightTarget()
    scrollIfNeeded()
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
      const eventListener = (event: MouseEvent) => {
        onGlobalMouseMove.current(event)
      }

      window.addEventListener('mousemove', eventListener)

      return () => {
        window.removeEventListener('mousemove', eventListener)
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
      <TimelineDefectiveCell defects={defects} />
      <TimelineItemCell className='TimelineItemOptions'>
        <ButtonSvgPanel engine={viewOptionsButtonEngine} />
      </TimelineItemCell>
    </div>
  )
}

/**
 * Props for {@link TimelineItem}.
 */
export type TTimelineItem_P<TType extends TEffectType> = {
  /**
   * The effect item to display.
   */
  item: TMetisClientComponents[TType]
}
