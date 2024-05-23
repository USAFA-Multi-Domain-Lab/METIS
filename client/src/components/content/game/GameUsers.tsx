import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import GameClient from 'src/games'
import { compute } from 'src/toolbox'
import { useEventListener, useRequireLogin } from 'src/toolbox/hooks'
import ClientUser from 'src/users'
import Prompt from '../communication/Prompt'
import ButtonSvgPanel, {
  TValidPanelButton,
} from '../user-controls/ButtonSvgPanel'
import './GameUsers.scss'

/**
 * A component displaying the users in the game.
 */
export default function GameUsers({ game }: TGameUsers_P): JSX.Element | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const { handleError, prompt, beginLoading, finishLoading } =
    globalContext.actions
  const [login] = useRequireLogin()
  const [server] = globalContext.server
  const [participants, setParticipants] = useState<ClientUser[]>(
    game.participants,
  )
  const [supervisors, setSupervisors] = useState<ClientUser[]>(game.supervisors)

  /* -- FUNCTIONS -- */

  /**
   * Callback for button click to kick a participant.
   * @param userId The user ID of the participant to kick.
   */
  const onClickKick = async (userId: string): Promise<void> => {
    // Confirm the user wants to start the game.
    let { choice } = await prompt(
      `Are you sure you want to kick "${userId}"?`,
      Prompt.ConfirmationChoices,
    )

    // If the user cancels, return.
    if (choice === 'Cancel') {
      return
    }

    try {
      // Begin loading.
      beginLoading(`Kicking "${userId}"...`)
      // Kick the participant.
      await game.$kick(userId)
    } catch (error) {
      handleError({
        message: `Failed to kick "${userId}".`,
        notifyMethod: 'bubble',
      })
    }

    // Finish loading.
    finishLoading()
  }

  /**
   * Callback for button click to ban a participant.
   * @param userId The user ID of the participant to ban.
   */
  const onClickBan = async (userId: string): Promise<void> => {
    // Confirm the user wants to start the game.
    let { choice } = await prompt(
      `Are you sure you want to ban "${userId}"?`,
      Prompt.ConfirmationChoices,
    )

    // If the user cancels, return.
    if (choice === 'Cancel') {
      return
    }

    try {
      // Begin loading.
      beginLoading(`Banning "${userId}"...`)
      // Ban the participant.
      await game.$ban(userId)
    } catch (error) {
      handleError({
        message: `Failed to ban "${userId}".`,
        notifyMethod: 'bubble',
      })
    }

    // Finish loading.
    finishLoading()
  }

  /* -- HOOKS -- */

  // Update participant and supervisors lists on game
  // state change.
  useEventListener(server, 'game-state-change', () => {
    setParticipants(game.participants)
    setSupervisors(game.supervisors)
  })

  /* -- RENDER -- */

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
          // If the logged in user is authorized to join
          // games as a manager or observer, and the user
          // in question is not authorized to join games
          // as a manager or observer, then  return the
          // kick and ban buttons.
          if (
            (login.user.isAuthorized('games_join_manager') ||
              login.user.isAuthorized('games_join_observer')) &&
            (!user.isAuthorized('games_join_manager') ||
              !user.isAuthorized('games_join_observer'))
          ) {
            return [
              {
                icon: 'kick',
                key: 'kick',
                onClick: () => onClickKick(user.username),
                tooltipDescription:
                  'Kick participant from the game (Can still choose to rejoin).',
              },
              {
                icon: 'ban',
                key: 'ban',
                onClick: () => onClickBan(user.username),
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
          <div key={user.username} className='User'>
            <div className='Name'>{user.username}</div>
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
        <div key={user.username} className='User'>
          <div className='Name'>{user.username}</div>
        </div>
      ))
    }
    // Else, render a notice that there are no supervisors.
    else {
      return <div className='User NoUsers'>No supervisors joined.</div>
    }
  })

  return (
    <div className='GameUsers'>
      <div className='Participants'>
        <div className='Subtitle'>Participants:</div>
        <div className='Users'>{participantsJsx}</div>
      </div>
      <div className='Supervisors'>
        <div className='Subtitle'>Supervisors:</div>
        <div className='Users'>{supervisorJsx}</div>
      </div>
    </div>
  )
}

/**
 * The props for `GameUsers` component.
 */
export type TGameUsers_P = {
  /**
   * The game client with the users to display.
   */
  game: GameClient
}
