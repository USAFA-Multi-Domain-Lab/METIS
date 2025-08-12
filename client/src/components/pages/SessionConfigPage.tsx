import { useRef, useState } from 'react'
import { useGlobalContext, useNavigationMiddleware } from 'src/context/global'
import SessionClient from 'src/sessions'
import { compute } from 'src/toolbox'
import { useEventListener, useMountHandler } from 'src/toolbox/hooks'
import { DefaultPageLayout } from '.'
import Prompt from '../content/communication/Prompt'
import { TNavigation_P } from '../content/general-layout/Navigation'
import SessionConfig from '../content/session/SessionConfig'
import { useButtonSvgEngine } from '../content/user-controls/buttons/panels/hooks'
import './SessionConfigPage.scss'

export default function SessionConfigPage({
  session,
  session: { mission },
}: TSessionConfigPage_P): JSX.Element | null {
  /* -- state -- */

  const globalContext = useGlobalContext()
  const [server] = globalContext.server
  const {
    navigateTo,
    beginLoading,
    finishLoading,
    prompt,
    handleError,
    notify,
  } = globalContext.actions
  const [config] = useState(session.config)
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

  /* -- functions -- */

  /**
   * Redirects to the correct page based on
   * the session state. Stays on the same page
   * if the session has not yet started.
   */
  const verifyNavigation = useRef(() => {
    // If the session is started, navigate to the session page.
    if (session.state === 'started') {
      navigateTo(
        'SessionPage',
        { session, returnPage: 'HomePage' },
        { bypassMiddleware: true },
      )
    }
    // If the session is ended, navigate to the home page.
    if (session.state === 'ended') {
      notify('Session has ended.')
      navigateTo('HomePage', {}, { bypassMiddleware: true })
    }
  })

  /**
   * Saves the session configuration.
   */
  const save = async (): Promise<void> => {
    try {
      // Begin loading.
      beginLoading('Saving session configuration...')
      // Save the session configuration.
      await session.$updateConfig(config)
      // Redirect to the lobby page.
      navigateTo('LobbyPage', { session })
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
  const cancel = (): void => {
    // Navigate to the lobby page.
    navigateTo('LobbyPage', { session })
  }

  /* -- effects -- */

  // Verify navigation on mount.
  useMountHandler((done) => {
    finishLoading()
    verifyNavigation.current()
    done()
  })
  // Verify navigation if the session is ended or destroyed.
  useEventListener(
    server,
    ['session-started', 'session-ended', 'session-destroyed'],
    () => verifyNavigation.current(),
  )

  // Add navigation middleware to properly
  // quit the session before the user navigates
  // away.
  useNavigationMiddleware(async (to, next) => {
    // If the user is navigating to the lobby page
    // page, permit navigation.
    if (to === 'LobbyPage') {
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

  /* -- COMPUTED -- */

  /**
   * Config for the navigation on this page.
   */
  const navigation = compute<TNavigation_P>(() => {
    return { buttonEngine: navButtonEngine }
  })

  return (
    <div className='SessionConfigPage Page DarkPage'>
      <DefaultPageLayout navigation={navigation}>
        <div className='Title'>Session Configuration</div>
        <div className='DetailSection Section'>
          <div className='SessionId StaticDetail'>
            <div className='Label'>Session ID:</div>
            <div className='Value'>{session._id}</div>
          </div>
          <div className='MissionName StaticDetail'>
            <div className='Label'>Mission:</div>
            <div className='Value'>{mission.name}</div>
          </div>
        </div>
        <SessionConfig
          sessionConfig={config}
          mission={mission}
          saveButtonText={'Save'}
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
}
