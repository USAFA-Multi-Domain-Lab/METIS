import { useState } from 'react'
import { useGlobalContext, useNavigationMiddleware } from 'src/context/global'
import SessionClient from 'src/sessions'
import { compute } from 'src/toolbox'
import {
  useEventListener,
  useMountHandler,
  useRequireLogin,
} from 'src/toolbox/hooks'
import { useSessionRedirects } from 'src/toolbox/hooks/sessions'
import { DefaultPageLayout } from '.'
import Prompt from '../content/communication/Prompt'
import { HomeButton, TNavigation_P } from '../content/general-layout/Navigation'
import SessionMembers from '../content/session/members/SessionMembers'
import { ButtonText } from '../content/user-controls/buttons/ButtonText'
import { useButtonSvgEngine } from '../content/user-controls/buttons/panels/hooks'
import If from '../content/util/If'
import './LobbyPage.scss'

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
  const { beginLoading, finishLoading, navigateTo, handleError, prompt } =
    globalContext.actions
  const navButtonEngine = useButtonSvgEngine({
    elements: [HomeButton({ icon: 'quit', description: 'Quit session' })],
  })
  const { verifyNavigation } = useSessionRedirects(session)
  const [startInitiated, setStartInitiated] = useState<boolean>(
    session.state === 'starting',
  )

  /* -- COMPUTED -- */

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

  /**
   * Config for the navigation on this page.
   */
  const navigation = compute<TNavigation_P>(() => {
    return { buttonEngine: navButtonEngine }
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

  /**
   * Callback for the session configuration button.
   */
  const onClickSessionConfig = () => {
    navigateTo('SessionConfigPage', { session })
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
  const buttonSectionJsx = compute<TReactElement>(() => {
    // Gather details.
    let buttonsJsx: TReactElement[] = []

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
      <DefaultPageLayout navigation={navigation}>
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
          <div className='SessionName StaticDetail'>
            <div className='Label'>Session:</div>
            <div className='Value'>{session.name}</div>
          </div>
          <div className='MissionName StaticDetail'>
            <div className='Label'>Mission:</div>
            <div className='Value'>{mission.name}</div>
          </div>
        </div>
        <If condition={startInitiated}>
          <div className='StatusSection Section'>
            <div className='StartStatus'>
              Session start initiated by manager. Session will start once setup
              is complete...
            </div>
          </div>
        </If>
        <div className='MembersSection Section'>
          <SessionMembers session={session} />
        </div>
        <If condition={!startInitiated}>{buttonSectionJsx}</If>
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
