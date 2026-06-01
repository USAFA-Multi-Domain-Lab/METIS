import { MetisComponent, type TMetisBaseComponents } from '../../MetisComponent'
import type { TForce } from '../../missions/forces/MissionForce'
import type { TSession } from '../MissionSession'
import type { ChatMessage, TChatMessageJson } from './ChatMessage'

/**
 * A chat channel within a session.
 */
export abstract class ChatChannel<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> extends MetisComponent {
  /**
   * The forces that have access to this channel.
   * - `'all'` — every session member can see the channel.
   * - `string[]` — only members assigned to one of the listed force IDs
   *   (or members with `completeVisibility`) can see the channel.
   */
  public readonly forceIds: string[] | 'all'

  /**
   * The forces associated with this channel, resolved from the session mission.
   */
  public get forces(): TForce<T>[] {
    if (this.forceIds === 'all')
      return this.session.mission.forces as TForce<T>[]
    return (this.session.mission.forces as TForce<T>[]).filter((f) =>
      (this.forceIds as string[]).includes(f._id),
    )
  }

  /**
   * The session this channel belongs to.
   */
  public session: TSession<T>

  /**
   * Messages sent in this channel, in order of receipt.
   */
  public messages: ChatMessage<T>[]

  /**
   * @param _id The unique ID of the channel.
   * @param name The name of the channel.
   * @param forceIds The IDs of the forces that have access to this channel.
   * @param session The session this channel belongs to.
   * @param messages The messages sent in this channel.
   */
  public constructor(
    _id: string,
    name: string,
    forceIds: string[] | 'all',
    session: TSession<T>,
    messages: ChatMessage<T>[] = [],
  ) {
    super(_id, name, false)

    this.forceIds = forceIds
    this.session = session
    this.messages = messages
  }

  /**
   * Converts the channel to its JSON representation.
   * @returns The JSON representation of the channel.
   */
  public toJson(): TChatChannelJson {
    return {
      _id: this._id,
      name: this.name,
      forceIds: this.forceIds,
      messages: this.messages.map((m) => m.toJson()),
    }
  }
}

/**
 * JSON representation of a chat channel in a session.
 */
export type TChatChannelJson = {
  /** The unique ID of the channel. */
  _id: string
  /** The name of the channel. */
  name: string
  /**
   * The forces that have access to this channel.
   * - `'all'` — every session member can see the channel.
   * - `string[]` — only members assigned to one of the listed force IDs
   *   (or members with `completeVisibility`) can see the channel.
   */
  forceIds: string[] | 'all'
  /** The messages sent in this channel, in order of receipt. */
  messages: TChatMessageJson[]
}

/**
 * Extracts the chat channel type from a registry of METIS
 * components that extends `TMetisBaseComponents`.
 * @param T The type registry.
 * @returns The chat channel type.
 */
export type TChatChannel<T extends TMetisBaseComponents> = T['chatChannel']
