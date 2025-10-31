import { useState } from 'react'
import { useGlobalContext } from 'src/context/global'
import ClientMission from 'src/missions'
import SessionClient from 'src/sessions'
import { compute } from 'src/toolbox'
import { useMountHandler, useRequireLogin } from 'src/toolbox/hooks'
import { DefaultPageLayout } from '.'
import { TMissionComponentDefect } from '../../../../shared/missions/component'
import Session from '../../../../shared/sessions'
import { ESortByMethod } from '../content/general-layout/ListOld'
import { TNavigation_P } from '../content/general-layout/Navigation'
import SessionConfig from '../content/session/SessionConfig'
import ButtonSvgPanel from '../content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '../content/user-controls/buttons/panels/hooks'
import './LaunchPage.scss'

/**
 * Page responsible for launching a session with the given
 * configuration.
 */
export default function LaunchPage({
  missionId,
  returnPage,
}: TLaunchPage_P): TReactElement | null {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()
  const [server] = globalContext.server
  const {
    beginLoading,
    finishLoading,
    handleError,
    notify,
    navigateTo,
    prompt,
  } = globalContext.actions

  /* -- STATE -- */

  const [mission, setMission] = useState<ClientMission>(
    ClientMission.createNew(),
  )
  const [sessionConfig] = useState(Session.DEFAULT_CONFIG)
  const defectiveComponentButtonEngine = useButtonSvgEngine({
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
  const navButtonEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'cancel',
        type: 'button',
        icon: 'cancel',
        description: 'Cancel',
        onClick: () => cancel(),
      },
    ],
  })

  /* -- LOGIN-SPECIFIC LOGIC -- */

  // Require login for page.
  const { isAuthorized } = useRequireLogin()

  /* -- EFFECTS -- */

  const [mountHandled] = useMountHandler(async (done) => {
    // Make sure the user has access to the page.
    if (!isAuthorized('sessions_write_native')) {
      handleError(
        'You do not have access to this page. Please contact an administrator.',
      )
      return done()
    }

    // Handle the editing of an existing mission.
    if (missionId !== null) {
      try {
        // Notify user of loading.
        beginLoading('Loading mission...')
        // Load mission.
        let mission = await ClientMission.$fetchOne(missionId)
        // Store mission in the state.
        setMission(mission)
      } catch {
        handleError('Failed to load launch page.')
      }
    }

    // Finish loading.
    finishLoading()
    // Mark mount as handled.
    done()
  })

  /* -- FUNCTIONS -- */
  /**
   * Renders JSX for the effect list item.
   */
  const renderObjectListItem = (defect: TMissionComponentDefect) => {
    const { component, message } = defect

    return (
      <div className='Row' key={`object-row-${component._id}`}>
        <ButtonSvgPanel engine={defectiveComponentButtonEngine} />
        <div className='RowContent'>{message}</div>
      </div>
    )
  }

  /**
   * Callback for saving the session configuration, which
   * launches the session.
   */
  const launch = async () => {
    if (server !== null) {
      try {
        // If there are invalid objects and effects are enabled...
        if (sessionConfig.effectsEnabled && mission.defects.length > 0) {
          // Create a message for the user.
          let message =
            `**Warning:** The mission for this session is defective due to unresolved conflicts. If you proceed, the session may not function as expected.\n` +
            `**What would you like to do?**`
          // Create a list of choices for the user.
          let choices: string[] = []

          // Generate choices based on the user's permissions.
          if (isAuthorized(['missions_write', 'sessions_write_native'])) {
            choices = ['Edit Mission', 'Launch Anyway', 'Cancel']
          } else if (isAuthorized('sessions_write_native')) {
            choices = ['Launch Anyway', 'Cancel']
          } else {
            choices = ['Cancel']
          }

          // Prompt the user for a choice.
          let { choice } = await prompt(message, choices, {
            list: {
              items: mission.defects,
              headingText: 'Unresolved Defects',
              sortByMethods: [ESortByMethod.Name],
              searchableProperties: ['message'],
              renderObjectListItem,
            },
          })
          // If the user cancels then cancel the launch.
          if (choice === 'Cancel') return
          // If the user chooses to edit the mission then navigate to the mission page.
          if (choice === 'Edit Mission') {
            navigateTo('MissionPage', { missionId: mission._id })
          }
          // If the user chooses to launch anyway then launch the session.
          if (choice === 'Launch Anyway') {
            // Notify user of session launch.
            beginLoading('Launching session...')
            // Launch session from mission ID.
            await SessionClient.$launch(mission._id, sessionConfig)
            // Navigate to home page.
            navigateTo('HomePage', {})
            // Notify user of success.
            notify('Successfully launched session.')
          }
        } else {
          // Notify user of session launch.
          beginLoading('Launching session...')
          // Launch session from mission ID.
          await SessionClient.$launch(mission._id, sessionConfig)
          // Navigate to home page.
          navigateTo('HomePage', {})
          // Notify user of success.
          notify('Successfully launched session.')
        }
      } catch (error) {
        handleError({
          message: 'Failed to launch session. Contact system administrator.',
          notifyMethod: 'bubble',
        })
      }
    } else {
      handleError({
        message: 'No server connection. Contact system administrator',
        notifyMethod: 'bubble',
      })
    }
  }

  /**
   * Cancels the launch.
   */
  const cancel = () => {
    if (returnPage === 'MissionPage') navigateTo('MissionPage', { missionId })
    else if (returnPage === 'HomePage') navigateTo('HomePage', {})
  }

  /**
   * Config for the navigation on this page.
   */
  const navigation = compute<TNavigation_P>(() => {
    return { buttonEngine: navButtonEngine }
  })

  /* -- RENDER -- */

  if (mountHandled) {
    return (
      <div className='LaunchPage Page'>
        <DefaultPageLayout navigation={navigation}>
          <div className='MissionName'>{mission.name}</div>
          <SessionConfig
            sessionConfig={sessionConfig}
            mission={mission}
            saveButtonText={'Launch'}
            onSave={launch}
            onCancel={cancel}
          />
        </DefaultPageLayout>
      </div>
    )
  } else {
    return null
  }
}

/**
 * Props for `LaunchPage` component.
 */
export type TLaunchPage_P = {
  /**
   * The ID of the session to configure.
   */
  missionId: string
  /**
   * The page to return to if the launch is cancelled.
   */
  returnPage: 'HomePage' | 'MissionPage'
}
