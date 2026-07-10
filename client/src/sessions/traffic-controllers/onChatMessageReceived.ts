import { ClientChatMessage } from '@client/sessions/chat/ClientChatMessage'
import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when a chat message is received from the server.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onChatMessageReceived =
  createClientSessionController<'chat-message-received'>(
    function (this, member, event) {
      let msgData = event.data.message

      let channel = this.getChatChannel(msgData.channelId)
      if (!channel) return

      let message = ClientChatMessage.fromJson(channel, msgData)
      channel.messages.push(message)

      if (message.senderId !== member._id) {
        let count = this._unreadChatMessageCount.get(message.channelId) ?? 0
        this._unreadChatMessageCount.set(message.channelId, count + 1)
      }
    },
  )
