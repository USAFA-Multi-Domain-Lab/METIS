import React, { useMemo, useRef, useState } from 'react'
import { TMetisClientComponents } from 'src'
import { useMissionPageContext } from 'src/components/pages/missions/context'
import { LocalContextProvider } from 'src/context/local'
import { ClientEffect, TClientEffectHost } from 'src/missions/effects'
import { compute } from 'src/toolbox'
import { getScrollableAncestor } from 'src/toolbox/dom'
import {
  useEventListener,
  useMountHandler,
  usePostInitEffect,
} from 'src/toolbox/hooks'
import { TEffectType } from '../../../../../../../shared/missions/effects'
import StringToolbox from '../../../../../../../shared/toolbox/strings'
import { timelineContext } from './context'
import './EffectTimeline.scss'
import { NO_TIMELINE_ITEMS_ID } from './subcomponents/items/TimelineNoItems'
import TimelineControlPanel from './subcomponents/TimelineControlPanel'
import { TimelineSection } from './subcomponents/TimelineSection'

/**
 * Presents a timeline view of effects for a given
 * effect host, providing options to create new
 * effects, as well as manage existing ones.
 */
export function EffectTimeline<TType extends TEffectType>(
  props: TEffectTimeline_P<TType>,
): JSX.Element | null {
  /* -- PROPS -- */

  const { host } = props

  /* -- STATE -- */

  const missionPageContext = useMissionPageContext()
  const { onChange } = missionPageContext
  const state: TEffectTimeline_S<TType> = {
    selection: useState<TMetisClientComponents[TType] | null>(null),
    draggedItem: useState<TTimelineDragDropItem<TType> | null>(null),
    targetedItem: useState<TTimelineDragDropItem<TType> | null>(null),
    hoverOver: useState<TTimelineItemHoverOver>('nothing'),
    itemOrderUpdateId: useState<string>(StringToolbox.generateRandomId()),
  }
  const [itemOrderUpdateId] = state.itemOrderUpdateId
  const [, setSelection] = state.selection
  const elements: TEffectTimeline_E = {
    root: useRef<HTMLDivElement>(null),
    scrollContainer: useRef<Element | null>(null),
    controlPanel: useRef<HTMLDivElement>(null),
  }

  /* -- COMPUTED -- */

  /**
   * A map of trigger to their corresponding effects.
   */
  const effectsMap = useMemo<
    Record<string, TMetisClientComponents[TType][]>
  >(() => {
    let map: Record<string, TMetisClientComponents[TType][]> = {}

    for (let trigger of host.validTriggers) {
      map[trigger] = []
    }
    for (let effect of host.effects) {
      map[effect.trigger].push(effect)
    }
    // Sort each trigger's effects by order
    for (let trigger of host.validTriggers) {
      map[trigger].sort((a, b) => a.order - b.order)
    }

    return map
  }, [...host.validTriggers, ...host.effects, itemOrderUpdateId])

  /* -- EFFECTS -- */

  useMountHandler((done) => {
    if (!elements.root.current) return
    const scrollContainer = getScrollableAncestor(elements.root.current)
    elements.scrollContainer.current = scrollContainer
    done()
  })

  // Deselect the currently selected item, if necessary.
  useEventListener(document, 'mousedown', (event: MouseEvent) => {
    const selectors = ['.ButtonMenu']
    const blacklistedClasses = ['InputBlocker']
    const rootElement = elements.root.current
    const target = event.target as HTMLElement
    // Get all elements that prevent deselection
    // of the item that is currently selected.
    const ignoredElms: HTMLElement[] = []
    selectors.forEach((selector) => {
      const elements = document.querySelectorAll<HTMLElement>(selector)
      if (elements.length > 0) ignoredElms.push(...elements)
    })
    // Check if any of the blacklisted elements contain the element that
    // was clicked.
    const targetInIgnoredElms = ignoredElms.some(
      (elm) => elm.contains(target) || elm === target,
    )
    // Check if the element that was clicked contains a class that's
    // been blacklisted.
    const targetHasBlacklistedClass = blacklistedClasses.some((cls) =>
      target.classList.contains(cls),
    )
    // If the target is in the ignored elements, do not deselect.
    if (targetInIgnoredElms || targetHasBlacklistedClass) return
    // If the clicked element is not part of the list,
    // deselect the item.
    if (!rootElement?.contains(target)) setSelection(null)
  })

  // Enable save button when item order changes.
  usePostInitEffect(() => {
    onChange(host)
  }, [itemOrderUpdateId])

  /* -- RENDER -- */

  /**
   * The JSX elements for all effects across all valid triggers.
   */
  const effectsSectionsJsx = compute<JSX.Element[]>(() => {
    return host.validTriggers
      .map((trigger: ClientEffect<TType>['trigger']) => (
        <TimelineSection
          key={trigger}
          trigger={trigger}
          effects={effectsMap[trigger]}
        />
      ))
      .filter(Boolean) as JSX.Element[]
  })

  return (
    <LocalContextProvider
      context={timelineContext}
      defaultedProps={props}
      computed={{}}
      state={state}
      elements={elements}
    >
      <div className='EffectTimeline' ref={elements.root}>
        <TimelineControlPanel />
        {effectsSectionsJsx}
      </div>
    </LocalContextProvider>
  )
}

/**
 * Props for {@link EffectTimeline}.
 */
export type TEffectTimeline_P<TType extends TEffectType> = {
  /**
   * The mission component hosting the list of effects.
   */
  host: TClientEffectHost<TType>
}

/**
 * State for {@link EffectTimeline}.
 */
export type TEffectTimeline_S<TType extends TEffectType> = {
  /**
   * The currently selected effect in the timeline.
   * @note If `null`, no effect is selected.
   */
  selection: TReactState<TMetisClientComponents[TType] | null>
  /**
   * The currently dragged item.
   */
  draggedItem: TReactState<TTimelineDragDropItem<TType> | null>
  /**
   * The current item being hovered over by the
   * dragged item.
   */
  targetedItem: TReactState<TTimelineDragDropItem<TType> | null>
  /**
   * The part of the item that is currently being
   * hovered over.
   */
  hoverOver: TReactState<TTimelineItemHoverOver>
  /**
   * Represents an update to the order of items
   * in the timeline, which can be used to trigger
   * effects when the order changes.
   */
  itemOrderUpdateId: TReactState<string>
}

/**
 * Elements that need to be referenced throughout the
 * {@link EffectTimeline} component tree.
 */
export type TEffectTimeline_E = {
  /**
   * The root element of the list.
   */
  root: React.RefObject<HTMLDivElement>
  /**
   * The scrollable ancestor of the root element.
   */
  scrollContainer: React.MutableRefObject<Element | null>
  /**
   * The root element of the {@link TimelineControlPanel}
   * component instance used.
   */
  controlPanel: React.RefObject<HTMLDivElement>
}

/**
 * Possible states when hovering over a timeline item.
 */
type TTimelineItemHoverOver = 'top' | 'bottom' | 'nothing'

/**
 * Necessary data for an item being dragged or being
 * targeted for a drop.
 */
export type TTimelineDragDropItem<TType extends TEffectType> = {
  /**
   * The ID of the dragged effect item.
   * If {@link NO_TIMELINE_ITEMS_ID}, it represents a placeholder item
   * for an empty section.
   */
  _id: string
  /**
   * The trigger of the dragged effect item.
   */
  trigger: TMetisClientComponents[TType]['trigger']
  /**
   * The order of the dragged effect item.
   */
  order: number
}
