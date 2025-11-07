import { MetisComponent } from '../MetisComponent'
import type { TExecutionCheats } from '../missions/actions/ActionExecution'
import type { TAction } from '../missions/actions/MissionAction'
import type { TMission, TMissionExistingJson } from '../missions/Mission'
import type { TUserJson } from '../users/User'
import { User } from '../users/User'
import type { TMember, TSessionMemberJson } from './members/SessionMember'

/**
 * Base class for sessions. Represents a session of a mission being executed by users.
 */
export abstract class MissionSession<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> extends MetisComponent {
  /**
   * The user ID of the owner of the session.
   */
  public readonly ownerId: User['_id']

  /**
   * The username of the owner.
   */
  public readonly ownerUsername: User['username']

  /**
   * The first name of the owner.
   */
  public readonly ownerFirstName: User['firstName']

  /**
   * The last name of the owner.
   */
  public readonly ownerLastName: User['lastName']

  /**
   * The full name of the owner.
   */
  public get ownerFullName(): User['name'] {
    return User.getFullName(this.ownerFirstName, this.ownerLastName)
  }

  /**
   * The date/time that the session was launched.
   */
  public readonly launchedAt: Date

  /**
   * Protected cache for `config`.
   */
  protected _config: TSessionConfig
  /**
   * The configuration for the session.
   */
  public get config(): TSessionConfig {
    return { ...this._config }
  }

  /**
   * The mission being executed by the participants.
   */
  protected _mission: TMission<T>
  /**
   * The mission being executed by the participants.
   */
  public get mission(): T['mission'] {
    return this._mission
  }

  // Implemented
  public get missionId(): TMission<T>['_id'] {
    return this.mission._id
  }

  /**
   * Protected cache for `members`.
   */
  protected _members: TMember<T>[]
  /**
   * The members who have joined the session.
   */
  public get members(): TMember<T>[] {
    return [...this._members]
  }

  /**
   * The members sorted by their role in the session.
   * @note Sort order: Participants, Managers, Observers.
   */
  public get membersSorted(): TMember<T>[] {
    let membersRaw = [...this._members]
    let weights = {
      participant: 0,
      observer_limited: 1,
      manager_limited: 2,
      manager: 3,
      observer: 4,
    }
    return membersRaw.sort((a, b) => {
      return weights[a.role._id] - weights[b.role._id]
    })
  }

  /**
   * The session members with the 'participant' role.
   */
  public get participants(): TMember<T>[] {
    return this._members.filter(({ role }) => role._id === 'participant')
  }

  /**
   * The session members with the 'observer' role.
   */
  public get observers(): TMember<T>[] {
    return this._members.filter(({ role }) => role._id === 'observer')
  }

  /**
   * The session members with the 'manager' role.
   */
  public get managers(): TMember<T>[] {
    return this._members.filter(({ role }) => role._id === 'manager')
  }

  /**
   * Protected cache for `banList`.
   */
  protected _banList: string[]
  /**
   * IDs of users who have been banned from the session.
   */
  public get banList(): string[] {
    return [...this._banList]
  }

  /**
   * Protected cache for `state`.
   */
  protected _state: TSessionState
  /**
   * The state of the session (unstarted, started, ended).
   */
  public get state(): TSessionState {
    return this._state
  }

  /**
   * A map of actionIDs to actions compiled from those found in the mission being executed.
   */
  protected actions: Map<string, TAction<T>> = new Map<string, TAction<T>>()

  /**
   * Checks if the given action has enough resources given the
   * session and any configured cheats.
   * @param action The action in question.
   * @param cheats The cheats to apply to the action. This will determine
   * whether the action can be executed, even if a typical requirement
   * is not met.
   * @returns Whether the action has enough resources to be executed
   * in the session.
   * @note This will be true if one of any of the following conditions
   * are met:
   * 1. The action has zero cost.
   * 2. There are infinite resources in the session.
   * 3. There are enough resources remaining in the session.
   */
  public areEnoughResources(
    action: TAction<T>,
    cheats: Partial<TExecutionCheats> = {},
  ): boolean {
    let enoughResources = action.areEnoughResources
    let zeroCost = !!cheats.zeroCost
    let infiniteResources = this.config.infiniteResources

    // The action has enough resources if it has zero cost,
    // or there are infinite resources, or there are enough
    // resources remaining.
    return zeroCost || infiniteResources || enoughResources
  }

