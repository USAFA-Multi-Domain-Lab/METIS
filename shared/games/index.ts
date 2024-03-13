import { TCommonMission, TCommonMissionJson } from 'metis/missions'
import { TCommonMissionAction } from '../missions/actions'
import { TCommonMissionNode } from '../missions/nodes'
import { TCommonUserJson } from '../users'

/**
 * Base class for a games. Represents a game being played by participating students in METIS.
 */
export default abstract class Game<
  TParticpant extends { userID: string },
  TMission extends TCommonMission,
  TMissionNode extends TCommonMissionNode,
  TMissionAction extends TCommonMissionAction,
> {
  /**
   * The ID of the game.
   */
  public readonly gameID: string

  /**
   * The name of the game.
   */
  public name: string

  /**
   * The configuration for the game.
   */
  public config: Required<TGameConfig>

  /**
   * The mission being executed by the participants.
   */
  public readonly mission: TMission

  /**
   * The ID of the mission being executed by the participants.
   */
  public get missionID(): string {
    return this.mission.missionID
  }

  /**
   * The participants of the game executing the mission.
   */
  protected _participants: TParticpant[]
  /**
   * The participants of the game executing the mission.
   */
  public get participants(): TParticpant[] {
    return [...this._participants]
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
    gameID: string,
    name: string,
    config: TGameConfig,
    mission: TMission,
    participants: TParticpant[],
  ) {
    this.gameID = gameID
    this.name = name
    this.config = {
      accessibility: 'public',
      autoAssign: true,
      resourcesEnabled: true,
      effectsEnabled: true,
      ...config,
    }
    this.mission = mission
    this._state = 'unstarted'
    this._participants = participants
    this.mapActions()
  }

  /**
   * Loops through all the nodes in the mission, and each action in a node, and maps the actionID to the action in the field "actions".
   */
  protected abstract mapActions(): void

  /**
   * Checks if the given participant is currently in the game.
   * @param participant The participant to check.
   * @returns Whether the given participant is joined into the game.
   */
  public isJoined(participant: TParticpant): boolean {
    for (let user of this._participants) {
      if (user.userID === participant.userID) {
        return true
      }
    }
    return false
  }

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
  public static API_ENDPOINT: string = '/api/v1/games'
}

/**
 * Configuration options for a game, customizing the experience.
 */
export type TGameConfig = {
  /**
   * The accessiblity of the game to students.
   * @option 'public' The game is accessible to all students.
   * @option 'id-required' The game is accessible to students with the game ID.
   * @option 'invite-only' The game is accessible to students with an invite.
   */
  accessibility?: 'public' | 'id-required' | 'invite-only'
  /**
   * Whether students will be auto-assigned to their roles.
   * @default true
   */
  autoAssign?: boolean
  /**
   * Whether resources will be enabled in the game.
   * @default true
   */
  resourcesEnabled?: boolean
  /**
   * Whether effects will be enabled in the game.
   * @default true
   */
  effectsEnabled?: boolean
}

/**
 * JSON representation of a game.
 */
export type TGameJson = {
  /**
   * The ID of the game.
   */
  gameID: string
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
   * The resources available to the participants.
   */
  resources: number
}

/**
 * A more basic (limited) JSON representation of a game.
 */
export type TGameBasicJson = {
  /**
   * The ID of the game.
   */
  gameID: string
  /**
   * The ID of the mission being executed by the participants.
   */
  missionID: string
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
  participantIDs: string[]
}

/**
 * The state of a game.
 */
export type TGameState = 'unstarted' | 'started' | 'ended'
