import { TEffectTrigger } from '../../../../../../../../../shared/missions/effects'
import './TimelineLandingPad.scss'

/**
 * An empty area for dragged items to be dropped when
 * switching between timeline sections.
 */
export default function TimelineLandingPad({
  trigger,
  order,
}: TTimelineLandingPad_P): JSX.Element {
  /* -- RENDER -- */

  return (
    <div
      className={'TimelineLandingPad TimelineItemLike'}
      data-trigger={trigger}
      data-order={order}
    ></div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link TimelineLandingPad}.
 */
export type TTimelineLandingPad_P = {
  /**
   * The effect trigger section in which this
   * landing pad is located.
   */
  trigger: TEffectTrigger
  /**
   * The order in which this landing pad appears
   * relative to the other items in the timeline.
   */
  order: number
}
