import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientSession from 'src/sessions'
import { compute } from 'src/toolbox'
import { useEventListener, useRequireLogin } from 'src/toolbox/hooks'
import ClientUser from 'src/users'
import Prompt from '../communication/Prompt'
import ButtonSvgPanel, {
  TValidPanelButton,
} from '../user-controls/ButtonSvgPanel'
import './SessionUsers.scss'

/**
 * A component displaying the users in the session.
 */
export default function SessionUsers({
  session,
}: TSessionUsers_P): JSX.Element | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const { handleError, prompt, beginLoading, finishLoading } =
    globalContext.actions
  const [login] = useRequireLogin()
  const [server] = globalContext.server
  const [participants, setParticipants] = useState<ClientUser[]>(
    session.participants,
  )
  const [observers, setObservers] = useState<ClientUser[]>(session.observers)

  /* -- FUNCTIONS -- */

  /**
   * Callback for button click to kick a participant.
   * @param userId The user ID of the participant to kick.
   */
  const onClickKick = async (userId: string): Promise<void> => {
    // Confirm the user wants to start the session.
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
      await session.$kick(userId)
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
    // Confirm the user wants to start the session.
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
      await session.$ban(userId)
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

  // Update participant and observer lists on session
  // state change.
  useEventListener(server, 'session-users-updated', () => {
    setParticipants(session.participants)
    setObservers(session.observers)
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
          // sessions as a manager or observer, and the user
          // in question is not authorized to join sessions
          // as a manager or observer, then  return the
          // kick and ban buttons.
          if (
            (login.user.isAuthorized('sessions_join_manager') ||
              login.user.isAuthorized('sessions_join_observer')) &&
            (!user.isAuthorized('sessions_join_manager') ||
              !user.isAuthorized('sessions_join_observer'))
          ) {
            return [
              {
                icon: 'kick',
                key: 'kick',
                onClick: () => onClickKick(user.username),
                tooltipDescription:
                  'Kick participant from the session (Can still choose to rejoin).',
              },
              {
                icon: 'ban',
                key: 'ban',
                onClick: () => onClickBan(user.username),
                tooltipDescription:
                  'Ban participant from the session (Cannot rejoin).',
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
   * Computed JSX for the list of observers.
   */
  const observerJsx = compute(() => {
    // If there are observers, render them.
    if (observers.length > 0) {
      return observers.map((user): JSX.Element | null => (
        <div key={user.username} className='User'>
          <div className='Name'>{user.username}</div>
        </div>
      ))
    }
    // Else, render a notice that there are no observers.
    else {
      return <div className='User NoUsers'>No observers joined.</div>
    }
  })

  return (
    <div className='SessionUsers'>
      <div className='Participants'>
        <div className='Subtitle'>Participants:</div>
        <div className='Users'>{participantsJsx}</div>
      </div>
      <div className='Observers'>
        <div className='Subtitle'>Observers:</div>
        <div className='Users'>{observerJsx}</div>
      </div>
    </div>
  )
}

/**
 * The props for `SessionUsers` component.
 */
export type TSessionUsers_P = {
  /**
   * The session client with the users to display.
   */
  session: ClientSession
}
