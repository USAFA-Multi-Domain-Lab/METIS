import {
  useGlobalContext,
  useNavigationMiddleware,
} from '@client/context/global'

import type { SessionClient } from '@client/sessions/SessionClient'
import { compute } from '@client/toolbox'
import {
  useEventListener,
  useMountHandler,
  useRequireLogin,
} from '@client/toolbox/hooks'
import type { TMissionComponentIssue } from '@shared/missions/MissionComponent'
import { useState } from 'react'
import { DefaultPageLayout } from '.'
import Prompt from '../content/communication/Prompt'
import { ESortByMethod } from '../content/general-layout/ListOld'
import type { TNavigation_P } from '../content/general-layout/Navigation'
import SessionConfig from '../content/session/config/SessionConfig'
import ButtonSvgPanel from '../content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '../content/user-controls/buttons/panels/hooks'
import './SessionConfigPage.scss'

export default function SessionConfigPage({
  session,
  session: { mission },
  cancelPage,
}: TSessionConfigPage_P): TReactElement | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const {
    navigateTo,
    beginLoading,
    finishLoading,
    prompt,
    handleError,
    notify,
  } = globalContext.actions
  const [server] = globalContext.server
  const [config] = useState(session.config)
  const [isStarting, setIsStarting] = useState<boolean>(false)
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
  const componentWithIssuesButtonEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'warning-transparent',
        type: 'button',
        icon: 'warning-transparent',
        cursor: 'help',
        description:
          'If this conflict is not resolved, this mission can still be used to start a session, but the session may not function as expected.',
      },
    ],
  })
  const { isAuthorized } = useRequireLogin()

  /* -- FUNCTIONS -- */

  /**
   * Renders JSX for the issue list item.
   */
  const renderMissionComponent = (issue: TMissionComponentIssue) => {
    const { component, message } = issue

    return (
      <div className='Row' key={`object-row-${component._id}`}>
        <ButtonSvgPanel engine={componentWithIssuesButtonEngine} />
        <div className='RowContent'>{message}</div>
      </div>
    )
  }

  /**
   * Starts the session for play-testing purposes.
   */
  const startTestPlay = async (): Promise<void> => {
    // Prevent multiple simultaneous start attempts
    if (isStarting) {
      console.warn(
        'Session-start already in progress, ignoring duplicate request.',
      )
      return
    }
    if (cancelPage === 'LobbyPage') {
      throw new Error('Cannot start play test with LobbyPage as cancel page.')
    }

    try {
      let proceedToStart = true

      // Set starting state to prevent duplicate starts
      setIsStarting(true)

      // If there are issues in the mission given the
      // current state of the config, then prompt the
      // user before proceeding.
      if (mission.getIssuesForConfig(config).length) {
        // Create a message for the user.
        let message =
          `**Warning:** The mission for this session has issues due to unresolved conflicts. If you proceed, the session may not function as expected.\n` +
          `**What would you like to do?**`
        // Create a list of choices for the user.
        let choices: Array<'Edit Mission' | 'Start Anyway' | 'Cancel'> = []

        // Generate choices based on the user's permissions.
        if (isAuthorized(['missions_write', 'sessions_write_native'])) {
          choices = ['Edit Mission', 'Start Anyway', 'Cancel']
        } else if (isAuthorized('sessions_write_native')) {
          choices = ['Start Anyway', 'Cancel']
        } else {
          choices = ['Cancel']
        }

        // Prompt the user for a choice.
        let { choice } = await prompt(message, choices, {
          list: {
            items: mission.issues,
            headingText: 'Issues',
            sortByMethods: [ESortByMethod.Name],
            searchableProperties: ['message'],
            renderObjectListItem: renderMissionComponent,
          },
        })
        // If the user cancels or chooses to edit the mission,
        // do not proceed with starting the session.
        if (choice === 'Cancel' || choice === 'Edit Mission') {
          proceedToStart = false
        }
        // If the user chooses to edit the mission then navigate
        // to the mission page.
        if (choice === 'Edit Mission') {
          navigateTo('MissionPage', { missionId: mission._id })
        }
      }

      // Proceed to start the session if permitted.
      if (proceedToStart) {
        beginLoading('Saving session configuration...')
        await session.$updateConfig(config)
        // Notify user of session start.
        beginLoading('Starting play-test...')
        await session.$start()
        finishLoading()
        // Navigate directly to the session page
        navigateTo(
          'SessionPage',
          { session, returnPage: cancelPage },
          { bypassMiddleware: true },
        )
        notify('Successfully started session.')
      }
    } catch (error: any) {
      console.error('Error starting play-test session:')
      console.error(error)
      handleError({
        message:
          'Failed to start play-test session. Please contact system administrator.',
        notifyMethod: 'bubble',
      })
    } finally {
      setIsStarting(false)
    }
  }

  /**
   * Saves the session configuration.
   */
  const save = async (): Promise<void> => {
    try {
      // If this is a testing session (play-test), auto-start it
      if (config.accessibility === 'testing') {
        startTestPlay()
      } else {
        beginLoading('Saving session configuration...')
        await session.$updateConfig(config)
        finishLoading()

        // Redirect to the lobby page for normal sessions
        navigateTo('LobbyPage', { session })
      }
    } catch (error) {
      handleError({
        message: 'Failed to save session configuration.',
        notifyMethod: 'bubble',
      })
    }
  }

  /**
   * Cancels the configuration.
   */
  const cancel = async (): Promise<void> => {
    if (config.accessibility === 'testing') {
      await session.$quit()
    }

    // Navigate to the specified cancel page.
    switch (cancelPage) {
      case 'HomePage':
        // Navigate to the lobby page.
        navigateTo(cancelPage, { session })
        break
      case 'MissionPage':
        navigateTo(cancelPage, { missionId: mission._id })
        break
      case 'LobbyPage':
      default:
        navigateTo('LobbyPage', { session })
        break
    }
  }

  /* -- EFFECTS -- */

  useMountHandler((done) => {
    finishLoading()
    done()
  })

  // Add navigation middleware to properly
  // quit the session before the user navigates
  // away.
  useNavigationMiddleware(async (to, next) => {
    // If the user is navigating to the lobby page
    // page, permit navigation.
    if (to === 'LobbyPage' || config.accessibility === 'testing') {
      return next()
    }

    // Otherwise, prompt the user for confirmation.
    let { choice } = await prompt(
      'Are you sure you want to quit?',
      Prompt.YesNoChoices,
    )

    // If the user confirms quit, proceed.
    if (choice === 'Yes') {
      try {
        await session.$quit()
        next()
      } catch (error) {
        handleError({
          message: 'Failed to quit session.',
          notifyMethod: 'bubble',
        })
      }
    }
  })

  // Handle session setup failures.
  useEventListener(
    server,
    'session-setup-update',
    () => {
      if (session.setupFailed) {
        cancel()
        handleError({
          message:
            'Play-test setup failed. Please contact system administrator.',
          notifyMethod: 'bubble',
        })
      }
    },
    [server],
  )

  /* -- COMPUTED -- */

  /**
   * Config for the navigation on this page.
   */
  const navigation = compute<TNavigation_P>(() => {
    return { buttonEngine: navButtonEngine }
  })

  /**
   * Text for the save button.
   */
  const saveButtonText = compute<string>(() => {
    if (config.accessibility === 'testing') {
      return 'Start Play-Test'
    } else {
      return 'Save'
    }
  })

  return (
    <div className='SessionConfigPage Page DarkPage'>
      <DefaultPageLayout navigation={navigation}>
        <SessionConfig
          sessionConfig={config}
          mission={mission}
          sessionId={session._id}
          saveButtonText={saveButtonText}
          disabled={isStarting}
          onSave={save}
          onCancel={cancel}
        />
      </DefaultPageLayout>
    </div>
  )
}

/**
 * Props for `SessionConfigPage` component.
 */
export type TSessionConfigPage_P = {
  /**
   * The session to configure.
   */
  session: SessionClient
  /**
   * The page to navigate to if the configuration is cancelled.
   */
  cancelPage: 'HomePage' | 'MissionPage' | 'LobbyPage'
}
