import { signal } from '@preact/signals-react'
import { useEffect, useMemo, useState } from 'react'
import './ConnectionStatus.scss'

/**
 * A signal for controlling the message of all
 * {@link ConnectionStatus} components.
 */
export const message = signal<TConnectionStatusMessage | null>(null)

/**
 * Displays messages about the connection status of the client to the server.
 * For instance, if the client is disconnected from the server, then this
 * component will display a message saying that the connection has dropped
 * and is trying to reconnect.
 */
export default function ConnectionStatus(props: {}): JSX.Element | null {
  /* -- state -- */
  // The last non-null message that was received.
  const [lastMessage, setLastMessage] =
    useState<TConnectionStatusMessage | null>(message.value)

  /* -- effects -- */

  useEffect(() => {
    // Update the last message, if not null.
    if (message.value !== null) {
      setLastMessage(message.value)
    }
  }, [message.value])

  /* -- computed -- */

  /**
   * The class name of the root element of the component.
   */
  const rootClassName = useMemo<string>(() => {
    const classList = ['ConnectionStatus']

    // If the message is not null, then add the
    // 'active' class name.
    if (message.value !== null) {
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
  }, [message.value, lastMessage])

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
