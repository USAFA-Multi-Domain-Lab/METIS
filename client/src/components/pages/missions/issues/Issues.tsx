import { useMissionPageContext } from '@client/components/pages/missions/context'
import { useEventListener } from '@client/toolbox/hooks'
import { useState } from 'react'
import IssueGroup from './IssueGroup'
import './Issues.scss'

/**
 * Displays a list of unresolved issues within the mission, grouped by component.
 */
export default function Issues({
  switchToPanel = undefined,
}: TIssues_P): TReactElement | null {
  /* -- STATE -- */

  const { state } = useMissionPageContext()
  const [mission] = state.mission
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [issues, setIssues] = useState(
    mission.issueRegistry.groupedIssueEntries,
  )

  /* -- COMPUTED -- */

  let query = searchQuery.toLowerCase()
  let groups = issues
    .map(([component, issues]) => ({
      component,
      issues: issues.filter((issue) =>
        issue.message.toLowerCase().includes(query),
      ),
    }))
    .filter(({ issues }) => issues.length > 0)

  /* -- EFFECTS -- */

  // Recalculate issues on registry change.
  useEventListener(mission.issueRegistry, 'change', () => {
    setIssues(mission.issueRegistry.groupedIssueEntries)
  })

  /* -- RENDER -- */

  return (
    <div className='Issues'>
      <div className='IssueList'>
        <div className='IssueListHeader'>
          <h3>Issues</h3>
          <div className='SearchBox'>
            <input
              type='text'
              className='IssueSearch'
              placeholder='Filter issues'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className='IssueListItems'>
          {groups.length > 0 ? (
            groups.map(({ component, issues }) => (
              <IssueGroup
                key={component._id}
                component={component}
                issues={issues}
                switchToPanel={switchToPanel}
              />
            ))
          ) : (
            <div className='NoResults'>No issues found.</div>
          )}
        </div>
      </div>
    </div>
  )
}

/* -- types -- */

/**
 * Props for the `Issues` component.
 */
export type TIssues_P = {
  /**
   * A panel title to switch to when an issue is selected.
   * @default undefined
   */
  switchToPanel?: string
}
