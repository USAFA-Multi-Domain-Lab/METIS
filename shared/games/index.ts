import { TCommonMission, TCommonMissionJson } from 'metis/missions'
import { TCommonMissionAction } from '../missions/actions'
import { TCommonMissionNode } from '../missions/nodes'
import { TCommonUser, TCommonUserJson } from '../users'

/**
 * Base class for a games. Represents a game being played by participating students in METIS.
 */
export default abstract class Game<
  TUser extends { _id: TCommonUser['_id'] } | { userId: TCommonUser['_id'] },
  TMission extends TCommonMission,
  TMissionNode extends TCommonMissionNode,
  TMissionAction extends TCommonMissionAction,
> {
  /**
   * The ID of the game.
   */
  public readonly gameId: string

  /**
   * The name of the game.
   */
  public name: string

  /**
   * The configuration for the game.
   */
  protected _config: TGameConfig
  /**
   * The configuration for the game.
   */
  public get config(): TGameConfig {
    return { ...this._config }
  }

  /**
   * The mission being executed by the participants.
   */
  public readonly mission: TMission

  /**
   * The ID of the mission being executed by the participants.
   */
  public get missionId(): string {
    return this.mission._id
  }

  /**
   * The participants of the game executing the mission.
   */
  protected _participants: TUser[]
  /**
   * The participants of the game executing the mission.
   */
  public get participants(): TUser[] {
    return [...this._participants]
  }

  /**
   * IDs of participants who have been banned from the game.
   */
  protected _banList: string[]
  /**
   * IDs of participants who have been banned from the game.
   */
  public get banList(): string[] {
    return [...this._banList]
  }

  /**
   * The participants of the game executing the mission.
   */
  protected _supervisors: TUser[]
  /**
   * The participants of the game executing the mission.
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
   * The state of the game (unstarted, started, ended).
   */
  protected _state: TGameState
  /**
   * The state of the game (unstarted, started, ended).
   */
  public get state(): TGameState {
    return this._state
  }

  /**
   * The resources available to the participants.
   */
  public abstract get resources(): number

  /**
   * A map of actionIDs to actions compiled from those found in the mission being executed.
   */
  protected actions: Map<string, TMissionAction> = new Map<
    string,
    TMissionAction
  >()

  /**
   * Determines whether the given action can currently be executed in the game.
   * @param action The action in question.
   * @returns Whether the action is ready to be executed in the game.
   */
  public readyToExecute(action: TMissionAction): boolean {
    return action.node.readyToExecute && action.resourceCost <= this.resources
  }

  /**
   * ** Note: Use the static method `launch` to create a new game with a new game ID. **
   */
  public constructor(
    gameId: string,
    name: string,
    config: Partial<TGameConfig>,
    mission: TMission,
    participants: TUser[],
    banList: string[],
    supervisors: TUser[],
  ) {
    this.gameId = gameId
    this.name = name
    this._config = {
      ...Game.DEFAULT_CONFIG,
      ...config,
    }
    this.mission = mission
    this._state = 'unstarted'
    this._participants = participants
    this._banList = banList
    this._supervisors = supervisors
    this.mapActions()
  }

  /**
   * Loops through all the nodes in the mission, and each action in a node, and maps the actionId to the action in the field "actions".
   */
  protected abstract mapActions(): void

  /**
   * Checks if the given user is currently in the game (Whether as a participant or as a supervisor).
   * @param user The user to check.
   * @returns Whether the given user is joined into the game.
   */
  public abstract isJoined(user: TUser): boolean

  /**
   * Checks if the given user is currently a participant in the game.
   * @param user The user to check.
   * @returns Whether the given user is a participant of the game.
   */
  public abstract isParticipant(user: TUser): boolean

  /**
   * Checks if the given user is currently a supervisor in the game.
   * @param user The user to check.
   * @returns Whether the given user is a supervisor in the game.
   */
  public abstract isSupervisor(user: TUser): boolean

  /**
   * Converts the Game object to JSON.
   * @returns A JSON representation of the game.
   */
  public abstract toJson(): TGameJson

  /**
   * Converts the Game object to basic JSON.
   * @returns A basic (Limited) JSON representation of the game.
   */
  public abstract toBasicJson(): TGameBasicJson

  /**
   * The endpoint for accessing games on the API.
   */
  public static readonly API_ENDPOINT: string = '/api/v1/games'

  /**
   * Default value for the game configuration.
   */
  public static get DEFAULT_CONFIG(): TGameConfig {
    return {
      accessibility: 'public',
      autoAssign: true,
      infiniteResources: false,
      effectsEnabled: true,
    }
  }
}

/**
 * The accessiblity of the game to students.
 * @option 'public' The game is accessible to all students.
 * @option 'id-required' The game is accessible to students with the game ID.
 * @option 'invite-only' The game is accessible to students with an invite.
 */
export type TGameAccessibility = 'public' | 'id-required' | 'invite-only'

/**
 * Configuration options for a game, customizing the experience.
 */
export type TGameConfig = {
  /**
   * The accessiblity of the game to students.
   * @default 'public'
   */
  accessibility: TGameAccessibility
  /**
   * Whether students will be auto-assigned to their roles.
   * @default true
   */
  autoAssign: boolean
  /**
   * Whether resources will be infinite in the game.
   * @default false
   */
  infiniteResources: boolean
  /**
   * Whether effects will be enabled in the game.
   * @default true
   */
  effectsEnabled: boolean
}

/**
 * JSON representation of a game.
 */
export type TGameJson = {
  /**
   * The ID of the game.
   */
  gameId: string
  /**
   * The state of the game (unstarted, started, ended).
   */
  state: TGameState
  /**
   * The name of the game.
   */
  name: string
  /**
   * The configuration for the game.
   */
  config: TGameConfig
  /**
   * The mission being executed by the participants.
   */
  mission: TCommonMissionJson
  /**
   * The participants of the game executing the mission.
   */
  participants: TCommonUserJson[]
  /**
   * The IDs of participants who have been banned from the game.
   */
  banList: string[]
  /**
   * The supervisors joined in the game.
   */
  supervisors: TCommonUserJson[]
  /**
   * The resources available to the participants.
   */
  resources: number | 'infinite'
}

/**
 * A more basic (limited) JSON representation of a game.
 */
export type TGameBasicJson = {
  /**
   * The ID of the game.
   */
  gameId: string
  /**
   * The ID of the mission being executed by the participants.
   */
  missionId: string
  /**
   * The name of the game.
   */
  name: string
  /**
   * The configuration for the game.
   */
  config: TGameConfig
  /**
   * The IDs of the participants of the game.
   */
  participantIds: string[]
  /**
   * The IDs of the participants banned from the game.
   * @note Empty if the user does not have supervisor permissions.
   */
  banList: string[]
  /**
   * The IDs of the supervisors of the game.
   */
  supervisorIds: string[]
}

/**
 * The state of a game.
 */
export type TGameState = 'unstarted' | 'started' | 'ended'

/**
 * The method of joining a game.
 */
export type TGameJoinMethod = 'participant' | 'supervisor' | 'not-joined'
