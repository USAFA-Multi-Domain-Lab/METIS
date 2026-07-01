import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { ServerChatMessage } from '../chat/ServerChatMessage'
import { createServerSessionController } from './createServerSessionController'

/**
 * Called when a member requests to send a chat message to a channel.
 * @param member The member sending the message.
 * @param event The event emitted by the member.
 */
export const onRequestSendChatMessage =
  createServerSessionController<'request-send-chat-message'>(
    function (this, member, event) {
      let request = member.buildResponseRequestData(event)
      let { channelId, message } = event.data

      // Only allow messaging in a started session.
      if (this._state !== 'started') {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
            { request },
          ),
        )
      }

      // Find the channel.
      let channel = this.getChatChannel(channelId)
      if (!channel) {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_CHAT_CHANNEL_NOT_FOUND,
            {
              request,
            },
          ),
        )
      }

      // Ensure the member is allowed to see (and therefore post to) the channel.
      if (!channel.canMemberSee(member)) {
        return member.emitError(
          new ServerEmittedError(
            ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
            { request },
          ),
        )
      }

      // Generate and store the message.
      let chatMessage = ServerChatMessage.generate(
        channel,
        this,
        member,
        message,
      )
      channel.messages.push(chatMessage)
      let messageJson = chatMessage.toJson()

      // Broadcast to all joined members who can see the channel.
      for (let recipient of this.joinedMembers) {
        if (channel.canMemberSee(recipient)) {
          recipient.emit('chat-message-received', {
            data: { message: messageJson },
          })

          // Also emit a session panel alert and increment the unread count for recipients
          // who didn't send the message, but have received it.
          if (recipient._id !== member._id) {
            this.emitSessionPanelAlert(recipient, 'Messenger')
            this.incrementUnreadChatCount(recipient._id, channel._id)
          }
        }
      }

      // Confirm delivery to the sender.
      member.emit('chat-message-sent', {
        data: messageJson,
        request,
      })
    },
  )
