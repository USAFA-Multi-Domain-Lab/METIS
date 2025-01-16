import {
  TCommonMission,
  TCommonMissionJson,
  TCommonMissionTypes,
  TMission,
} from 'metis/missions'
import { TAction, TCommonMissionAction } from '../missions/actions'
import { TCommonUser } from '../users'
import { TCommonSessionMember, TMember, TSessionMemberJson } from './members'

/**
 * Base class for sessions. Represents a session of a mission being executed by users.
 */
export default abstract class Session<T extends TCommonMissionTypes>
  implements TCommonSession
{
  // Implemented
  public readonly _id: string

  // Implemented
  public name: string

  // Implemented
  public readonly ownerId: TCommonUser['_id']

  // Implemented
  public readonly ownerUsername: TCommonUser['username']

  // Implemented
  public readonly ownerFirstName: TCommonUser['firstName']

  // Implemented
  public readonly ownerLastName: TCommonUser['lastName']

  /**
   * Protected cache for `config`.
   */
  protected _config: TSessionConfig
  // Implemented
  public get config(): TSessionConfig {
    return { ...this._config }
  }

  // Implemented
  public readonly mission: T['mission']

  // Implemented
  public get missionId(): TMission<T>['_id'] {
    return this.mission._id
  }

  /**
   * Protected cache for `members`.
   */
  protected _members: TMember<T>[]
  // Implemented
  public get members(): TMember<T>[] {
    return [...this._members]
  }

  // Implemented
  public get membersSorted(): TMember<T>[] {
    let membersRaw = [...this._members]
    let weights = {
      participant: 0,
      observer_limited: 1,
      manager: 2,
      observer: 3,
    }
    return membersRaw.sort((a, b) => {
      return weights[a.role._id] - weights[b.role._id]
    })
  }

  // Implemented
  public get participants(): TMember<T>[] {
    return this._members.filter(({ role }) => role._id === 'participant')
  }

  // Implemented
  public get observers(): TMember<T>[] {
    return this._members.filter(({ role }) => role._id === 'observer')
  }

  // Implemented
  public get managers(): TMember<T>[] {
    return this._members.filter(({ role }) => role._id === 'manager')
  }

  /**
   * Protected cache for `banList`.
   */
  protected _banList: string[]
  // Implemented
  public get banList(): string[] {
    return [...this._banList]
  }

  /**
   * Protected cache for `state`.
   */
  protected _state: TSessionState
  // Implemented
  public get state(): TSessionState {
    return this._state
  }

  /**
   * A map of actionIDs to actions compiled from those found in the mission being executed.
   */
  protected actions: Map<string, TAction<T>> = new Map<string, TAction<T>>()

  // Implemented
  public readyToExecute(action: TAction<T>): boolean {
    return (
      action.node.readyToExecute &&
      action.resourceCost <= action.force.resourcesRemaining
    )
  }

  /**
   * ** Note: Use the static method `launch` to create a new session with a new session ID. **
   */
  public constructor(
    _id: string,
    name: string,
    ownerId: string,
    ownerUsername: TCommonUser['username'],
    ownerFirstName: TCommonUser['firstName'],
    ownerLastName: TCommonUser['firstName'],
    config: Partial<TSessionConfig>,
    mission: TMission<T>,
    memberData: TSessionMemberJson[],
    banList: string[],
  ) {
    this._id = _id
    this.name = name
    this.ownerId = ownerId
    this.ownerUsername = ownerUsername
    this.ownerFirstName = ownerFirstName
    this.ownerLastName = ownerLastName
    this._config = {
      ...Session.DEFAULT_CONFIG,
      ...config,
    }
    this.mission = mission
    this._state = 'unstarted'
    this._members = this.parseMemberData(memberData)
    this._banList = banList
    this.mapActions()
  }

  /**
   * Parses member JSON data into `MemberSession` objects.
   * @param data The JSON data of the members.
   * @returns The parsed members.
   */
  protected abstract parseMemberData(data: TSessionMemberJson[]): TMember<T>[]

  /**
   * Loops through all the nodes in the mission, and each action in a node, and maps the actionId to the action in the field "actions".
   */
  protected abstract mapActions(): void

  // Implemented
  public isJoined(userId: TCommonUser['_id']): boolean {
    for (let { userId: x } of this.members) if (x === userId) return true
    return false
  }

  // Implemented
  public getMember(_id: TMember<T>['_id']): TMember<T> | undefined {
    return this.members.find((member) => member._id === _id)
  }

  // Implemented
  public getMemberByUserId(userId: TCommonUser['_id']): TMember<T> | undefined {
    return this.members.find((member) => member.userId === userId)
  }

  // Implemented
  public abstract toJson(): TSessionJson

  // Implemented
  public abstract toBasicJson(): TSessionBasicJson

  /**
   * The endpoint for accessing sessions on the API.
   */
  public static readonly API_ENDPOINT: string = '/api/v1/sessions'

  /**
   * Default value for the session configuration.
   */
  public static get DEFAULT_CONFIG(): TSessionConfig {
    return {
      accessibility: 'public',
      autoAssign: true,
      infiniteResources: false,
      effectsEnabled: true,
    }
  }
}

/**
 * The accessiblity of the session to students.
 * @option 'public' The session is accessible to all students.
 * @option 'id-required' The session is accessible to students with the session ID.
 * @option 'invite-only' The session is accessible to students with an invite.
 */
export type TSessionAccessibility = 'public' | 'id-required' | 'invite-only'

/**
 * Configuration options for a session, customizing the experience.
 */
