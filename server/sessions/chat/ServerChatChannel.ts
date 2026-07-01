import type { ServerMissionForce } from '@server/missions/forces/ServerMissionForce'
import type { ServerSessionMember } from '@server/sessions/ServerSessionMember'
import type { TChatChannelJson } from '@shared/sessions/chat/ChatChannel'
import { ChatChannel } from '@shared/sessions/chat/ChatChannel'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import type { SessionServer } from '../SessionServer'

/**
 * A chat channel in a session, derived from a force or representing
 * the session-wide "All" channel.
 */
export class ServerChatChannel extends ChatChannel<TMetisServerComponents> {
  /**
   * @param data The JSON data from which to construct the channel.
   * @param session The session this channel belongs to.
   */
  public constructor(data: TChatChannelJson, session: SessionServer) {
    super(data._id, data.name, data.forceIds, session)
  }

  /**
   * Returns `true` if the given member is allowed to see and participate in
   * this channel.
   * @param member The session member to check.
   */
  public canMemberSee(member: ServerSessionMember): boolean {
    if (this.forceIds === 'all') return true
    if (member.isAuthorized('completeVisibility')) return true
    return (
      member.assignedForceId !== null &&
      this.forceIds.includes(member.assignedForceId)
    )
  }

  /**
   * Creates the session-wide "All" channel.
   * @param session The session this channel belongs to.
   * @returns The created `ServerChatChannel`.
   */
  public static createAll(session: SessionServer): ServerChatChannel {
    return new ServerChatChannel(
      {
        _id: StringToolbox.generateRandomId(),
        name: 'All',
        forceIds: 'all',
        messages: [],
      },
      session,
    )
  }

  /**
   * Creates a channel scoped to a single force.
   * @param force The force to create the channel for.
   * @param session The session this channel belongs to.
   * @returns The created `ServerChatChannel`.
   */
  public static fromForce(
    force: ServerMissionForce,
    session: SessionServer,
  ): ServerChatChannel {
    return new ServerChatChannel(
      {
        _id: StringToolbox.generateRandomId(),
        name: force.name,
        forceIds: [force._id],
        messages: [],
      },
      session,
    )
  }
}
