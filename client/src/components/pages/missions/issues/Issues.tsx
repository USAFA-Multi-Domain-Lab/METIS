import { usePanelContext } from '@client/components/content/general-layout/panels/Panel'
import ButtonSvgPanel from '@client/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'
import If from '@client/components/content/util/If'
import { useMissionPageContext } from '@client/components/pages/missions/context'
import { useGlobalContext } from '@client/context/global'
import { ClientEffect } from '@client/missions/effects/ClientEffect'
import { ClientTargetEnvironment } from '@client/target-environments/ClientTargetEnvironment'
import { useRequireLogin } from '@client/toolbox/hooks'
import type { TMissionComponentIssue } from '@shared/missions/MissionComponent'
import { useState } from 'react'
import Tooltip from '../../../content/communication/Tooltip'
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
  const [_, selectView] = panelState.selectedView
  const [searchQuery, setSearchQuery] = useState<string>('')
  const warningButtonEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'warning-transparent',
        type: 'button',
        icon: 'warning-transparent',
        cursor: 'help',
        description:
          'If this conflict is not resolved, this mission can still be used to launch a session, but the session may not function as expected.',
      },
    ],
  })

  /* -- COMPUTED -- */

  /**
   * Filtered issues based on search query.
   */
  const filteredIssues = issues.filter((issue) =>
    issue.message.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  /* -- FUNCTIONS -- */

  /**
   * Handles selection of an issue in the list.
   * @param issue The issue that was selected.
   */
  const onIssueSelection = async (issue: TMissionComponentIssue) => {
    const { type, component } = issue

    if (component instanceof ClientEffect && type === 'outdated') {
      let { choice } = await prompt(
        'Would you like to attempt an update on this effect to make it compatible with the currently installed target-environment version?',
        ['Update', 'Cancel'],
      )

      // Abort, if the user cancels.
      if (choice === 'Cancel') return

      // Call the API to migrate the effect arguments.
      let results = await ClientTargetEnvironment.$migrateEffectArgs(component)

      // Store the migrated data in the component.
      component.targetEnvironmentVersion = results.resultingVersion
      component.args = results.resultingArgs

      onChange(component)
    } else {
      mission.select(component)

      // If configured, pan to the node associated
      // with the issue, assuming there is one.
      if (user.preferences.missionMap.panOnIssueSelection) {
        mission.requestFocusOnMap(component)
      }
    }

    // Switch to the specified panel view.
    if (switchToPanel) selectView({ title: switchToPanel })
  }

  /* -- RENDER -- */

  return (
    <div className='Issues'>
      <If condition={issues.length > 0}>
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
                  <div
                    className='IssueItem'
                    key={`issue-${component._id}`}
                    onClick={() => onIssueSelection(issue)}
                  >
                    <ButtonSvgPanel engine={warningButtonEngine} />
                    <div className='IssueMessage'>
                      {message}
                      <Tooltip description='Click to resolve.' />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className='NoResults'>No issues have been found.</div>
            )}
          </div>
        </div>
      </If>
    </div>
  )
}

/* -- types -- */

/**
 * Props for the `Issues` component.
 */
type TIssues_P = {
  /**
   * A panel title to switch to when an issue is selected.
   * @default undefined
   */
  switchToPanel?: string
}
