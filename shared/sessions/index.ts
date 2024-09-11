import { TCommonMission, TCommonMissionJson } from 'metis/missions'
import { TCommonMissionForce } from 'metis/missions/forces'
import { TCommonMissionAction } from '../missions/actions'
import { TCommonMissionNode } from '../missions/nodes'
import { TCommonUser } from '../users'
import { TCommonSessionMember, TSessionMemberJson } from './members'

/**
 * Base class for sessions. Represents a session of a mission being executed by users.
 */
export default abstract class Session<
  TSessionMember extends TCommonSessionMember,
  TMission extends TCommonMission,
  TForce extends TCommonMissionForce,
  TMissionNode extends TCommonMissionNode,
  TMissionAction extends TCommonMissionAction,
> {
  /**
   * The ID of the session.
   */
  public readonly _id: string

  /**
   * The name of the session.
   */
  public name: string

  /**
   * The configuration for the session.
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
  public readonly mission: TMission

  /**
   * The ID of the mission being executed by the participants.
   */
  public get missionId(): TMission['_id'] {
    return this.mission._id
  }

  /**
   * The members who have joined the session.
   */
  protected _members: TSessionMember[]
  /**
   * The members who have joined the session.
   */
  public get members(): TSessionMember[] {
    return [...this._members]
  }

  /**
   * The session members with the 'participant' role.
   */
  public get participants(): TSessionMember[] {
    return this._members.filter(({ role }) => role._id === 'participant')
  }

  /**
   * The session members with the 'observer' role.
   */
  public get observers(): TSessionMember[] {
    return this._members.filter(({ role }) => role._id === 'observer')
  }

  /**
   * The session members with the 'manager' role.
   */
  public get managers(): TSessionMember[] {
    return this._members.filter(({ role }) => role._id === 'manager')
  }

  /**
   * IDs of participants who have been banned from the session.
   */
  protected _banList: string[]
  /**
   * IDs of participants who have been banned from the session.
   */
  public get banList(): string[] {
    return [...this._banList]
  }

  /**
   * Assignments of member to forces in the mission.
   * @note The key is the member ID, and the value is the force ID.
   */
  protected assignments: Map<string, string>

  /**
   * The state of the session (unstarted, started, ended).
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
  protected actions: Map<string, TMissionAction> = new Map<
    string,
    TMissionAction
  >()

  /**
   * Determines whether the given action can currently be executed in the session.
   * @param action The action in question.
   * @returns Whether the action is ready to be executed in the session.
   */
  public readyToExecute(action: TMissionAction): boolean {
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
    config: Partial<TSessionConfig>,
    mission: TMission,
    members: TSessionMember[],
    banList: string[],
  ) {
    this._id = _id
    this.name = name
    this._config = {
      ...Session.DEFAULT_CONFIG,
      ...config,
    }
    this.mission = mission
    this._state = 'unstarted'
    this._members = members
    this.assignments = new Map<string, string>()
    this._banList = banList
    this.mapActions()
  }

  /**
   * Loops through all the nodes in the mission, and each action in a node, and maps the actionId to the action in the field "actions".
   */
  protected abstract mapActions(): void

  /**
   * Checks if the given user is currently in the session (Whether as a participant, manager, or observer).
   * @param userId The ID of the user to check.
   * @returns Whether the given user is joined into the session.
   */
  public isJoined(userId: TCommonUser['_id']): boolean {
    for (let { userId: x } of this.members) if (x === userId) return true
    return false
  }

  /**
   * Gets the member with the given member ID.
   * @param _id The ID of the member to get.
   * @returns The member with the given ID, or undefined if not found.
   */
  public getMember(_id: TSessionMember['_id']): TSessionMember | undefined {
    return this.members.find((member) => member._id === _id)
  }

  /**
   * Gets the member with the given user ID.
   * @param userId The ID of the user to get the member for.
   * @returns The member with the given user ID, or undefined if not found.
   */
  public getMemberByUserId(
    userId: TCommonUser['_id'],
  ): TSessionMember | undefined {
    return this.members.find((member) => member.userId === userId)
  }

  /**
   * Gets the assigned force of the given member of the session.
   */
  public abstract getAssignedForce(member: TSessionMember): TForce | undefined

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
 * The state of a session.
 */
export type TSessionState = 'unstarted' | 'started' | 'ended'

/**
 * The role of a user in a session.
 */
export type TSessionRole = 'participant' | 'observer' | 'manager' | 'not-joined'
