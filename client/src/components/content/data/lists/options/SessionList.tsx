import Prompt from 'src/components/content/communication/Prompt'
import { TButtonSvgType } from 'src/components/content/user-controls/buttons/ButtonSvg'
import { TSvgPanelOnClick } from 'src/components/content/user-controls/buttons/ButtonSvgPanel_v2'
import { useGlobalContext } from 'src/context'
import SessionClient from 'src/sessions'
import { SessionBasic } from 'src/sessions/basic'
import { compute } from 'src/toolbox'
import { useRequireLogin } from 'src/toolbox/hooks'
import List, { TGetListButtonTooltip } from '../List'
import {
  TGetItemButtonTooltip,
  TListItem,
  TOnItemButtonClick,
  TOnItemSelection,
} from '../pages/ListItem'

/**
 * A component for displaying a list of sessions.
 * @note Uses the `List` component.
 */
export default function SessionList({
  sessions,
  refresh,
}: TSessionList_P): JSX.Element | null {
  const globalContext = useGlobalContext()
  const [server] = globalContext.server
  const [login] = useRequireLogin()
  const {
    notify,
    handleError,
    beginLoading,
    finishLoading,
    navigateTo,
    prompt,
  } = globalContext.actions

  /* -- COMPUTED -- */

  // todo: Implement the ability for instructors to only tear down sessions that they own.
  const itemButtons = compute<TButtonSvgType[]>(() => {
    let results: TButtonSvgType[] = []

    // Add the join button.
    results.push('open')

    // If the user has the proper authorization, add
    // the remove button.
    if (login.user.isAuthorized('sessions_write_native')) results.push('remove')

    return results
  })

  /* -- FUNCTIONS -- */

  /**
   * Gets the tooltip description for a session list button.
   */
  const getSessionListButtonTooltip: TGetListButtonTooltip = (button) => {
    switch (button) {
      case 'text-cursor':
        return 'Enter a session ID to manually join a session.'
      default:
        return ''
    }
  }

  /**
   * Gets the tooltip description for a session item button.
   */
  const getSessionItemButtonTooltip: TGetItemButtonTooltip<SessionBasic> = (
    button,
    item,
  ) => {
    switch (button) {
      case 'open':
        return 'Join'
      case 'remove':
        return 'Tear down'
      default:
        return ''
    }
  }

  /**
   * Handler for when a session is selected.
   */
  const onSessionSelection: TOnItemSelection<TListItem> = async ({
    _id: sessionId,
  }: {
    _id: string
  }) => {
    if (server !== null) {
      try {
        // Notify user of session join.
        beginLoading('Joining session...')
        // Join session from new session ID, awaiting
        // the promised session client.
        let session = await server.$joinSession(sessionId)

        // If the session is not found, notify
        // the user and return.
        if (session === null) {
          handleError({
            message: 'Session could not be found.',
            notifyMethod: 'bubble',
          })
          finishLoading()
          return
        }

        // Update login information to include
        // the new session ID.
        login.sessionId = session._id
        // If the session has started, go to the
        // session page with the new session client.
        if (session.state === 'started') {
          navigateTo('SessionPage', { session })
        }
        // Or, if the session has not started, go to
        // the lobby page with the new session client.
        else if (session.state === 'unstarted') {
          navigateTo('LobbyPage', { session })
        }
      } catch (error: any) {
        handleError({
          message: error.message,
          notifyMethod: 'bubble',
        })
      }

      finishLoading()
    } else {
      handleError({
        message: 'No server connection. Contact system administrator',
        notifyMethod: 'bubble',
      })
    }
  }

  /**
   * Handler for when a session is requested to
   * be torn down.
   */
  const onSessionTearDown = async (session: SessionBasic) => {
    // todo: Remove this when the ability for instructors to only tear down sessions that they own is implemented.
    if (
      !login.user.isAuthorized('sessions_write') &&
      session.ownerId !== login.user._id
    ) {
      notify(
        'You do not have permission to tear down this session because you are not the owner.',
      )
      return
    }

    // Confirm tear down.
    let { choice } = await prompt(
      'Please confirm the tear down of this session.',
      Prompt.ConfirmationChoices,
    )

    // If confirmed, delete session.
    if (choice === 'Confirm') {
      try {
        beginLoading('Tearing down session...')
        await SessionClient.$delete(session._id)
        finishLoading()
        notify(`Successfully tore down "${session.name}".`)
        refresh()
      } catch (error) {
        finishLoading()
        notify(`Failed to tear down "${session.name}".`)
      }
    }
  }

  /**
   * Callback for when a list-specific button in the
   * session list is clicked.
   */
  const onSessionListButtonClick: TSvgPanelOnClick = async (button) => {
    switch (button) {
      case 'text-cursor':
        // Prompt user for session ID.
        const { choice, text } = await prompt(
          'Please enter the session ID to join:',
          Prompt.SubmissionChoices,
          {
            textField: {
              boundChoices: ['Submit'],
              label: 'Session ID',
              minLength: 8,
              maxLength: 8,
            },
          },
        )

        // Handle session selection if the user submits.
        if (choice === 'Submit') {
          onSessionSelection({ _id: text, name: 'manual-join' })
        }
        break
      default:
        break
    }
  }

  /**
   * Callback for when a item-specific button in the
   * session list is clicked.
   */
  const onSessionItemButtonClick: TOnItemButtonClick<SessionBasic> = (
    button,
    item,
  ) => {
    switch (button) {
      case 'open':
        onSessionSelection(item)
        break
      case 'remove':
        onSessionTearDown(item)
        break
      default:
        console.warn('Unknown button clicked in session list.')
        break
    }
  }

  // Render the list of sessions.
  return (
    <List<SessionBasic>
      name={'Sessions'}
      items={sessions}
      listButtons={['text-cursor']}
      itemButtons={itemButtons}
      getItemTooltip={() => 'Join session'}
      getListButtonTooltip={getSessionListButtonTooltip}
      getItemButtonTooltip={getSessionItemButtonTooltip}
      onSelection={onSessionSelection}
      onListButtonClick={onSessionListButtonClick}
      onItemButtonClick={onSessionItemButtonClick}
    />
  )
}

/**
 * Props for `SessionList`.
 */
export type TSessionList_P = {
  /**
   * The sessions to display.
   */
  sessions: SessionBasic[]
  /**
   * Refreshes the session list.
   */
  refresh: () => void
}
