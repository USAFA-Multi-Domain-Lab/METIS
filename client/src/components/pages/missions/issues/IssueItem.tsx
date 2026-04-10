import Tooltip from '@client/components/content/communication/Tooltip'
import { usePanelContext } from '@client/components/content/general-layout/panels/Panel'
import ButtonSvgPanel from '@client/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'
import { useGlobalContext } from '@client/context/global'
import { ClientEffect } from '@client/missions/effects/ClientEffect'
import { ClientTargetEnvironment } from '@client/target-environments/ClientTargetEnvironment'
import { useRequireLogin } from '@client/toolbox/hooks'
import type { TMissionComponentIssue } from '@shared/missions/MissionComponent'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useState } from 'react'
import { useMissionPageContext } from '../context'
import type { TIssues_P } from './Issues'

/**
 * Displays a single issue within the list of mission issues.
 */
export default function IssueItem({
  issue,
  switchToPanel,
}: TIssueItem_P): TReactElement | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const { prompt, handleError } = globalContext.actions
  const { login } = useRequireLogin()
  const { user } = login
  const { state, onChange } = useMissionPageContext()
  const { state: panelState } = usePanelContext()
  const [mission] = state.mission
  const [, setCheckForIssues] = state.checkForIssues
  const [, selectView] = panelState.selectedView
  const [pendingFix, setPendingFix] = useState<boolean>(false)

  const buttonEngine = useButtonSvgEngine({
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

  let rootClasses = new ClassList('IssueItem')

  /* -- FUNCTIONS -- */

  /**
   * Handles selection of an issue in the list.
   * @param issue The issue that was selected.
   */
  const onIssueSelection = async (issue: TMissionComponentIssue) => {
    const { type, component } = issue

    if (component instanceof ClientEffect && type === 'outdated') {
      try {
        let { choice } = await prompt(
          'Would you like to attempt an update on this effect to make it compatible with the currently installed target-environment version?',
          ['Update', 'Cancel'],
        )

        // Abort, if the user cancels.
        if (choice === 'Cancel') return

        // Call the API to migrate the effect arguments.
        setPendingFix(true)
        let results =
          await ClientTargetEnvironment.$migrateEffectArgs(component)

        // Store the migrated data in the component.
        component.targetEnvironmentVersion = results.version
        component.args = results.data

        onChange(component)
        setCheckForIssues(true)
      } catch (error) {
        setPendingFix(false)
        handleError({
          message: 'Failed to update effect.',
          notifyMethod: 'bubble',
        })
      }
    } else {
      mission.select(component)

      // If configured, pan to the node associated
      // with the issue, assuming there is one.
      if (user.preferences.missionMap.panOnIssueSelection) {
        mission.requestFocusOnMap(component)
      }

      // Switch to the specified panel view.
      if (switchToPanel) selectView({ title: switchToPanel })
    }
  }

  /* -- RENDER -- */

  if (pendingFix) return null

  return (
    <div className={rootClasses.value} onClick={() => onIssueSelection(issue)}>
      <ButtonSvgPanel engine={buttonEngine} />
      <div className='IssueMessage'>
        {issue.message}
        <Tooltip description='Click to resolve.' />
      </div>
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link IssueItem}.
 */
export interface TIssueItem_P extends TIssues_P {
  /**
   * The issue to display.
   */
  issue: TMissionComponentIssue
}
