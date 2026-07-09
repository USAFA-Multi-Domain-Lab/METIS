import {
  useGlobalContext,
  useNavigationMiddleware,
} from '@client/context/global'
import type { SessionClient } from '@client/sessions/SessionClient'
import type { ClientEnvironmentTask } from '@client/target-environments/ClientEnvironmentTask'
import { compute } from '@client/toolbox'
import {
  useEventListener,
  useMountHandler,
  useRequireLogin,
} from '@client/toolbox/hooks'
import { useSessionRedirects } from '@client/toolbox/hooks/sessions'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useEffect, useRef, useState } from 'react'
import { DefaultPageLayout } from '..'
import Prompt from '../../content/communication/Prompt'
import SessionMemberList from '../../content/data/lists/implementations/members/SessionMemberList'
import type { TNavigation_P } from '../../content/general-layout/Navigation'
import { HomeButton } from '../../content/general-layout/Navigation'
import Panel from '../../content/general-layout/panels/Panel'
import PanelView from '../../content/general-layout/panels/PanelView'
import { useButtonSvgEngine } from '../../content/user-controls/buttons/panels/hooks'
import './LobbyPage.scss'
import SessionLobbyConfig from './subcomponents/SessionLobbyConfig'

/**
 * Page responsible for viewing/managing participants before
 * session start.
 */
export default function LobbyPage({
  session,
  session: { mission },
}: TLobbyPage_P): TReactElement | null {
  /* -- STATE -- */

  const {} = useRequireLogin()
  const globalContext = useGlobalContext()
  const [server] = globalContext.server
  const { finishLoading, handleError, prompt } = globalContext.actions
  const navigationButtonEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'start-session',
        type: 'button',
        icon: 'play',
        description: 'Start session',
        hidden: !session.member.isAuthorized('startEndSessions'),
        onClick: () => onClickStartSession(),
      },
      HomeButton({ icon: 'quit', description: 'Quit session' }),
    ],
  })
  const { verifyNavigation } = useSessionRedirects(session)
  const [startInitiated, setStartInitiated] = useState<boolean>(
    session.state === 'starting',
  )
  const [setupFailed, setSetupFailed] = useState<boolean>(session.setupFailed)
  const [setupTasks, setSetupTasks] = useState<ClientEnvironmentTask[]>([
    ...session.setupTasks,
  ])
  const [, setConfigVersion] = useState<number>(0)
  const selectView = useRef((title: string) => {})

  /* -- COMPUTED -- */

  /**
   * Config for the navigation on this page.
   */
  const navigation = compute<TNavigation_P>(() => {
    return { buttonEngine: navigationButtonEngine }
  })

  /**
   * Status message for when session start is initiated.
   */
  const startStatus = compute<string>(() => {
    if (setupFailed) {
      return ' The session encountered an error during setup. For details concerning the error, please reference the server logs. Please navigate home and perform a hard delete. Then, relaunch the session and try again.'
    }
    return 'Session start initiated by manager. Session will start once setup is complete...'
  })

  /**
   * Classes for the start status element.
   */
  const startStatusClasses = compute<ClassList>(() => {
    return new ClassList('StartStatus').set('StartStatusFailure', setupFailed)
  })

  /* -- FUNCTIONS -- */

  /**
   * Callback for the start session button.
   */
  const onClickStartSession = async () => {
    // If the session is not unstarted, verify navigation.
    if (session.state !== 'unstarted') {
      verifyNavigation.current()
      return
    }

    // Confirm the user wants to start the session.
    let { choice } = await prompt(
      'Please confirm starting the session.',
      Prompt.ConfirmationChoices,
    )

    // If the user cancels, return.
    if (choice === 'Cancel') {
      return
    }

    try {
      // Start the session.
      await session.$start()
    } catch (error) {
      handleError({
        message: 'Failed to start session.',
        notifyMethod: 'bubble',
      })
    }
  }

  /* -- EFFECTS -- */

  useMountHandler((done) => {
    finishLoading()
    done()
  })

  // Listen for when session-start is initiated
  // by a manager.
  useEventListener(server, 'session-starting', () => {
    setStartInitiated(true)
  })

  useEventListener(server, 'session-task-update', () => {
    setSetupFailed(session.setupFailed)
    setSetupTasks([...session.setupTasks])
  })

  // Re-render when the config changes (locally via auto-save, or
  // remotely from another manager) so the property badges stay
  // in sync.
  useEventListener(server, 'session-config-updated', () => {
    setConfigVersion((version) => version + 1)
  })

  // Add navigation middleware to properly
  // quit the session before the user navigates
  // away.
  useNavigationMiddleware(async (to, next) => {
    // If the user is navigating to the session configuration
    // page, permit navigation.
    if (to === 'SessionConfigPage') {
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

  // Disable the start session button if the session
  // start has been initiated.
  useEffect(() => {
    navigationButtonEngine.setDisabled('start-session', startInitiated)
  }, [startInitiated])

  // todo: Uncomment this when task-management system is overhauled.
  // Once session start is initiated, auto-select the setup view
  // so authorized members can monitor target environment setup.
  // useEffect(() => {
  //   if (
  //     startInitiated &&
  //     session.member.isAuthorized('viewTargetEnvironmentTasks')
  //   ) {
  //     selectView.current('Setup')
  //   }
  // }, [startInitiated])

  /* -- RENDER -- */

  // Render root component.
  return (
    <div className='LobbyPage Page'>
      <DefaultPageLayout navigation={navigation}>
        <div className='DetailSection Section'>
          <div className='Title'>Lobby</div>
          <div className='Subtitle'>{session.name}</div>
        </div>
        {startInitiated && (
          <div className='StatusSection Section'>
            <div className={startStatusClasses.value}>{startStatus}</div>
          </div>
        )}
        <Panel transparent selectView={selectView}>
          <PanelView title={'Members'}>
            <div className='MembersSection Section'>
              <SessionMemberList session={session} />
            </div>
          </PanelView>
          {session.member.isAuthorized('configureSessions') && (
            <PanelView title={'Configuration'}>
              <div className='ConfigurationSection Section'>
                <SessionLobbyConfig
                  session={session}
                  disabled={startInitiated}
                />
              </div>
            </PanelView>
          )}
          {/* todo: Uncomment this when task management system is overhauled.
           {startInitiated &&
            session.member.isAuthorized('viewTargetEnvironmentTasks') && (
              <PanelView
                title={'Setup'}
                description={
                  'Setup status of target environments used by this mission.'
                }
                highlighted={setupFailed}
              >
                <div className='SetupSection Section'>
                  <TargetEnvironmentTaskList tasks={setupTasks} />
                </div>
              </PanelView>
            )} */}
        </Panel>
      </DefaultPageLayout>
    </div>
  )
}

/**
 * Props for `LobbyPage` component.
 */
export type TLobbyPage_P = {
  /**
   * The session client to use on the page.
   */
  session: SessionClient
}
