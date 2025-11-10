import WarningIndicator from '@client/components/content/user-controls/WarningIndicator'
import { compute } from '@client/toolbox'
import type { TEffectType } from '@shared/missions/effects/Effect'
import type { TMissionComponentDefect } from '@shared/missions/MissionComponent'
import { TimelineItemCell } from './TimelineItemCell'

/**
 * If the effect is defective, this will display a warning
 * notifying the user of why it is defective.
 */
export default function TimelineDefectiveCell<TType extends TEffectType>({
  defects,
}: TTimelineDefectiveCell_P<TType>): TReactElement | null {
  /* -- COMPUTED -- */

  /**
   * Whether or not the item is defective.
   */
  const defective = compute<boolean>(() => {
    return Boolean(defects.length)
  })

  /**
   * The message to display in the warning
   * indicator tooltip.
   */
  const warningDescription = compute<string>(() => {
    let result = ''

    if (defects.length) {
      result = defects[0].message
    }
    if (defects.length > 1) {
      result += `\n**(+${defects.length - 1} other issues)**`
    }

    return result
  })

  /* -- RENDER -- */

  // Abort render if the item is not defective.
  if (!defective) return null

  return (
    <TimelineItemCell classes='TimelineDefectiveCell'>
      <WarningIndicator active={defective} description={warningDescription} />
    </TimelineItemCell>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link TimelineDefectiveCell}.
 */
export type TTimelineDefectiveCell_P<TType extends TEffectType> = {
  /**
   * The defects present in the effect.
   */
  defects: TMissionComponentDefect[]
}
