import type { MissionComponent } from '@shared/missions/MissionComponent'
import type { MissionComponentIssue } from '@shared/missions/MissionComponentIssue'
import { ClassList } from '@shared/toolbox/html/ClassList'
import {
  computeOutlineIconStyling,
  type TMissionOutlineItem,
} from '../structures/MissionOutline'
import IssueItem from './IssueItem'
import type { TIssues_P } from './Issues'

/**
 * Renders a collapsible group of issues belonging to a single mission component.
 */
export default function IssueGroup({
  component,
  issues,
  switchToPanel,
  expanded,
  onToggle,
}: TIssueGroup_P): TReactElement | null {
  /* -- COMPUTED -- */

  let outlineItem = component as unknown as TMissionOutlineItem
  let indicatorClasses = new ClassList('Indicator').set(
    'isCollapsed',
    !expanded,
  )

  /* -- RENDER -- */

  return (
    <div className='IssueGroup'>
      <div className='IssueGroupHeader' onClick={onToggle}>
        <div className={indicatorClasses.value}></div>
        <div
          className='IssueGroupIcon'
          style={computeOutlineIconStyling(outlineItem)}
        ></div>
        <div className='IssueGroupName'>{outlineItem.name}</div>
        <div className='IssueGroupBadge'>{issues.length}</div>
      </div>
      {expanded && (
        <div className='IssueGroupItems'>
          {issues.map((issue) => (
            <IssueItem
              key={issue.key}
              issue={issue}
              switchToPanel={switchToPanel}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link IssueGroup}.
 */
export interface TIssueGroup_P extends TIssues_P {
  /**
   * The component that owns this group of issues.
   */
  component: MissionComponent<any, any>
  /**
   * The issues belonging to this component.
   */
  issues: MissionComponentIssue<any>[]
  /**
   * Whether this group is currently expanded.
   */
  expanded: boolean
  /**
   * Called when the user clicks the group header to toggle its collapsed state.
   */
  onToggle: () => void
}
