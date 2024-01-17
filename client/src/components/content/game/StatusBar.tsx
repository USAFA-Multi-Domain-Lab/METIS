import './StatusBar.scss'

import { TServerConnectionStatus } from '../../../../../shared/connect/data'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useGlobalContext } from 'src/context'
import { useEventListener, useUnmountHandler } from 'src/toolbox/hooks'
import { TUnfulfilledReqData } from 'src/connect/servers'

/**
 * A status bar that displays the status of a server connection
 * and any pending tasks.
 */
export default function StatusBar({}: TStatusBar_P): JSX.Element | null {
  /* -- variables -- */

  let statusMessage: string = ''
  let overflowConnectionMessage: string = ''
  let overflowStatusMessages: Array<{ key: string; text: string }> = []
  let statusBarClasses: string[] = ['StatusBar']
  let overflowCountClasses: string[] = ['OverflowCount', 'Hidden']
  let overflowClasses: string[] = ['Overflow']
  let pendingTasksClasses: string[] = ['PendingTasks', 'Hidden']

  /* -- global-context -- */

  const globalContext = useGlobalContext()
  const [server] = globalContext.server

  /* -- state -- */

  const [status, setStatus] = useState<TServerConnectionStatus>(
    server?.status ?? 'closed',
  )
  const [unfulfilledRequests, setUnfulfilledRequests] = useState<
    TUnfulfilledReqData[]
  >(server?.unfulfilledRequests ?? [])

  // Register an event listener to update the status
  // and unfulfilled requests when the server connection
  // emits an activity event.
  useEventListener(server, 'activity', () => {
    if (server) {
      setStatus(server.status)
      setUnfulfilledRequests(server.unfulfilledRequests)
    }
  })

  /* -- pre-processing -- */

  // If a server connection is present...
  if (server) {
    switch (status) {
      // Add class name and set status message based on the
      // server connection status.
      case 'open':
        statusMessage = 'Connected.'
        statusBarClasses.push('Open')
        overflowConnectionMessage =
          'The client is properly connected to the server.'
        break
      case 'closed':
        statusMessage = 'Not Connected.'
        statusBarClasses.push('Closed')
        overflowConnectionMessage =
          'The client is not connected to the server. Data between the server and the client cannot be exchanged.'
        break
      case 'connecting':
        statusMessage = 'Connection dropped. Attempting to reconnect.'
        statusBarClasses.push('Connecting')
        overflowConnectionMessage =
          'The connection from the client to the server has dropped. The client is attempting to reconnect to the server now.'
        break
    }

    // If the server connection has unfulfilled requests, add the
    // 'Pending' class to the status element.)
    if (status === 'open' && unfulfilledRequests.length > 0) {
      statusBarClasses.push('Pending')

      // Get the last request and overwrite the status message with it.
      statusMessage =
        unfulfilledRequests[unfulfilledRequests.length - 1].statusMessage

      // Construct the overflow status messages.
      overflowStatusMessages = unfulfilledRequests.map((request) => ({
        key: request.id,
        text: request.statusMessage,
      }))

      // If there are overflow messages, filter
      // out the hidden class name from the pending tasks
      // element.
      if (overflowStatusMessages.length > 0) {
        pendingTasksClasses = pendingTasksClasses.filter(
          (cls) => cls !== 'Hidden',
        )
      }
      // If there is more than one overflow message, filter
      // out the hidden class name from the overflow count
      // element.
      if (overflowStatusMessages.length > 1) {
        overflowCountClasses = overflowCountClasses.filter(
          (cls) => cls !== 'Hidden',
        )
      }
    }
  }
  // If no server connection, add the 'Closed' class to the status element.
  else {
    statusBarClasses.push('Closed')
    statusMessage = 'Connection dropped. Attempting to reconnect.'
  }

  /* -- render -- */

  // Render root element.
  return (
    <div className={statusBarClasses.join(' ')}>
      <div className='Message'>
        {statusMessage}{' '}
        <span className={overflowCountClasses.join(' ')}>
          +{overflowStatusMessages.length - 1}
        </span>
      </div>
      <div className='Indicator'></div>
      <div className={overflowClasses.join(' ')}>
        <div className='Connection'>
          <div className='Heading'>Connection Status:</div>
          <div className='Status'>{status}</div>
          <div className='Message'>{overflowConnectionMessage}</div>
        </div>
        <div className={pendingTasksClasses.join(' ')}>
          <div className='Heading'>Pending Tasks:</div>
          <ul className='Messages'>
            {overflowStatusMessages.map((statusMessage) => (
              <li key={statusMessage.key} className='Message'>
                {statusMessage.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/**
 * Prop type for `StatusBar` component.
 */
export type TStatusBar_P = {}
