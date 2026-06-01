import Panel from '@client/components/content/general-layout/panels/Panel'
import PanelView from '@client/components/content/general-layout/panels/PanelView'
import { useSessionPageContext } from '@client/components/pages/sessions/context'
import { useGlobalContext } from '@client/context/global'
import { LocalContext, LocalContextProvider } from '@client/context/local'
import type { ClientChatChannel } from '@client/sessions/chat/ClientChatChannel'
import type { SessionClient } from '@client/sessions/SessionClient'
import { compute } from '@client/toolbox'
import { useEventListener } from '@client/toolbox/hooks'
import type { JSX } from 'react'
import { useState } from 'react'
import MessengerComposer from './MessengerComposer'
import MessengerMessages from './MessengerMessages'
import './MessengerPanel.scss'

/* -- CONTEXT -- */

/**
 * Context for {@link MessengerPanel}, distributing shared state and
 * actions to its subcomponents.
 */
const messengerContext = new LocalContext<
  TMessengerPanel_P,
  TMessengerPanel_C,
  TMessengerPanel_S,
  {}
>()

/**
 * Hook used by {@link MessengerPanel} subcomponents to access the messenger context.
 */
export const useMessengerContext = messengerContext.getHook()

/* -- COMPONENT -- */

/**
 * A panel for sending and receiving in-session chat messages.
 */
