import Prompt from 'src/components/content/communication/Prompt'
import { TButtonSvgType } from 'src/components/content/user-controls/buttons/ButtonSvg'
import { TSvgPanelOnClick } from 'src/components/content/user-controls/buttons/ButtonSvgPanel_v2'
import { useGlobalContext } from 'src/context'
import SessionClient from 'src/sessions'
import { SessionBasic } from 'src/sessions/basic'
import { compute } from 'src/toolbox'
import { usePeriodicRerender, useRequireLogin } from 'src/toolbox/hooks'
import { DateToolbox } from '../../../../../../../shared/toolbox/dates'
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
  const { login } = useRequireLogin()
  const {
    notify,
    handleError,
    beginLoading,
    finishLoading,
    navigateTo,
    prompt,
  } = globalContext.actions

  /* -- EFFECTS -- */

  // Force rerender the list every second
  // to keep the runtime column up-to-date.
  usePeriodicRerender(1000)

  /* -- COMPUTED -- */

  // todo: Implement the ability for instructors to only delete sessions that they own.
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
   * Gets the column label for a session list.
   * @param column The column for which to get the label.
   * @returns The label for the column.
   */
  const getSessionColumnLabel = (column: keyof SessionBasic): string => {
    switch (column) {
      case 'memberCount':
        return 'Members'
      case 'accessibility':
        return 'Accessibility'
      case 'state':
        return 'State'
      case 'ownerFullName':
        return 'Owner'
      case 'runtimeFormatted':
        return 'Runtime'
      case 'launchedAt':
        return 'Launched'
      default:
        return 'Unknown column'
    }
  }

  /**
   * Gets the text for a session list cell.
   * @param session The session for which to get the text.
   * @param column The column for which to get the text.
   * @returns The text to display in the cell.
   */
  const getSessionCellText = (
    session: SessionBasic,
    column: keyof SessionBasic,
  ): string => {
    switch (column) {
      case 'launchedAt':
        return DateToolbox.format(session.launchedAt, 'yyyy-mm-dd HH:MM')
      default:
        return session[column].toString()
    }
  }

  /**
   * Gets the width of the given column.
   * @param column The column for which to get the width.
   * @returns The width of the column.
   */
  const getSessionColumnWidth = (column: keyof SessionBasic): string => {
    switch (column) {
      case 'memberCount':
        return '6em'
      case 'accessibility':
        return '9em'
      case 'state':
        return '6em'
      case 'runtimeFormatted':
        return '7em'
      case 'launchedAt':
        return '9em'
      default:
        return '10em'
    }
  }

  /**
   * Gets the tooltip description for a session list button.
   */
  const getSessionListButtonTooltip: TGetListButtonTooltip = (button) => {
    switch (button) {
      case 'lock':
        return 'Join private'
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
        return 'Delete'
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
    // Confirm tear down.
    let { choice } = await prompt(
      `Are you sure you want to delete the "${session.name}" session?`,
      Prompt.ConfirmationChoices,
    )

    // If confirmed, delete session.
    if (choice === 'Confirm') {
      try {
        beginLoading('Deleting session...')
        await SessionClient.$delete(session._id)
        finishLoading()
        notify(`Successfully deleted the "${session.name}" session.`)
        refresh()
      } catch (error) {
        finishLoading()
        notify(`Failed to delete the "${session.name}" session.`)
      }
    }
  }

  /**
   * Callback for when a list-specific button in the
   * session list is clicked.
   */
  const onSessionListButtonClick: TSvgPanelOnClick = async (button) => {
    switch (button) {
      case 'lock':
        // Prompt user for session ID.
        const { choice, text } = await prompt(
          'Please enter the ID of the session you wish to join:',
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
      columns={[
        'ownerFullName',
        'accessibility',
        'memberCount',
        'state',
        'runtimeFormatted',
        'launchedAt',
      ]}
      listButtons={['lock']}
      itemButtons={itemButtons}
      initialSorting={{ column: 'launchedAt', method: 'descending' }}
      getColumnLabel={getSessionColumnLabel}
      getCellText={getSessionCellText}
      getColumnWidth={getSessionColumnWidth}
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
