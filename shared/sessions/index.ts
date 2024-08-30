import { TCommonMission, TCommonMissionJson } from 'metis/missions'
import { TCommonMissionForce } from 'metis/missions/forces'
import { TCommonMissionAction } from '../missions/actions'
import { TCommonMissionNode } from '../missions/nodes'
import { TCommonUser, TCommonUserJson } from '../users'

/**
 * Base class for sessions. Represents a session of a mission being executed by users.
 */
export default abstract class Session<
  TUser extends { _id: TCommonUser['_id'] } | { userId: TCommonUser['_id'] },
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
   * The participants of the session executing the mission.
   */
  protected _participants: TUser[]
  /**
   * The participants of the session executing the mission.
   */
  public get participants(): TUser[] {
    return [...this._participants]
  }

  /**
   * Assignments of participants to forces in the mission.
   * @note The key is the participant ID, and the value is the force ID.
   */
  protected assignments: Map<string, string>

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
   * The users who are supervisors of the session that is in progress.
   */
  protected _supervisors: TUser[]
  /**
   * The users who are supervisors of the session that is in progress.
   */
  public get supervisors(): TUser[] {
    return [...this._supervisors]
  }

  /**
   * All users, including participants and supervisors.
   */
  public get users(): TUser[] {
    return [...this._participants, ...this._supervisors]
  }

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
    participants: TUser[],
    banList: string[],
    supervisors: TUser[],
  ) {
    this._id = _id
    this.name = name
    this._config = {
      ...Session.DEFAULT_CONFIG,
      ...config,
    }
    this.mission = mission
    this._state = 'unstarted'
    this._participants = participants
    this.assignments = new Map<string, string>()
    this._banList = banList
    this._supervisors = supervisors
    this.mapActions()
  }

  /**
   * Loops through all the nodes in the mission, and each action in a node, and maps the actionId to the action in the field "actions".
   */
  protected abstract mapActions(): void

  /**
   * Checks if the given user is currently in the session (Whether as a participant or as a supervisor).
   * @param user The user to check.
   * @returns Whether the given user is joined into the session.
   */
  public abstract isJoined(user: TUser): boolean

  /**
   * Checks if the given user is currently a participant in the session.
   * @param user The user to check.
   * @returns Whether the given user is a participant of the session.
   */
  public abstract isParticipant(user: TUser): boolean

  /**
   * Checks if the given user is currently a supervisor in the session.
   * @param user The user to check.
   * @returns Whether the given user is a supervisor in the session.
   */
  public abstract isSupervisor(user: TUser): boolean

  /**
   * Gets the assigned force of the given user in the session.
   */
  public abstract getAssignedForce(user: TUser): TForce | undefined

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
   * The mission being executed by the participants.
   */
  mission: TCommonMissionJson
  /**
   * The participants of the session executing the mission.
   */
  participants: TCommonUserJson[]
  /**
   * The IDs of participants who have been banned from the session.
   */
  banList: string[]
  /**
   * The supervisors joined in the session.
   */
  supervisors: TCommonUserJson[]
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
   * @note Empty if the user does not have supervisor permissions.
   */
  banList: string[]
  /**
   * The IDs of the supervisors of the session.
   */
  supervisorIds: string[]
}

/**
 * The state of a session.
 */
export type TSessionState = 'unstarted' | 'started' | 'ended'

/**
 * The role of a user in a session.
 */
export type TSessionRole = 'participant' | 'supervisor' | 'not-joined'
