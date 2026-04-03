import { usePanelContext } from '@client/components/content/general-layout/panels/Panel'
import { useMissionPageContext } from '@client/components/pages/missions/context'
import { useGlobalContext } from '@client/context/global'
import { useRequireLogin } from '@client/toolbox/hooks'
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

  const globalContext = useGlobalContext()
  const { prompt } = globalContext.actions
  const { login } = useRequireLogin()
  const { user } = login
  const { state, onChange } = useMissionPageContext()
  const { state: panelState } = usePanelContext()
  const [mission] = state.mission
  const [issues] = state.issues
  const [, setCheckForIssues] = state.checkForIssues
  const [, selectView] = panelState.selectedView
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
              const { component, message } = issue
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
