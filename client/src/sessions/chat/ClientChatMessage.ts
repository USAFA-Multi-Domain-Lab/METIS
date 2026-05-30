import type { TMetisClientComponents } from '@client/index'
import type { TChatMessageJson } from '@shared/sessions/chat/ChatMessage'
import { ChatMessage } from '@shared/sessions/chat/ChatMessage'
import type { ClientChatChannel } from './ClientChatChannel'

/**
 * Client-side representation of a chat message within a session.
 */
export class ClientChatMessage extends ChatMessage<TMetisClientComponents> {
  /**
   * @param channel The channel this message was sent in.
   * @param data The JSON data from which to construct the message.
   */
  public constructor(channel: ClientChatChannel, data: TChatMessageJson) {
    super(channel, data)
  }

  /**
   * Creates a `ClientChatMessage` from a JSON object.
   * @param channel The channel this message was sent in.
   * @param data The JSON data from which to construct the message.
   * @returns The constructed `ClientChatMessage`.
   */
  public static fromJson(
    channel: ClientChatChannel,
    data: TChatMessageJson,
  ): ClientChatMessage {
    return new ClientChatMessage(channel, data)
  }
}
