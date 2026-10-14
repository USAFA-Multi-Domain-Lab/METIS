import Prompt from '@client/components/content/communication/Prompt'
import { color } from '@client/components/content/general-layout/rich-text/formatting'
import { useGlobalContext } from '@client/context/global'
import { SessionClient } from '@client/sessions/SessionClient'
import { compute } from '@client/toolbox'
import { usePeriodicRerender, useRequireLogin } from '@client/toolbox/hooks'
import { RED } from '@shared/colors'
import type { MetisComponent } from '@shared/MetisComponent'
import { SessionBasic } from '@shared/sessions/SessionBasic'
import { DateToolbox } from '@shared/toolbox/dates/DateToolbox'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { AxiosError } from 'axios'
import type { TGetListButtonLabel, TOnListButtonClick } from '../List'
import List from '../List'
import type {
  TGetItemButtonDescription,
  TGetItemButtonDisabled,
  TGetItemButtonHidden,
  TGetItemButtonLabel,
  TOnItemButtonClick,
  TOnItemSelection,
} from '../pages/items/ListItem'

/**
 * A component for displaying a list of sessions.
 * @note Uses the `List` component.
 */
export default function SessionList({
  sessions,
  refresh,
}: TSessionList_P): TReactElement | null {
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

  /**
   * The item buttons to display in the session list.
   */
  const sessionItemButtons = compute<TMetisIcon[]>(() => {
    let buttons: TMetisIcon[] = []

    if (login.user.isAuthorized('sessions_read')) {
      buttons.push('open')
    }

    // If the user has no write permissions whatsoever
    // for a session, there is no need to show them.
    if (
      login.user.isAuthorized('sessions_write_native') ||
      login.user.isAuthorized('sessions_write_foreign')
    ) {
      buttons.push('stop', 'force-stop')
    }

    return buttons
  })

  /* -- FUNCTIONS -- */

  /**
   * Gets the column label for a session list.
   * @param column The column for which to get the label.
   * @returns The label for the column.
   */
  const getSessionColumnLabel = (column: keyof SessionBasic): string => {
    switch (column) {
      case 'joinedMemberCount':
        return 'Online'
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
   * Gets the content for a session list cell.
   * @param session The session for which to get the content.
   * @param column The column for which to get the content.
   * @returns The content to display in the cell.
   */
  const getSessionCellContent = (
    session: SessionBasic,
    column: keyof SessionBasic,
  ): React.ReactNode => {
    switch (column) {
      case 'launchedAt':
        return DateToolbox.format(session.launchedAt, 'yyyy-mm-dd HH:MM')
      case 'state':
        let { state, setupFailed, teardownFailed } = session
        if (state === 'ending' && teardownFailed) return 'Failed to End'
        if (state === 'starting' && setupFailed) return 'Failed to Start'
        if (state === 'resetting' && (setupFailed || teardownFailed)) {
          return 'Failed to Reset'
        }
        return StringToolbox.toTitleCase(state)
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
      case 'joinedMemberCount':
        return '6em'
      case 'accessibility':
        return '9em'
      case 'state':
        return '8em'
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
  const getSessionListButtonTooltip: TGetListButtonLabel = (button) => {
    switch (button) {
      case 'key':
        return 'Join private'
      default:
        return ''
    }
  }

  /**
   * Gets the label for a session item button.
   */
  const getSessionItemButtonLabel: TGetItemButtonLabel<SessionBasic> = (
    button,
  ) => {
    switch (button) {
      case 'open':
        return 'Join'
      case 'stop':
        return 'End Session'
      case 'force-stop':
        return 'Force End'
      default:
        return ''
    }
  }

  /**
   * Gets whether a session item button is disabled.
   */
  const getSessionItemButtonDisabled: TGetItemButtonDisabled<SessionBasic> = (
    button,
    session,
  ) => {
    switch (button) {
      case 'stop':
        return (
          !login.user.canWriteToSession(session) ||
          (session.state !== 'unstarted' && session.state !== 'started')
        )
      case 'force-stop':
        return !login.user.canWriteToSession(session)
      default:
        return false
    }
  }

  /**
   * Gets whether a session item button is hidden.
   */
  const getSessionItemButtonHidden: TGetItemButtonHidden<SessionBasic> = (
    button,
    session,
  ) => {
    switch (button) {
      // Force End is only offered once a clean
      // end is no longer the next step.
      case 'force-stop':
        return session.state === 'unstarted' || session.state === 'started'
      default:
        return false
    }
  }

  /**
   * Gets the tooltip description for a session item button,
   * explaining why End Session cannot be used, if it can't.
   */
  const getSessionItemButtonDescription: TGetItemButtonDescription<
    SessionBasic
  > = (button, session) => {
    if (button !== 'stop') return ''

    switch (session.state) {
      case 'starting':
        if (session.setupFailed) return 'The session failed to set up.'
        else return 'The session is still setting up.'
      case 'ending':
        if (session.teardownFailed) return 'The session failed to tear down.'
        else return 'The session is already ending.'
      case 'resetting':
        if (session.teardownFailed) return 'The session failed to tear down.'
        else if (session.setupFailed) return 'The session failed to set up.'
        else return 'The session is resetting.'
      default:
        return ''
    }
  }

  /**
   * Handler for when a session is selected.
   */
  const onSessionSelection: TOnItemSelection<MetisComponent> = async ({
    _id: sessionId,
  }: MetisComponent) => {
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
          navigateTo('SessionPage', { session, returnPage: 'HomePage' })
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
   * be ended cleanly.
   */
  const onSessionEnd = async (session: SessionBasic) => {
    // Confirm end.
    let message =
      `Are you sure you want to end the "${session.name}" session?\n\n` +
      `Its members will be removed, and the session will be torn down.`

    let { choice } = await prompt(message, Prompt.ConfirmationChoices)

    // If confirmed, end session.
    if (choice === 'Confirm') {
      try {
        beginLoading('Ending session...')
        await SessionClient.$end(session._id)
        finishLoading()
        // An unstarted session has nothing to tear down,
        // so it has already ended by now.
        if (session.state === 'unstarted') {
          notify(`Successfully ended the "${session.name}" session.`)
        } else {
          notify(`The "${session.name}" session is ending.`)
        }
        refresh()
      } catch (error) {
        finishLoading()
        onEndFailure(session, error)
      }
    }
  }

  /**
   * Handler for when a session is requested to
   * be force ended.
   */
  const onSessionForceEnd = async (session: SessionBasic) => {
    // Confirm force end.
    let message =
      `Are you sure you want to force end the "${session.name}" session? ` +
      `This will end the session immediately, skipping any teardown that ` +
      `has not finished.\n\n` +
      `**${color('WARNING', RED)}** — this can have unintended consequences, such as ` +
      `leaving integrations in a broken state.`

    let { choice } = await prompt(message, Prompt.ConfirmationChoices, {
      dangerousChoices: ['Confirm'],
    })

    // If confirmed, delete session.
    if (choice === 'Confirm') {
      try {
        beginLoading('Ending session...')
        await SessionClient.$delete(session._id)
        finishLoading()
        notify(`Successfully ended the "${session.name}" session.`)
        refresh()
      } catch (error) {
        finishLoading()
        onEndFailure(session, error)
      }
    }
  }

  /**
   * Notifies the user that ending or force ending a session failed.
   * A session that could not be found was most likely already ended
   * elsewhere, such as while the confirmation prompt was open, so the
   * list is refreshed to drop it.
   * @param session The session that failed to end.
   * @param error The error thrown while ending it.
   */
  const onEndFailure = (session: SessionBasic, error: unknown) => {
    let notFound = error instanceof AxiosError && error.response?.status === 404

    if (notFound) {
      notify(
        `The "${session.name}" session could not be found. Most likely it has already ended.`,
      )
      refresh()
    } else {
      notify(`Failed to end the "${session.name}" session.`)
    }
  }

  /**
   * Callback for when a list-specific button in the
   * session list is clicked.
   */
  const onSessionListButtonClick: TOnListButtonClick = async (button) => {
    switch (button) {
      case 'key':
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
          onSessionSelection(SessionBasic.createManualJoin(text))
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
      case 'stop':
        onSessionEnd(item)
        break
      case 'force-stop':
        onSessionForceEnd(item)
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
        'joinedMemberCount',
        'state',
        'runtimeFormatted',
        'launchedAt',
      ]}
      listButtonIcons={['key']}
      itemButtonIcons={sessionItemButtons}
      initialSorting={{
        method: 'column-based',
        column: 'launchedAt',
        direction: 'descending',
      }}
      getItemButtonDisabled={getSessionItemButtonDisabled}
      getItemButtonHidden={getSessionItemButtonHidden}
      getItemButtonDescription={getSessionItemButtonDescription}
      getColumnLabel={getSessionColumnLabel}
      getCellContent={getSessionCellContent}
      getColumnWidth={getSessionColumnWidth}
      getItemTooltip={() => 'Join session'}
      getListButtonLabel={getSessionListButtonTooltip}
      getItemButtonLabel={getSessionItemButtonLabel}
      onItemDblClick={(session) => onSessionSelection(session)}
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