export default function MessengerPanel(
  props: TMessengerPanel_P,
): TReactElement {
  const defaultedProps = props as Required<TMessengerPanel_P>
  const { session } = defaultedProps
  const { state: pageState } = useSessionPageContext()
  const [, setMessengerHasUnreadMessages] = pageState.messengerHasUnreadMessages
  const [server] = useGlobalContext().server
  const { memberChatChannels } = session

  /* -- STATE -- */

  const state: TMessengerPanel_S = {
    channels: useState<ClientChatChannel[]>(() => memberChatChannels),
    activeChannelId: useState<string | null>(
      // Select the first channel by default, if any exist.
      () => memberChatChannels[0]?._id ?? null,
    ),
    unreadMessagesPerChannel: useState<Map<string, number>>(() => {
      let unreadMessages = new Map<string, number>()
      for (let channel of memberChatChannels) {
        let count = session.getUnreadChatMessageCount(channel._id)
        if (count > 0) unreadMessages.set(channel._id, count)
      }
      return unreadMessages
    }),
  }
  const [channels, setChannels] = state.channels
  const [activeChannelId, setActiveChannelId] = state.activeChannelId
  const [unreadMessagesPerChannel, setUnreadMessagesPerChannel] =
    state.unreadMessagesPerChannel

  /* -- EFFECTS -- */

  // Refresh channels and unread counts when a new chat message arrives.
  // Each MessengerMessages instance handles refreshing its own message list.
  useEventListener(server, 'chat-message-received', () => {
    // Re-sync the channel list in case membership changed.
    setChannels(memberChatChannels)

    // Get the new unread message counts for each channel.
    let unreadMessages = new Map<string, number>()
    for (let channel of memberChatChannels) {
      unreadMessages.set(
        channel._id,
        session.getUnreadChatMessageCount(channel._id),
      )
    }

    // If the user is already viewing a channel, mark it read immediately
    // to remove its badge(s).
    if (activeChannelId !== null) {
      session.markAllMessagesInChannelAsRead(activeChannelId)
      unreadMessages.set(activeChannelId, 0)
    }

    // Update the state with the new unread message counts.
    setUnreadMessagesPerChannel(unreadMessages)

    // Update the Messenger panel alert based on the state of
    // unread messages across all channels.
    const noUnreadMessages = !checkForAnyUnreadMessages(unreadMessages)
    if (noUnreadMessages) setMessengerHasUnreadMessages(false)
    else setMessengerHasUnreadMessages(true)
  })

  /* -- COMPUTED -- */

  /**
   * The currently active channel, or `null` if none is selected.
   */
  const activeChannel = compute<ClientChatChannel | null>(
    () => channels.find((c) => c._id === activeChannelId) ?? null,
  )

  /* -- FUNCTIONS -- */

  /**
   * Selects a channel by name, marks it as read, and updates the active
   * channel ID for the composer.
   */
  const onSelectChannel = (channelId: string) => {
    // Sync the server and the client where necessary
    // that all messages in the selected channel have
    // been read.
    session.markAllMessagesInChannelAsRead(channelId)

    // Selects the channel for the UI.
    setActiveChannelId(channelId)

    // Set the count to 0 for the selected channel and update
    // the state.
    const next = new Map(unreadMessagesPerChannel)
    next.set(channelId, 0)
    setUnreadMessagesPerChannel(next)

    // Update the Messenger panel alert based on the state of
    // unread messages across all channels.
    const noUnreadMessages = !checkForAnyUnreadMessages(next)
    if (noUnreadMessages) setMessengerHasUnreadMessages(false)
    else setMessengerHasUnreadMessages(true)
  }

  /**
   * Checks if there are any unread messages in any of the channels.
   * @param unreadMessages A map of channel IDs to their unread message counts.
   * @returns `true` if there are any unread messages, `false` otherwise.
   */
  const checkForAnyUnreadMessages = (
    unreadMessages: Map<string, number>,
  ): boolean => {
    const unreadMessagesForEveryChannel = Array.from(unreadMessages.values())
    return unreadMessagesForEveryChannel.some((count) => count > 0)
  }

  /* -- PRE-RENDER PROCESSING -- */

  /**
   * Generates the JSX elements for each channel, including unread message counts.
   */
  const channelsJsx = compute<JSX.Element[]>(() => {
    return channels.map((channel) => {
      const unreadMessageCount = unreadMessagesPerChannel.get(channel._id) ?? 0
      const hasUnreadMessages = unreadMessageCount > 0
      const panelDescription = hasUnreadMessages
        ? `**You have ${unreadMessageCount} unread message(s)**`
        : undefined

      return (
        <PanelView
          key={channel._id}
          title={channel.name}
          highlighted={hasUnreadMessages}
          description={panelDescription}
        >
          <MessengerMessages channel={channel} />
        </PanelView>
      )
    })
  })

  /* -- RENDER -- */

  return (
    <LocalContextProvider
      context={messengerContext}
      defaultedProps={defaultedProps}
      computed={{ activeChannel, onSelectChannel }}
      state={state}
      elements={{}}
    >
      <div className='MessengerPanel'>
        <Panel
          onViewSelected={(channelName) => {
            let ch = channels.find((c) => c.name === channelName)
            if (ch) onSelectChannel(ch._id)
          }}
        >
          {channelsJsx}
        </Panel>
        <MessengerComposer />
      </div>
    </LocalContextProvider>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link MessengerPanel}.
 */
export type TMessengerPanel_P = {
  /**
   * The active session the messenger is operating within.
   */
  session: SessionClient
}

/**
 * Computed values derived from props and state for {@link MessengerPanel}.
 */
type TMessengerPanel_C = {
  /**
   * The currently active channel, or `null` if none is selected.
   */
  activeChannel: ClientChatChannel | null
  /**
   * Marks a channel as read and sets it as the active channel for the
   * composer.
   */
  onSelectChannel: (channelId: string) => void
}

/**
 * Consolidated state for {@link MessengerPanel}.
 */
type TMessengerPanel_S = {
  /**
   * The channels visible to the current member.
   */
  channels: TReactState<ClientChatChannel[]>
  /**
   * The ID of the currently selected channel, or `null` if none.
   */
  activeChannelId: TReactState<string | null>
  /**
   * The number of unread messages per channel.
   */
  unreadMessagesPerChannel: TReactState<Map<string, number>>
}
