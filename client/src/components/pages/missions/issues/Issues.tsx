import { useMissionPageContext } from '@client/components/pages/missions/context'
import { useState } from 'react'
import IssueItem from './IssueItem'
import './Issues.scss'

/**
 * Displays a list of unresolved issues within the mission.
 */
export default function Issues({
  switchToPanel = undefined,
}: TIssues_P): TReactElement | null {
  /* -- STATE -- */

  const { state } = useMissionPageContext()
  const [issues] = state.issues
  const [searchQuery, setSearchQuery] = useState<string>('')

  /* -- COMPUTED -- */

  /**
   * Filtered issues based on search query.
   */
  const filteredIssues = issues.filter((issue) =>
    issue.message.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
          {filteredIssues.length > 0 ? (
            filteredIssues.map((issue) => {
              return (
                <IssueItem
                  key={issue.component._id + ' ' + issue.message}
                  issue={issue}
                  switchToPanel={switchToPanel}
                />
              )
            })
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
