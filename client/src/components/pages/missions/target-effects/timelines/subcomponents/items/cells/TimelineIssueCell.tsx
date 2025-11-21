import WarningIndicator from '@client/components/content/user-controls/WarningIndicator'
import { compute } from '@client/toolbox'
import type { TEffectType } from '@shared/missions/effects/Effect'
import type { TMissionComponentIssue } from '@shared/missions/MissionComponent'
import { TimelineItemCell } from './TimelineItemCell'

/**
 * If the effect has issues, this will display a warning
 * notifying the user of the issues.
 */
export default function TimelineIssueCell<TType extends TEffectType>({
  issues,
}: TTimelineIssueCell_P<TType>): TReactElement | null {
  /* -- COMPUTED -- */

  /**
   * Whether or not the item has issues.
   */
  const hasIssues = compute<boolean>(() => {
    return Boolean(issues.length)
  })

  /**
   * The message to display in the warning
   * indicator tooltip.
   */
  const warningDescription = compute<string>(() => {
    let result = ''

    if (issues.length) {
      result = issues[0].message
    }
    if (issues.length > 1) {
      result += `\n**(+${issues.length - 1} other issues)**`
    }

    return result
  })

  /* -- RENDER -- */

  // Abort render if the item has no issues.
  if (!hasIssues) return null

  return (
    <TimelineItemCell classes='TimelineIssueCell'>
      <WarningIndicator active={hasIssues} description={warningDescription} />
    </TimelineItemCell>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link TimelineIssueCell}.
 */
export type TTimelineIssueCell_P<TType extends TEffectType> = {
  /**
   * The issues present in the effect.
   */
  issues: TMissionComponentIssue[]
}
