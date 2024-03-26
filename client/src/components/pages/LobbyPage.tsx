import { useRef, useState } from 'react'
import { useGlobalContext, useNavigationMiddleware } from 'src/context'
import GameClient from 'src/games'
import { compute } from 'src/toolbox'
import {
  useEventListener,
  useMountHandler,
  useRequireSession,
} from 'src/toolbox/hooks'
import ClientUser from 'src/users'
import { DefaultLayout } from '.'
import { HomeLink, TNavigation } from '../content/general-layout/Navigation'
import ButtonSvgPanel, {
  TValidPanelButton,
} from '../content/user-controls/ButtonSvgPanel'
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
  const [session] = useRequireSession()
  const { beginLoading, finishLoading, navigateTo, handleError, confirm } =
    globalContext.actions
  const [participants, setParticipants] = useState<ClientUser[]>(
    game.participants,
  )

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
    if (!session.user.isAuthorized(['WRITE'])) {
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
        notifyMethod: 'page',
      })
    }
  }

  /* -- effects -- */

  // Verify navigation on mount.
  useMountHandler((done) => {
    finishLoading()
    verifyNavigation.current()
    done()
  })

  // Verify navigation and update participant list on
  // game state change.
  useEventListener(server, 'game-state-change', () => {
    verifyNavigation.current()
    setParticipants(game.participants)
  })

  // Add navigation middleware to properly
  // quit the game before the user navigates
  // away.
  useNavigationMiddleware((to, next) => {
    confirm(
      'Are you sure you want to quit?',
      async (concludeAction: () => void) => {
        try {
          await game.$quit()
          concludeAction()
          next()
        } catch (error) {
          handleError({
            message: 'Failed to quit game.',
            notifyMethod: 'bubble',
          })
          concludeAction()
        }
      },
      {
        buttonConfirmText: 'Yes',
        buttonCancelText: 'No',
      },
    )
  })

  /* -- render -- */

  /**
   * Computed JSX for the list of participants.
   */
  const participantsJsx = participants.map(
    (participant): JSX.Element | null => {
      /* -- computed -- */

      /**
       * Buttons for SVG panel.
       */
      const buttons = compute((): TValidPanelButton[] => {
        if (session.user.isAuthorized(['WRITE'])) {
          return [
            {
              icon: 'kick',
              key: 'kick',
              onClick: () => {},
              tooltipDescription:
                'Kick participant from the game (Can still choose to rejoin).',
            },
            {
              icon: 'ban',
              key: 'ban',
              onClick: () => {},
              tooltipDescription:
                'Ban participant from the game (Cannot rejoin).',
            },
          ]
        } else {
          return []
        }
      })

      /* -- render -- */

      return (
        <div key={participant.userID} className='Participant'>
          <div className='Name'>{participant.userID}</div>
          <ButtonSvgPanel buttons={buttons} size={'small'} />
        </div>
      )
    },
  )

  return (
    <div className='LobbyPage Page'>
      <DefaultLayout navigation={navigation}>
        <div className='Title'>Lobby</div>
        <div className='DetailSection Section'>
          <div className='GameId StaticDetail'>
            <div className='Label'>Game ID:</div>
            <div className='Value'>{game.gameID}</div>
          </div>
          <div className='MissionName StaticDetail'>
            <div className='Label'>Mission:</div>
            <div className='Value'>{game.name}</div>
          </div>
        </div>
        <div className='ParticipantSection Section'>
          <div className='Subtitle'>Participants:</div>
          <div className='Participants'>{participantsJsx}</div>
        </div>
        <div className={buttonSectionClass}>
          <ButtonText text={'Start Game'} onClick={onClickStartGame} />
          <ButtonText text={'Game Settings'} onClick={() => {}} />
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
