import { useGlobalContext } from '@client/context/global'
import { useEffect, useMemo, useState } from 'react'
import './ConnectionStatus.scss'

/**
 * Displays messages about the connection status of the client to the server.
 * For instance, if the client is disconnected from the server, then this
 * component will display a message saying that the connection has dropped
 * and is trying to reconnect.
 */
export default function ConnectionStatus(props: {}): TReactElement | null {
  /* -- context -- */
  const globalContext = useGlobalContext()
  const [connectionStatusMessage] = globalContext.connectionStatusMessage

  /* -- state -- */
  // The last non-null message that was received.
  const [lastMessage, setLastMessage] =
    useState<TConnectionStatusMessage | null>(connectionStatusMessage)

  /* -- effects -- */

  useEffect(() => {
    // Update the last message, if not null.
    if (connectionStatusMessage !== null) {
      setLastMessage(connectionStatusMessage)
    }
  }, [connectionStatusMessage])

  /* -- computed -- */

  /**
   * The class name of the root element of the component.
   */
  const rootClassName = useMemo<string>(() => {
    const classList = ['ConnectionStatus']

    // If the message is not null, then add the
    // 'active' class name.
    if (connectionStatusMessage !== null) {
      classList.push('Active')
    } else {
      classList.push('Inactive')
    }

    // If the last messsage is not null, then
    // add the color class name.
    if (lastMessage !== null) {
      classList.push(lastMessage.color)
    }

    // Join and return class names.
    return classList.join(' ')
  }, [connectionStatusMessage, lastMessage])

  /* -- render -- */

  // If the last message is null, then don't render anything.
  if (lastMessage === null) return null

  // Render root JSX.
  return (
    <div className={rootClassName}>
      <div className='Message'>{lastMessage.message}</div>
    </div>
  )
}

/**
 * Props for the ConnectionStatus component.
 */
export type TConnectionStatus = {}

/**
 * The message data to use for connection status components.
 */
export type TConnectionStatusMessage = {
  /**
   * The message to display.
   */
  message: string
  /**
   * The color of the message.
   */
  color: TConnectionStatusColor
}

/**
 * The color of the connection status background.
 */
export type TConnectionStatusColor = 'Red' | 'Green'
