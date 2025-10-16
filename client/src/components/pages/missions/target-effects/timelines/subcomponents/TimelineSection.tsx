import { TMetisClientComponents } from 'src'
import If from 'src/components/content/util/If'
import {
  TEffectTrigger,
  TEffectType,
} from '../../../../../../../../shared/missions/effects'
import StringToolbox from '../../../../../../../../shared/toolbox/strings'
import { TimelineItem } from './TimelineItem'
import { TimelineNoItems } from './TimelineNoItems'
import './TimelineSection.scss'

/**
 * A section displaying timeline items specific to
 * the given effect trigger.
 */
export function TimelineSection<TType extends TEffectType>({
  trigger,
  effects,
}: TTimelineSection_P<TType>) {
  return (
    <section className='TimelineSection'>
      <div className='TimelineSectionHeading'>
        {StringToolbox.toTitleCase(trigger)}
      </div>
      <div className='TimelineItems'>
        <If condition={effects.length === 0}>
          <TimelineNoItems />
        </If>
        <If condition={effects.length > 0}>
          {effects.map((effect) => (
            <TimelineItem key={effect._id} item={effect} />
          ))}
        </If>
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
