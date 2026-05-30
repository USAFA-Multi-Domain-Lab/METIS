import type { TMetisClientComponents } from '@client/index'
import type { TChatChannelJson } from '@shared/sessions/chat/ChatChannel'
import { ChatChannel } from '@shared/sessions/chat/ChatChannel'
import type { SessionClient } from '../SessionClient'
import { ClientChatMessage } from './ClientChatMessage'

/**
 * Client-side representation of a chat channel within a session.
 */
export class ClientChatChannel extends ChatChannel<TMetisClientComponents> {
  /**
   * @param data The JSON data from which to construct the channel.
   * @param session The session this channel belongs to.
   */
  public constructor(data: TChatChannelJson, session: SessionClient) {
    super(data._id, data.name, data.forceIds, session)
  }

  /**
   * Returns whether this channel is visible to a member given their force
   * membership and visibility level.
   * @param memberForceId The force ID of the member, or null if unassigned.
   * @param hasCompleteVisibility Whether the member has complete visibility.
   * @returns `true` if the member can see the channel.
   */
  public canSee(
    memberForceId: string | null,
    hasCompleteVisibility: boolean,
  ): boolean {
    if (this.forceIds === 'all') return true
    if (hasCompleteVisibility) return true
    if (memberForceId === null) return false
    return this.forceIds.includes(memberForceId)
  }

  /**
   * Creates a `ClientChatChannel` from a JSON object.
   * @param data The JSON data from which to construct the channel.
   * @param session The session this channel belongs to.
   * @returns The constructed `ClientChatChannel`.
   */
  public static fromJson(
    data: TChatChannelJson,
    session: SessionClient,
  ): ClientChatChannel {
    let channel = new ClientChatChannel(data, session)

    channel.messages = data.messages.map((m) =>
      ClientChatMessage.fromJson(channel, m),
    )

    return channel
  }
}
