import { useGlobalContext } from '@client/context/global'
import type { ClientChatChannel } from '@client/sessions/chat/ClientChatChannel'
import type { ClientChatMessage } from '@client/sessions/chat/ClientChatMessage'
import { compute } from '@client/toolbox'
import { useEventListener, usePostRenderEffect } from '@client/toolbox/hooks'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useEffect, useRef, useState } from 'react'
import MessengerMessage from './MessengerMessage'
import './MessengerMessages.scss'
import { useMessengerContext } from './MessengerPanel'

/* -- CONSTANTS -- */

const AUTO_SCROLL_LOCK_DISTANCE = 100

/* -- COMPONENT -- */

/**
 * Renders the scrollable message list and auto-scroll controls for
 * a single chat channel. One instance is mounted per channel inside
 * its own {@link PanelView}, giving each channel independent scroll state.
 */
export default function MessengerMessages({
  channel,
}: TMessengerMessages_P): TReactElement {
  const { session, state } = useMessengerContext()
  const [server] = useGlobalContext().server

  /* -- STATE -- */

  const [messages, setMessages] = useState<ClientChatMessage[]>(() => [
    ...channel.messages,
  ])
  const [autoScrollLock, lockAutoScroll] = useState<boolean>(false)
  const [areUnseenMessages, setAreUnseenMessages] = useState<boolean>(false)
  const [activeChannelId, setActiveChannelId] = state.activeChannelId

  /* -- REFS -- */

  const messagesElm = useRef<HTMLDivElement>(null)
  const smoothScrollInProgress = useRef<boolean>(false)
  const smoothScrollTimeout = useRef<
    NodeJS.Timeout | string | number | undefined
  >(undefined)

  /* -- EFFECTS -- */

  // Refresh this channel's messages whenever a new message arrives.
  useEventListener(server, 'chat-message-received', () => {
    setMessages([...channel.messages])
  })

  // Auto-scroll to the bottom when new messages arrive, unless the user
  // has scrolled up to read older messages.
  usePostRenderEffect(() => {
    if (messagesElm.current && !autoScrollLock) {
      messagesElm.current.scroll({
        top: messagesElm.current.scrollHeight,
        behavior: 'smooth',
      })
      smoothScrollInProgress.current = true
    }
    setAreUnseenMessages(autoScrollLock)
  }, [messages])

  // Engage the scroll lock when the user scrolls away from the bottom so
  // that new messages don't pull them back down mid-read.
  useEventListener(messagesElm.current, 'scroll', () => {
    let element = messagesElm.current
    if (!element) return

    let distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight

    lockAutoScroll(
      distanceFromBottom >= AUTO_SCROLL_LOCK_DISTANCE &&
        !smoothScrollInProgress.current,
    )

    if (distanceFromBottom < AUTO_SCROLL_LOCK_DISTANCE) {
      setAreUnseenMessages(false)
    }

    if (smoothScrollInProgress.current) {
      clearTimeout(smoothScrollTimeout.current)
      smoothScrollTimeout.current = setTimeout(() => {
        smoothScrollInProgress.current = false
      }, 100)
    }
  })

  useEffect(() => {
    if (activeChannelId === channel._id && areUnseenMessages) {
      onViewNewMessages()
    }
  }, [activeChannelId])

  /* -- COMPUTED -- */

  /**
   * The class name for the "view new messages" button.
   */
  const viewNewMessagesClass = compute<string>(() => {
    let classList = new ClassList('ViewNewMessages')
    if (!areUnseenMessages) classList.add('Hidden')
    return classList.value
  })

  /* -- FUNCTIONS -- */

  /**
   * Scrolls to the latest messages and releases the auto-scroll lock.
   */
  const onViewNewMessages = () => {
    messagesElm.current?.scroll({
      top: messagesElm.current.scrollHeight,
      behavior: 'smooth',
    })
    smoothScrollInProgress.current = true
    lockAutoScroll(false)
    setAreUnseenMessages(false)
  }

  /* -- RENDER -- */

  return (
    <div className='MessagesArea'>
      <div className='Messages' ref={messagesElm}>
        {messages.map((msg) => (
          <MessengerMessage key={msg._id} message={msg} session={session} />
        ))}
      </div>
      <div className='MessageNavigation'>
        <div className={viewNewMessagesClass} onClick={onViewNewMessages}>
          <div className='Text'>New messages</div>
          <div className='Icon'></div>
        </div>
      </div>
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link MessengerMessages}.
 */
type TMessengerMessages_P = {
  /**
   * The channel whose messages this component displays.
   */
  channel: ClientChatChannel
}
