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
import Prompt from '../content/communication/Prompt'
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
  const { beginLoading, finishLoading, navigateTo, handleError, prompt } =
    globalContext.actions
  const [participants, setParticipants] = useState<ClientUser[]>(
    game.participants,
  )
  const [supervisors, setSupervisors] = useState<ClientUser[]>(game.supervisors)

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

  /* -- effects -- */

  // Verify navigation on mount.
  useMountHandler((done) => {
    finishLoading()
    verifyNavigation.current()
    done()
  })

  // Verify navigation and update participant and
  // supervisors lists on game state change.
  useEventListener(server, 'game-state-change', () => {
    verifyNavigation.current()
    setParticipants(game.participants)
    setSupervisors(game.supervisors)
  })

  // Add navigation middleware to properly
  // quit the game before the user navigates
  // away.
  useNavigationMiddleware(async (to, next) => {
    // Prompt the user for confirmation.
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

  /**
   * Computed JSX for the list of participants.
   */
  const participantsJsx = compute(() => {
    // If there are participants, render them.
    if (participants.length > 0) {
      return participants.map((user): JSX.Element | null => {
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
          <div key={user.userID} className='User'>
            <div className='Name'>{user.userID}</div>
            <ButtonSvgPanel buttons={buttons} size={'small'} />
          </div>
        )
      })
    }
    // Else, render a notice that there are no participants.
    else {
      return <div className='User NoUsers'>No participants joined.</div>
    }
  })

  /**
   * Computed JSX for the list of supervisors.
   */
  const supervisorJsx = compute(() => {
    // If there are supervisors, render them.
    if (supervisors.length > 0) {
      return supervisors.map((user): JSX.Element | null => (
        <div key={user.userID} className='User'>
          <div className='Name'>{user.userID}</div>
        </div>
      ))
    }
    // Else, render a notice that there are no supervisors.
    else {
      return <div className='User NoUsers'>No supervisors joined.</div>
    }
  })

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
          <div className='Users'>{participantsJsx}</div>
        </div>
        <div className='SupervisorSection Section'>
          <div className='Subtitle'>Supervisors:</div>
          <div className='Users'>{supervisorJsx}</div>
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
