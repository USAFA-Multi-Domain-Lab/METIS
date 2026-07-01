import type { ClientChatMessage } from '@client/sessions/chat/ClientChatMessage'
import type { SessionClient } from '@client/sessions/SessionClient'
import { compute } from '@client/toolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import RichText from '../../general-layout/rich-text/RichText'
import './MessengerMessage.scss'

/**
 * Renders a single chat message in the messenger panel.
 */
export default function MessengerMessage({
  message,
  session,
}: TMessengerMessage_P): TReactElement {
  /* -- COMPUTED -- */

  /**
   * Whether the message was sent by the current member.
   */
  const isMine = compute<boolean>(
    () => message.senderUsername === session.member.username,
  )

  /**
   * The class name for the root element.
   */
  const rootClassName = compute<string>(
    () => new ClassList('MessengerMessage').set('Mine', isMine).value,
  )

  /**
   * The color of the sender's force, or `null` if the sender has no force.
   */
  const forceColor = compute<string | null>(() => {
    if (!message.senderForceId) return null
    let force = session.subscribedMission.getForceById(message.senderForceId)
    return force?.color ?? null
  })

  /* -- RENDER -- */

  return (
    <div className={rootClassName}>
      <div className='Header'>
        {forceColor && (
          <span className='ForceDot' style={{ backgroundColor: forceColor }} />
        )}
        <span className='Username'>
          {isMine ? 'You' : message.senderUsername}
        </span>
        <span className='Timestamp'>[{message.timestampFormatted}]</span>
      </div>
      <div className='Body'>
        <RichText
          options={{
            content: message.message,
            editable: false,
          }}
        />
      </div>
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link MessengerMessage}.
 */
type TMessengerMessage_P = {
  /**
   * The chat message to display.
   */
  message: ClientChatMessage
  /**
   * The active session, used to resolve force colors.
   */
  session: SessionClient
}