  /**
   * Determines whether the given action can currently be executed in the session.
   * @param action The action in question.
   * @param cheats The cheats to apply to the action. This will determine
   * whether the action can be executed, even if a typical requirement
   * is not met.
   * @returns Whether the action is ready to be executed in the session.
   * @note This will be true if all of the following conditions are met:
   * 1. The action's node is ready to execute.
   * 2. The action has enough resources to execute, given the session and cheats.
   */
  public readyToExecute(
    action: TAction<T>,
    cheats: Partial<TExecutionCheats> = {},
  ): boolean {
    let nodeReady = action.node.readyToExecute
    let enoughResources = this.areEnoughResources(action, cheats)
    let executionLimitReached = action.executionLimitReached

    // The action is ready to execute if the node is ready to execute
    // and there are enough resources for the action, given the session
    // and the cheats.
    return nodeReady && enoughResources && !executionLimitReached
  }

  /**
   * ** Note: Use the static method `launch` to create a new session with a new session ID. **
   */
  public constructor(
    _id: string,
    name: string,
    ownerId: string,
    ownerUsername: User['username'],
    ownerFirstName: User['firstName'],
    ownerLastName: User['firstName'],
    launchedAt: Date,
    config: Partial<TSessionConfig>,
    mission: TMission<T>,
    memberData: TSessionMemberJson[],
    banList: string[],
  ) {
    super(_id, name, false)

    this.ownerId = ownerId
    this.ownerUsername = ownerUsername
    this.ownerFirstName = ownerFirstName
    this.ownerLastName = ownerLastName
    this.launchedAt = launchedAt
    this._config = {
      ...MissionSession.DEFAULT_CONFIG,
      ...config,
    }
    this._mission = mission
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

  /**
   * Checks if the given user is currently in the session
   * (Whether as a participant, manager, or observer).
   * @param userId The ID of the user to check.
   * @returns Whether the given user is joined into the session.
   */
  public isJoined(userId: User['_id']): boolean {
    for (let { userId: x } of this.members) if (x === userId) return true
    return false
  }

  /**
   * @param _id The ID of the member to get.
   * @returns The member with the given ID, or undefined
   * if not found.
   */
  public getMember(
    _id: TMember<T>['_id'] | null | undefined,
  ): TMember<T> | undefined {
    return this.members.find((member) => member._id === _id)
  }

  /**
   * @param userId The ID of the user to get the member for.
   * @returns The member with the given user ID, or undefined
   * if not found.
   */
  public getMemberByUserId(
    userId: User['_id'] | null | undefined,
  ): TMember<T> | undefined {
    return this.members.find((member) => member.userId === userId)
  }

  /**
   * Converts the Session object to JSON.
   * @returns A JSON representation of the session.
   */
  public abstract toJson(): TSessionJson

  /**
   * Converts the Session object to basic JSON.
   * @returns A basic (Limited) JSON representation of the session.
   */
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
      infiniteResources: false,
      effectsEnabled: true,
    }
  }

  /**
   * Options for the accessibility of the session.
   */
  public static get ACCESSIBILITY_OPTIONS(): TSessionAccessibility[] {
    return ['public', 'id-required', 'invite-only', 'testing']
  }
}

/* -- TYPES -- */

/**
 * The accessiblity of the session to students.
 * @option 'public' The session is accessible to all students.
 * @option 'id-required' The session is accessible to students with the session ID.
 * @option 'invite-only' The session is accessible to students with an invite.
 * @option 'testing' The session is only accessible to the owner for testing,
 * and it is destroyed after the owner leaves.
 */
export type TSessionAccessibility =
  | 'public'
  | 'id-required'
  | 'invite-only'
  | 'testing'

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
  ownerId: User['_id']
  /**
   * The username of the owner.
   */
  ownerUsername: User['username']
  /**
   * The first name of the owner.
   */
  ownerFirstName: User['firstName']
  /**
   * The last name of the owner.
   */
  ownerLastName: User['lastName']
  /**
   * The ISO date/time that the session was launched.
   */
  launchedAt: string
  /**
   * The configuration for the session.
   */
  config: TSessionConfig
  /**
   * The mission that is being executed in the session.
   */
  mission: TMissionExistingJson
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
  ownerId: NonNullable<TUserJson['_id']>
  /**
   * The username of the owner.
   */
  ownerUsername: TUserJson['username']
  /**
   * The first name of the owner.
   */
  ownerFirstName: TUserJson['firstName']
  /**
   * The last name of the owner.
   */
  ownerLastName: TUserJson['lastName']
  /**
   * The ISO date/time that the session was launched.
   */
  launchedAt: string
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
 * Extracts the session type from a registry of METIS
 * components type that extends `TMetisBaseComponents`.
 * @param T The type registry.
 * @returns The session type.
 */
export type TSession<T extends TMetisBaseComponents> = T['session']

/**
 * The state of a session.
 */
export type TSessionState =
  | 'unstarted'
  | 'starting'
  | 'started'
  | 'ending'
  | 'ended'
  | 'resetting'

/**
 * The role of a user in a session.
 */
export type TSessionRole = 'participant' | 'observer' | 'manager' | 'not-joined'
