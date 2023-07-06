import { v4 as generateHash } from 'uuid'
import { Mission } from './missions'
import { User } from './users'
import { AxiosError } from 'axios'
import context from './context'

export interface IGameJSON {
  gameID: string
}

export default class Game {
  /**
   * The ID of the game.
   */
  public readonly gameID: string

  /**
   * The mission being executed by the participants.
   */
  public readonly mission: Mission

  /**
   * The participants of the game executing the mission.
   */
  private _participants: Array<User>

  /**
   * The participants of the game executing the mission.
   */
  public get participants(): Array<User> {
    return [...this._participants]
  }

  /**
   * ** Note: Use the static method `launch` to create a new game with a new game ID. **
   */
  public constructor(
    gameID: string,
    mission: Mission,
    participants: Array<User>,
  ) {
    this.gameID = gameID
    this.mission = mission
    this._participants = participants
  }

  /**
   * Launches a new game with a new game ID.
   * @param mission {Mission} The mission being executed in the game.
   * @param participants {Array<User>} The participants of the game executing the mission.
   * @returns {Promise<Game>} A promise of a new game with a new game ID.
   */
  public static async launch(
    mission: Mission,
    participants: Array<User>,
  ): Promise<Game> {
    return new Promise<Game>(
      (
        resolve: (game: Game) => void,
        reject: (error: AxiosError) => void,
      ): void => {
        if (context === 'react') {
        } else if (context === 'express') {
          let game: Game = new Game(generateHash(), mission, participants)
          return resolve(new Game(generateHash(), mission, participants))
        }
      },
    )
  }
}
