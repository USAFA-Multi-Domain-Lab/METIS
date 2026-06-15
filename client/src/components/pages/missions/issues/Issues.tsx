import ButtonSvgPanel from '@client/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'
import { useMissionPageContext } from '@client/components/pages/missions/context'
import { useEventListener } from '@client/toolbox/hooks'
import { useEffect, useState } from 'react'
import EffectUpdateControl from './EffectUpdateControl'
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
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  /* -- COMPUTED -- */

  // Computed before headerEngine so onClick closures reference current groups.
  let query = searchQuery.toLowerCase()
  let groups = issues
    .map(([component, issues]) => ({
      component,
      issues: issues.filter((issue) =>
        issue.message.toLowerCase().includes(query),
      ),
    }))
    .filter(({ issues }) => issues.length > 0)
  let allCollapsed =
    groups.length > 0 &&
    groups.every(({ component }) => collapsedGroups.has(component._id))

  /* -- ENGINES -- */

  const headerEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'expand-all',
        type: 'button',
        icon: 'expand',
        cursor: 'pointer',
        label: 'Expand all',
        hidden: !allCollapsed,
        onClick: () => setCollapsedGroups(new Set()),
      },
      {
        key: 'collapse-all',
        type: 'button',
        icon: 'collapse',
        cursor: 'pointer',
        label: 'Collapse all',
        hidden: allCollapsed,
        onClick: () =>
          setCollapsedGroups(
            new Set(groups.map(({ component }) => component._id)),
          ),
      },
    ],
  })

  /* -- EFFECTS -- */

  // Recalculate issues on registry change.
  useEventListener(mission.issueRegistry, 'change', () => {
    setIssues(mission.issueRegistry.groupedIssueEntries)
  })

  useEffect(() => {
    headerEngine.setHidden('collapse-all', allCollapsed)
    headerEngine.setHidden('expand-all', !allCollapsed)
  }, [allCollapsed])

  /* -- FUNCTIONS -- */

  const onToggleGroup = (id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  /* -- RENDER -- */

  return (
    <div className='Issues'>
      <div className='IssueList'>
        <div className='IssueListHeader'>
          <div className='SearchBox'>
            <input
              type='text'
              className='IssueSearch'
              placeholder='Filter issues'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ButtonSvgPanel engine={headerEngine} />
          <EffectUpdateControl scope={'mission-wide'} mission={mission} />
        </div>
        <div className='IssueListItems'>
          {groups.length > 0 ? (
            groups.map(({ component, issues }) => (
              <IssueGroup
                key={component._id}
                component={component}
                issues={issues}
                switchToPanel={switchToPanel}
                expanded={!collapsedGroups.has(component._id)}
                onToggle={() => onToggleGroup(component._id)}
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
