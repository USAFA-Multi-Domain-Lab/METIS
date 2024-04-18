import { useRef, useState } from 'react'
import { useGlobalContext, useNavigationMiddleware } from 'src/context'
import GameClient from 'src/games'
import { compute } from 'src/toolbox'
import { useMountHandler } from 'src/toolbox/hooks'
import { DefaultLayout } from '.'
import Prompt from '../content/communication/Prompt'
import GameConfig from '../content/game/GameConfig'
import { HomeLink, TNavigation } from '../content/general-layout/Navigation'
import './GameConfigPage.scss'

export default function GameConfigPage({
  game,
}: TGameConfigPage_P): JSX.Element | null {
  /* -- state -- */

  const globalContext = useGlobalContext()
  const { navigateTo, beginLoading, finishLoading, prompt, handleError } =
    globalContext.actions
  const [config] = useState(game.config)

  /* -- functions -- */

  /**
   * Redirects to the correct page based on
   * the game state. Stays on the same page
   * if the game has not yet started.
   */
  const verifyNavigation = useRef(() => {
    // If the game is started, navigate to the game page.
    if (game.state === 'started') {
      navigateTo('GamePage', { game }, { bypassMiddleware: true })
    }
    // If the game is ended, navigate to the home page.
    if (game.state === 'ended') {
      navigateTo('HomePage', {}, { bypassMiddleware: true })
    }
  })

  /**
   * Saves the game configuration.
   */
  const save = async (): Promise<void> => {
    try {
      // Begin loading.
      beginLoading('Saving game configuration...')
      // Save the game configuration.
      await game.$updateConfig(config)
      // Redirect to the lobby page.
      navigateTo('LobbyPage', { game })
    } catch (error) {
      handleError({
        message: 'Failed to save game configuration.',
        notifyMethod: 'bubble',
      })
    }
  }

  /**
   * Cancels the configuration.
   */
  const cancel = (): void => {
    // Navigate to the lobby page.
    navigateTo('LobbyPage', { game })
  }

  /* -- effects -- */

  // Verify navigation on mount.
  useMountHandler((done) => {
    finishLoading()
    verifyNavigation.current()
    done()
  })

  // Add navigation middleware to properly
  // quit the game before the user navigates
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
        await game.$quit()
        next()
      } catch (error) {
        handleError({
          message: 'Failed to quit game.',
          notifyMethod: 'bubble',
        })
      }
    }
  })

  /* -- computed -- */

  /**
   * Props for navigation.
   */
  const navigation = compute(
    (): TNavigation => ({
      links: [HomeLink(globalContext, { text: 'Quit' })],
      boxShadow: 'alt-7',
    }),
  )

  return (
    <div className='GameConfigPage Page'>
      <DefaultLayout navigation={navigation}>
        <div className='Title'>Game Configuration</div>
        <div className='DetailSection Section'>
          <div className='GameId StaticDetail'>
            <div className='Label'>Game ID:</div>
            <div className='Value'>{game.gameId}</div>
          </div>
          <div className='MissionName StaticDetail'>
            <div className='Label'>Mission:</div>
            <div className='Value'>{game.name}</div>
          </div>
        </div>
        <GameConfig
          gameConfig={config}
          saveButtonText={'Save'}
          onSave={save}
          onCancel={cancel}
        />
      </DefaultLayout>
    </div>
  )
}

/**
 * Props for `GameConfigPage` component.
 */
export type TGameConfigPage_P = {
  /**
   * The game to configure.
   */
  game: GameClient
}
