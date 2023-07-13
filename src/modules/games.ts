import { v4 as generateHash } from 'uuid'
import { IMissionJSON, Mission } from './missions'
import { IUserJSON, User } from './users'
import axios, { AxiosError, AxiosResponse } from 'axios'
import context from './context'

export interface IGameJSON {
  gameID: string
  mission: IMissionJSON
  participants: Array<IUserJSON>
}

export class Game {
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
   * Checks if the given participant is currently in the game.
   * @param {User} participant The participant to check.
   * @returns Whether the given participant is joined into the game.
   */
  public isJoined(participant: User): boolean {
    for (let user of this._participants) {
      if (user.userID === participant.userID) {
        return true
      }
    }
    return false
  }

  /**
   * Has the given participant join the game.
   * @param participant {User} The participant joining the game.
   */
  public join(participant: User): Promise<void> {
    return new Promise<void>(
      (resolve: () => void, reject: (error: AxiosError) => void): void => {
        // If the context is react, then we need
        // to make a request to the server. The
        // server needs to handle the joining of
        // the game, not the client.
        if (context === 'react') {
          throw new Error('Client-side joining of a game is not yet supported.')
        }
        // If the context is express, then we need
        // to join the game here.
        else if (context === 'express') {
          for (let user of this._participants) {
            // If the user is already in the game, then
            // we cannot add them again.
            if (user.userID === participant.userID) {
              return reject(new AxiosError('User is already in the game.'))
            }
          }
        }

        // Add the participant to the game
        // and resolve the promise.
        this._participants.push(participant)
        return resolve()
      },
    )
  }

  /**
   * Has the given participant quit the game.
   * @param participantID {string} The ID of the participant quitting the game.
   * @returns {Promise<void>} A promise of the game quitting.
   */
  public async quit(participantID: string): Promise<void> {
    return new Promise<void>(
      (resolve: () => void, reject: (error: AxiosError) => void): void => {
        // If the context is react, then we need
        // to make a request to the server. The
        // server needs to handle the quitting of
        // the game, not the client.
        if (context === 'react') {
          axios
            .post<void>(`${Game.API_ENDPOINT}/quit/`)
            .then(resolve)
            .catch((error: AxiosError) => {
              console.error('Failed to quit game.')
              console.error(error)
              reject(error)
            })
        }
        // If the context is express, then we need
        // to quit the game here.
        else if (context === 'express') {
          for (let user of this._participants) {
            // If the user is in the game, then
            // we can remove them.
            if (user.userID === participantID) {
              this._participants = this._participants.filter(
                (user: User) => user.userID !== participantID,
              )
              return resolve()
            }
          }

          // If the user is not in the game, then
          // we cannot remove them.
          return reject(new AxiosError('User is not in the game.'))
        }
      },
    )
  }

  /**
   * Converts the Game object to JSON.
   * @returns {IGameJSON} A JSON representation of the game.
   */
  public toJSON(): IGameJSON {
    return {
      gameID: this.gameID,
      mission: this.mission.toJSON(),
      participants: this.participants.map((user: User) => user.toJSON()),
    }
  }

  public static API_ENDPOINT: string = '/api/v1/games'

  /**
   * Converts IGameJSON into a Game object.
   * @param {IGameJSON} json The json to be converted.
   * @returns {Game} The Game object.
   */
  public static fromJSON(json: IGameJSON): Game {
    let mission: Mission = Mission.fromJSON(json.mission)
    let participants: Array<User> = json.participants.map(
      (userJSON: IUserJSON) => User.fromJSON(userJSON),
    )
    return new Game(json.gameID, mission, participants)
  }

  /**
   * Launches a new game with a new game ID.
   * @param mission {Mission} The mission being executed in the game.
   * @returns {Promise<Game>} A promise of a new game with a new game ID. The mission in the game will be a different instance than the mission passed.
   */
  public static async launch(mission: Mission): Promise<Game> {
    return new Promise<Game>(
      (
        resolve: (game: Game) => void,
        reject: (error: AxiosError) => void,
      ): void => {
        // If the context is react, then we need
        // to make a request to the server. The
        // server needs to generate the game, not
        // the client.
        if (context === 'react') {
          axios
            .post<IGameJSON>(`${Game.API_ENDPOINT}/launch/`, {
              missionID: mission.missionID,
            })
            .then((response: AxiosResponse<IGameJSON>) => {
              let game: Game = Game.fromJSON(response.data)
              return resolve(game)
            })
            .catch((error: AxiosError) => {
              console.error('Failed to launch mission.')
              console.error(error)
              return reject(error)
            })
        }
        // If the context is express, then we need
        // to generate the new game here.
        else if (context === 'express') {
          let game: Game = new Game(generateHash(), mission, [])
          return resolve(game)
        }
      },
    )
  }
}

export default {}