export type TSessionConfig = {
  /**
   * The accessiblity of the session to students.
   * @default 'public'
   */
  accessibility: TSessionAccessibility
  /**
   * Whether students will be auto-assigned to their roles.
   * @default true
   */
  autoAssign: boolean
  /**
   * Whether resources will be infinite in the session.
   * @default false
   */
  infiniteResources: boolean
  /**
   * Whether effects will be enabled in the session.
   * @default true
   */
  effectsEnabled: boolean
  /**
   * The name of the session.
   * @note If not provided, the name of the mission will be used.
   */
  name?: string
}

/**
 * JSON representation of a session.
 */
export type TSessionJson = {
  /**
   * The ID of the session.
   */
  _id: string
  /**
   * The state of the session (unstarted, started, ended).
   */
  state: TSessionState
  /**
   * The name of the session.
   */
  name: string
  /**
   * The ID of the owner of the session.
   */
  ownerId: TCommonUser['_id']
  /**
   * The username of the owner.
   */
  ownerUsername: TCommonUser['username']
  /**
   * The first name of the owner.
   */
  ownerFirstName: TCommonUser['firstName']
  /**
   * The last name of the owner.
   */
  ownerLastName: TCommonUser['lastName']
  /**
   * The configuration for the session.
   */
  config: TSessionConfig
  /**
   * The mission that is being executed in the session.
   */
  mission: TCommonMissionJson
  /**
   * The members of the session in the mission.
   */
  members: TSessionMemberJson[]
  /**
   * The IDs of participants who have been banned from the session.
   */
  banList: string[]
}

/**
 * A more basic (limited) JSON representation of a session.
 */
export type TSessionBasicJson = {
  /**
   * The ID of the session.
   */
  _id: string
  /**
   * The ID of the mission being executed by the participants.
   */
  missionId: string
  /**
   * The name of the session.
   */
  name: string
  /**
   * The ID of the owner of the session.
   */
  ownerId: TCommonUser['_id']
  /**
   * The username of the owner.
   */
  ownerUsername: TCommonUser['username']
  /**
   * The first name of the owner.
   */
  ownerFirstName: TCommonUser['firstName']
  /**
   * The last name of the owner.
   */
  ownerLastName: TCommonUser['lastName']
  /**
   * The configuration for the session.
   */
  config: TSessionConfig
  /**
   * The IDs of the participants of the session.
   */
  participantIds: string[]
  /**
   * The IDs of the participants banned from the session.
   * @note Empty if the user does not have observer permissions.
   */
  banList: string[]
  /**
   * The IDs of the observers of the session.
   */
  observerIds: string[]
  /**
   * The IDs of the managers of the session.
   */
  managerIds: string[]
}

/**
 * Extracts the session type from the session types.
 * @param T The session types.
 * @returns The session type.
 */
export type TSession<T extends TCommonMissionTypes> = T['session']

/**
 * Interface of the abstract `Session` class.
 * @note Any public, non-static properties and functions of the `Session`
 * class must first be defined here for them to be accessible to other
 * session-related classes.
 */
export type TCommonSession = {
  /**
   * The ID of the session.
   */
  readonly _id: string
  /**
   * The name of the session.
   */
  name: string
  /**
   * The user ID of the owner of the session.
   */
  readonly ownerId: TCommonUser['_id']
  /**
   * The username of the owner.
   */
  readonly ownerUsername: TCommonUser['username']
  /**
   * The first name of the owner.
   */
  readonly ownerFirstName: TCommonUser['firstName']
  /**
   * The last name of the owner.
   */
  readonly ownerLastName: TCommonUser['lastName']
  /**
   * The configuration for the session.
   */
  config: TSessionConfig
  /**
   * The mission being executed by the participants.
   */
  readonly mission: TCommonMission
  /**
   * The members who have joined the session.
   */
  get members(): TCommonSessionMember[]
  /**
   * The members sorted by their role in the session.
   * @note Sort order: Participants, Managers, Observers.
   */
  get membersSorted(): TCommonSessionMember[]
  /**
   * The session members with the 'participant' role.
   */
  get participants(): TCommonSessionMember[]
  /**
   * The session members with the 'observer' role.
   */
  get observers(): TCommonSessionMember[]
  /**
   * The session members with the 'manager' role.
   */
  get managers(): TCommonSessionMember[]
  /**
   * IDs of users who have been banned from the session.
   */
  get banList(): string[]
  /**
   * The state of the session (unstarted, started, ended).
   */
  get state(): TSessionState
  /**
   * Determines whether the given action can currently be executed in the session.
   * @param action The action in question.
   * @returns Whether the action is ready to be executed in the session.
   */
  readyToExecute(action: TCommonMissionAction): boolean
  /**
   * Checks if the given user is currently in the session (Whether as a participant, manager, or observer).
   * @param userId The ID of the user to check.
   * @returns Whether the given user is joined into the session.
   */
  isJoined(userId: TCommonUser['_id']): boolean
  /**
   * Gets the member with the given member ID.
   * @param _id The ID of the member to get.
   * @returns The member with the given ID, or undefined if not found.
   */
  getMember(_id: TCommonSessionMember['_id']): TCommonSessionMember | undefined
  /**
   * Gets the member with the given user ID.
   * @param userId The ID of the user to get the member for.
   * @returns The member with the given user ID, or undefined if not found.
   */
  getMemberByUserId(
    userId: TCommonUser['_id'],
  ): TCommonSessionMember | undefined
  /**
   * Converts the Session object to JSON.
   * @returns A JSON representation of the session.
   */
  toJson(): TSessionJson
  /**
   * Converts the Session object to basic JSON.
   * @returns A basic (Limited) JSON representation of the session.
   */
  toBasicJson(): TSessionBasicJson
}

/**
 * The state of a session.
 */
export type TSessionState = 'unstarted' | 'started' | 'ended'

/**
 * The role of a user in a session.
 */
export type TSessionRole = 'participant' | 'observer' | 'manager' | 'not-joined'
