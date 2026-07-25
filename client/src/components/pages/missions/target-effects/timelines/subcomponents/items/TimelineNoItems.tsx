import { compute } from '@client/toolbox'
import type { TEffectTrigger } from '@shared/missions/effects/Effect'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useTimelineContext } from '../../context'
import './TimelineNoItems.scss'

/* -- FUNCTIONS -- */

/**
 * Builds the ID used to identify the no-items placeholder of a
 * section. Each section gets its own ID so that the placeholders of
 * two empty sections can be told apart by ID alone.
 * @param trigger The trigger of the section the placeholder stands in
 * for.
 * @returns The ID for that section's placeholder.
 */
export const getNoTimelineItemsId = (trigger: TEffectTrigger): string => {
  return `no-items-${trigger}`
}

/* -- COMPONENTS -- */

/**
 * Notifies the user that their are no effects assigned
 * to a given section. Also acts as a drop target for
 * dragged items to enable dropping into empty sections.
 */
export function TimelineNoItems({
  trigger,
}: TTimelineNoItems_P): TReactElement {
  /* -- STATE -- */

  const timelineContext = useTimelineContext()
  const { state } = timelineContext
  const [targetedItem] = state.targetedItem
  const [hoverOver] = state.hoverOver

  /* -- COMPUTED -- */

  /**
   * Whether this item-placeholder is being
   * targeted for a drop.
   */
  const isTargeted = compute<boolean>(() => {
    return targetedItem?._id === getNoTimelineItemsId(trigger)
  })

  /**
   * The classes for the root element of the
   * component.
   */
  const rootClasses = compute<ClassList>(() => {
    return new ClassList('TimelineNoItems', 'TimelineItemLike')
      .set('HoverTop', isTargeted && hoverOver === 'top')
      .set('HoverBottom', isTargeted && hoverOver === 'bottom')
  })

  /* -- RENDER -- */

  return (
    <div
      className={rootClasses.value}
      data-id={getNoTimelineItemsId(trigger)}
      data-trigger={trigger}
      data-order={1}
    >
      <div className='TimelineItemCell'>
        <div className='ItemName'>None scheduled...</div>
      </div>
      <div className='TimelineItemCell TimelineItemOptions' />
    </div>
  )
}

/**
 * Props for {@link TimelineNoItems}.
 */
export type TTimelineNoItems_P = {
  /**
   * The trigger for this section, used to identify
   * which section to drop items into.
   */
  trigger: TEffectTrigger
}
