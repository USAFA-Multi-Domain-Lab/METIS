import {
  useGlobalContext,
  useNavigationMiddleware,
} from 'metis/client/context/global'
import SessionClient from 'metis/client/sessions'
import { compute } from 'metis/client/toolbox'
import { useMountHandler } from 'metis/client/toolbox/hooks'
import { useSessionRedirects } from 'metis/client/toolbox/hooks/sessions'
import { useState } from 'react'
import { DefaultPageLayout } from '.'
import Prompt from '../content/communication/Prompt'
import { TNavigation_P } from '../content/general-layout/Navigation'
import SessionConfig from '../content/session/SessionConfig'
import { useButtonSvgEngine } from '../content/user-controls/buttons/panels/hooks'
import './SessionConfigPage.scss'

export default function SessionConfigPage({
  session,
  session: { mission },
}: TSessionConfigPage_P): TReactElement | null {
  /* -- state -- */

  const globalContext = useGlobalContext()
  const { navigateTo, beginLoading, finishLoading, prompt, handleError } =
    globalContext.actions
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
  const { verifyNavigation } = useSessionRedirects(session)

  /* -- FUNCTIONS -- */

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
