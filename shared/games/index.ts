import { TCommonMission, TCommonMissionJson } from 'metis/missions'
import { TCommonMissionAction } from '../missions/actions'
import { TCommonMissionNode } from '../missions/nodes'
import { TCommonUserJson } from '../users'

export interface IGameJson {
  gameID: string
  mission: TCommonMissionJson
  participants: TCommonUserJson[]
  resources: number
}

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
   * The mission being executed by the participants.
   */
  public readonly mission: TMission

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
    mission: TMission,
    participants: TParticpant[],
  ) {
    this.gameID = gameID
    this.mission = mission
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
  public abstract toJson(): IGameJson

  public static API_ENDPOINT: string = '/api/v1/games'
}
