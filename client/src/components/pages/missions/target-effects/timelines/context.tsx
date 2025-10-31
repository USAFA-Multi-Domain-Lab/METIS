import { LocalContext } from 'src/context/local'
import { TEffectType } from '../../../../../../../shared/missions/effects'
import {
  TEffectTimeline_E,
  TEffectTimeline_P,
  TEffectTimeline_S,
} from './EffectTimeline'

/**
 * Local context for the {@link EffectTimeline} component.
 */
export const timelineContext = new LocalContext<
  TEffectTimeline_P<any>,
  {},
  TEffectTimeline_S<any>,
  TEffectTimeline_E
>()

/**
 * Hook which subcomponents of {@link EffectTimeline} can use
 * to access the local context of the timeline.
 */
export const useTimelineContext = <TType extends TEffectType>() => {
  return timelineContext.getHook<
    TEffectTimeline_P<TType>,
    {},
    TEffectTimeline_S<TType>,
    TEffectTimeline_E
  >()()
}
