import { useRef } from 'react'
import { useGlobalContext, useNavigationMiddleware } from 'src/context'
import SessionClient from 'src/sessions'
import { compute } from 'src/toolbox'
import {
  useEventListener,
  useMountHandler,
  useRequireLogin,
} from 'src/toolbox/hooks'
import { DefaultLayout } from '.'
import Prompt from '../content/communication/Prompt'
import { HomeLink, TNavigation } from '../content/general-layout/Navigation'
import SessionMembers from '../content/session/members/SessionMembers'
import { ButtonText } from '../content/user-controls/buttons/ButtonText'
import './LobbyPage.scss'

/**
 * Page responsible for viewing/managing participants before
 * session start.
 */
export default function LobbyPage({
  session,
}: TLobbyPage_P): JSX.Element | null {
  /* -- state -- */

  const globalContext = useGlobalContext()
  const [server] = globalContext.server
  const [_] = useRequireLogin()
  const { beginLoading, finishLoading, navigateTo, handleError, prompt } =
    globalContext.actions

  /* -- computed -- */

  /**
   * Props for navigation.
   */
  const navigation = compute(
    (): TNavigation => ({
      links: [HomeLink(globalContext, { text: 'Quit' })],
      boxShadow: 'alt-3',
    }),
  )

  /**
   * The formatted accessibility for the session.
   */
  const accessibility = compute<string>(() => {
    switch (session.config.accessibility) {
      case 'public':
        return 'Public'
      case 'id-required':
        return 'ID Required'
      case 'invite-only':
        return 'Invite Only'
      default:
        return 'Unknown'
    }
  })

  /* -- FUNCTIONS -- */

  /**
   * Redirects to the correct page based on
   * the session state. Stays on the same page
   * if the session has not yet started.
   */
  const verifyNavigation = useRef(() => {
    // If the session is started, navigate to the session page.
    if (session.state === 'started') {
      navigateTo('SessionPage', { session }, { bypassMiddleware: true })
    }
    // If the session is ended, navigate to the home page.
    if (session.state === 'ended') {
      navigateTo('HomePage', {}, { bypassMiddleware: true })
    }
  })

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
      // Clear verify navigation function to prevent double
      // redirect.
      verifyNavigation.current = () => {}
      // Begin loading.
      beginLoading('Starting session...')
      // Start the session.
      await session.$start()
      // Redirect to session page.
      navigateTo('SessionPage', { session }, { bypassMiddleware: true })
    } catch (error) {
      handleError({
        message: 'Failed to start session.',
        notifyMethod: 'bubble',
      })
    }
  }

  /**
   * Callback for the session configuration button.
   */
  const onClickSessionConfig = () => {
    navigateTo('SessionConfigPage', { session })
  }

  /* -- EFFECTS -- */

  // Verify navigation on mount.
  useMountHandler((done) => {
    finishLoading()
    verifyNavigation.current()
    done()
  })

  // Verify navigation and update participant and
  // observers lists on session state change.
  useEventListener(
    server,
    ['session-started', 'session-ended', 'session-destroyed'],
    () => verifyNavigation.current(),
  )

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

  /* -- RENDER -- */

  /**
   * JSX for the button section.
   */
  const buttonSectionJsx = compute<JSX.Element>(() => {
    // Gather details.
    let buttonsJsx: JSX.Element[] = []

    // If the current member can start and end sessions,
    // add the start session button.
    if (session.member.isAuthorized('startEndSessions')) {
      buttonsJsx.push(
        <ButtonText
          key={'start-button'}
          text={'Start Session'}
          onClick={onClickStartSession}
        />,
      )
    }

    // If the current member can configure sessions,
    // add the configure session button.
    if (session.member.isAuthorized('configureSessions')) {
      buttonsJsx.push(
        <ButtonText
          key={'configure-button'}
          text={'Configure Session'}
          onClick={onClickSessionConfig}
        />,
      )
    }

    // Return the JSX.
    return <div className='ButtonSection Section'>{buttonsJsx}</div>
  })

  // Render root component.
  return (
    <div className='LobbyPage Page DarkPage'>
      <DefaultLayout navigation={navigation}>
        <div className='Title'>Lobby</div>
        <div className='DetailSection Section'>
          <div className='SessionId StaticDetail'>
            <div className='Label'>Session ID:</div>
            <div className='Value'>{session._id}</div>
          </div>
          <div className='Visibility StaticDetail'>
            <div className='Label'>Accessibility:</div>
            <div className='Value'>{accessibility}</div>
          </div>
          <div className='MissionName StaticDetail'>
            <div className='Label'>Mission:</div>
            <div className='Value'>{session.name}</div>
          </div>
        </div>
        <div className='MembersSection Section'>
          <SessionMembers session={session} />
        </div>
        {buttonSectionJsx}
      </DefaultLayout>
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
