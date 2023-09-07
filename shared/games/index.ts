import Mission, { IMissionJSON } from 'metis/missions'
import { IUserJSON } from 'metis/users'
import context from 'metis/context'
import MissionNodeAction from 'metis/missions/actions'
import axios, { AxiosError } from 'axios'

export interface IGameJSON {
  gameID: string
  mission: IMissionJSON
  participants: Array<IUserJSON>
}

/**
 * Base class for a games. Represents a game being played by participating students in METIS.
 */
export default abstract class Game<TParticpant extends { userID: string }> {
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
  protected _participants: Array<TParticpant>

  /**
   * The participants of the game executing the mission.
   */
  public get participants(): Array<TParticpant> {
    return [...this._participants]
  }

  /**
   * A map of actionIDs to actions compiled from those found in the mission being executed.
   */
  protected actions: Map<string, MissionNodeAction> = new Map<
    string,
    MissionNodeAction
  >()

  /**
   * ** Note: Use the static method `launch` to create a new game with a new game ID. **
   */
  public constructor(
    gameID: string,
    mission: Mission,
    participants: Array<TParticpant>,
  ) {
    this.gameID = gameID
    this.mission = mission
    this._participants = participants
    this.mapActions()
  }

  /**
   * Loops through all the nodes in the mission, and each action in a node, and maps the actionID to the action in the field "actions".
   */
  protected mapActions(): void {
    // Initialize the actions map.
    this.actions = new Map<string, MissionNodeAction>()

    // Loops through and maps each action.
    this.mission.nodes.forEach((node) => {
      node.actions.forEach((action) => {
        this.actions.set(action.actionID, action)
      })
    })
  }

  /**
   * Checks if the given participant is currently in the game.
   * @param {User} participant The participant to check.
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
                (user: TParticpant) => user.userID !== participantID,
              )
              return resolve()
            }
          }

          // If the user is not in the game, then
          // we cannot remove them.
          let error: AxiosError = new AxiosError('User is not in the game.')
          return reject(error)
        }
      },
    )
  }

  /**
   * Converts the Game object to JSON.
   * @returns {IGameJSON} A JSON representation of the game.
   */
  public abstract toJSON(): IGameJSON

  public static API_ENDPOINT: string = '/api/v1/games'
}
