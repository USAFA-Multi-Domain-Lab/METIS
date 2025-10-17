import { TMetisClientComponents } from 'src'
import If from 'src/components/content/util/If'
import {
  TEffectTrigger,
  TEffectType,
} from '../../../../../../../../shared/missions/effects'
import StringToolbox from '../../../../../../../../shared/toolbox/strings'
import { useTimelineContext } from '../context'
import { TimelineItem } from './items/TimelineItem'
import TimelineLandingPad from './items/TimelineLandingPad'
import { TimelineNoItems } from './items/TimelineNoItems'
import './TimelineSection.scss'

/**
 * A section displaying timeline items specific to
 * the given effect trigger.
 */
export function TimelineSection<TType extends TEffectType>({
  trigger,
  effects,
}: TTimelineSection_P<TType>) {
  /* -- STATE -- */

  const timelineContext = useTimelineContext<TType>()
  const { host } = timelineContext

  /* -- RENDER -- */

  return (
    <section className='TimelineSection'>
      <div className='TimelineSectionHeading'>
        {StringToolbox.toTitleCase(trigger)}
      </div>
      <div className='TimelineItems'>
        <TimelineLandingPad trigger={trigger} order={1} />
        <If condition={effects.length === 0}>
          <TimelineNoItems />
        </If>
        <If condition={effects.length > 0}>
          {effects.map((effect) => (
            <TimelineItem key={effect._id} item={effect} />
          ))}
        </If>
        <TimelineLandingPad
          trigger={trigger}
          order={host.generateEffectOrder(trigger)}
        />
      </div>
    </section>
  )
}

/**
 * Props for {@link TimelineSection}.
 */
export type TTimelineSection_P<TType extends TEffectType> = {
  /**
   * The effect trigger by which the items are grouped
   * in this section.
   */
  trigger: TEffectTrigger
  /**
   * The group of effects for the given trigger.
   */
  effects: TMetisClientComponents[TType][]
}
