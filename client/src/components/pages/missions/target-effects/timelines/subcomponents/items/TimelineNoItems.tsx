import { compute } from 'src/toolbox'
import { TEffectTrigger } from '../../../../../../../../../shared/missions/effects'
import ClassList from '../../../../../../../../../shared/toolbox/html/class-lists'
import { useTimelineContext } from '../../context'
import './TimelineNoItems.scss'

/* -- CONSTANTS -- */

/**
 * ID used to identify the no-items placeholder.
 */
export const NO_TIMELINE_ITEMS_ID = 'no-items'

/* -- COMPONENTS -- */

/**
 * Notifies the user that their are no effects assigned
 * to a given section. Also acts as a drop target for
 * dragged items to enable dropping into empty sections.
 */
export function TimelineNoItems({ trigger }: TTimelineNoItems_P): JSX.Element {
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
    return (
      targetedItem?._id === NO_TIMELINE_ITEMS_ID &&
      targetedItem.trigger === trigger
    )
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
      data-id={NO_TIMELINE_ITEMS_ID}
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
