import { useRef } from 'react'
import { useGlobalContext, useNavigationMiddleware } from 'src/context'
import GameClient from 'src/games'
import { compute } from 'src/toolbox'
import {
  useEventListener,
  useMountHandler,
  useRequireLogin,
} from 'src/toolbox/hooks'
import { DefaultLayout } from '.'
import Prompt from '../content/communication/Prompt'
import GameUsers from '../content/game/GameUsers'
import { HomeLink, TNavigation } from '../content/general-layout/Navigation'
import { ButtonText } from '../content/user-controls/ButtonText'
import './LobbyPage.scss'

/**
 * Page responsible for viewing/managing participants before
 * game start.
 */
export default function LobbyPage({ game }: TLobbyPage_P): JSX.Element | null {
  /* -- state -- */

  const globalContext = useGlobalContext()
  const [server] = globalContext.server
  const [login] = useRequireLogin()
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
   * Class name for the button section.
   */
  const buttonSectionClass = compute(() => {
    let classNames: string[] = ['ButtonSection', 'Section']

    // Hide the button section if the user is
    // not authorized.
    if (
      !login.user.isAuthorized('games_join_manager') ||
      !login.user.isAuthorized('games_join_observer')
    ) {
      classNames.push('Hidden')
    }

    return classNames.join(' ')
  })

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
   * Callback for the start game button.
   */
  const onClickStartGame = async () => {
    // If the game is not unstarted, verify navigation.
    if (game.state !== 'unstarted') {
      verifyNavigation.current()
      return
    }

    // Confirm the user wants to start the game.
    let { choice } = await prompt(
      'Please confirm starting the game.',
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
      beginLoading('Starting game...')
      // Start the game.
      await game.$start()
      // Redirect to game page.
      navigateTo('GamePage', { game }, { bypassMiddleware: true })
    } catch (error) {
      handleError({
        message: 'Failed to start game.',
        notifyMethod: 'bubble',
      })
    }
  }

  /**
   * Callback for the game configuration button.
   */
  const onClickGameConfig = () => {
    navigateTo('GameConfigPage', { game })
  }

  /* -- effects -- */

  // Verify navigation on mount.
  useMountHandler((done) => {
    finishLoading()
    verifyNavigation.current()
    done()
  })

  // Verify navigation and update participant and
  // supervisors lists on game state change.
  useEventListener(server, 'game-state-change', () =>
    verifyNavigation.current(),
  )

  // Add navigation middleware to properly
  // quit the game before the user navigates
  // away.
  useNavigationMiddleware(async (to, next) => {
    // If the user is navigating to the game configuration
    // page, permit navigation.
    if (to === 'GameConfigPage') {
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

  /* -- render -- */

  return (
    <div className='LobbyPage Page'>
      <DefaultLayout navigation={navigation}>
        <div className='Title'>Lobby</div>
        <div className='DetailSection Section'>
          <div className='GameId StaticDetail'>
            <div className='Label'>Game ID:</div>
            <div className='Value'>{game._id}</div>
          </div>
          <div className='MissionName StaticDetail'>
            <div className='Label'>Mission:</div>
            <div className='Value'>{game.name}</div>
          </div>
        </div>
        <div className='UsersSection Section'>
          <GameUsers game={game} />
        </div>
        <div className={buttonSectionClass}>
          <ButtonText text={'Start Game'} onClick={onClickStartGame} />
          <ButtonText text={'Game Configuration'} onClick={onClickGameConfig} />
        </div>
      </DefaultLayout>
    </div>
  )
}

/**
 * Props for `LobbyPage` component.
 */
export type TLobbyPage_P = {
  /**
   * The game client to use on the page.
   */
  game: GameClient
}
