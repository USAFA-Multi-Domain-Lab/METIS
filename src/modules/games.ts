import { v4 as generateHash } from 'uuid'
import { IMissionJSON, Mission } from './missions'
import { IUserJSON, User } from './users'
import axios, { AxiosError, AxiosResponse } from 'axios'
import context from './context'
import { MissionNodeAction } from './mission-node-actions'
import { MissionNode } from './mission-nodes'

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
   * A map of actionIDs to actions compiled from those found in the mission being executed.
   */
  private actions: Map<string, MissionNodeAction> = new Map<
    string,
    MissionNodeAction
  >()

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
    this.mapActions()
  }

  /**
   * Loops through all the nodes in the mission, and each action in a node, and maps the actionID to the action in the field "actions".
   */
  private mapActions(): void {
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
          let error: AxiosError = new AxiosError('User is not in the game.')
          return reject(error)
        }
      },
    )
  }

  /**
   * Opens the given node, making its children visible.
   * @param {nodeID} string The ID of the node to be opened.
   * @returns {Promise<void>} A promise of the action being executed.
   */
  public async open(nodeID: string): Promise<void> {
    return new Promise<void>(
      (resolve: () => void, reject: (error: AxiosError) => void): void => {
        // If the context is react, then we need
        // to make a request to the server. The
        // server needs to handle the opening of
        // the node, not the client.
        if (context === 'react') {
          axios
            .post<void>(`${Game.API_ENDPOINT}/open/`, { nodeID })
            .then(resolve)
            .catch((error: AxiosError) => {
              console.error('Failed to open node.')
              console.error(error)
              reject(error)
            })
        }
        // If the context is express, then we need
        // to execute the action here.
        else if (context === 'express') {
          // Find the node, given the ID.
          let node: MissionNode | undefined = this.mission.nodes.get(nodeID)

          // If the node is undefined, then reject
          // with a 404 error.
          if (node === undefined) {
            let error: AxiosError = new AxiosError('Node not found.')
            error.status = 404
            return reject(error)
          }

          // If the node is executable, then reject
          // with a 401 error.
          if (!node.openable) {
            let error: AxiosError = new AxiosError('Node is not openable.')
            error.status = 401
            return reject(error)
          }

          // Open the node.
          node.open()
        }
      },
    )
  }

  /**
   * Executes the given action on the corresponding node.
   * @param {actionID} string The ID of the action to be executed.
   * @returns {Promise<void>} A promise of the action being executed.
   */
  public async execute(actionID: string): Promise<void> {
    return new Promise<void>(
      (resolve: () => void, reject: (error: AxiosError) => void): void => {
        // If the context is react, then we need
        // to make a request to the server. The
        // server needs to handle the execution of
        // the action, not the client.
        if (context === 'react') {
          axios
            .post<void>(`${Game.API_ENDPOINT}/execute/`, { actionID })
            .then(resolve)
            .catch((error: AxiosError) => {
              console.error('Failed to execute action.')
              console.error(error)
              reject(error)
            })
        }
        // If the context is express, then we need
        // to execute the action here.
        else if (context === 'express') {
          // Find the action given the ID.
          let action: MissionNodeAction | undefined = this.actions.get(actionID)

          // If the action is undefined, then reject
          // with a 404 error.
          if (action === undefined) {
            let error: AxiosError = new AxiosError('Action not found.')
            error.status = 404
            return reject(error)
          }

          // If the action is not executable, then
          // reject with a 401 error.
          if (!action.node.executable) {
            let error: AxiosError = new AxiosError('Node is not executable.')
            error.status = 401
            return reject(error)
          }

          // If the node is not revealed, then
          // reject with a 401 error.
          if (action.node.revealed) {
            let error: AxiosError = new AxiosError('Node is not revealed.')
            error.status = 401
            return reject(error)
          }

          // Execute the action.
          action.execute(false, resolve, () => {
            reject(new AxiosError('Failed to execute action.'))
          })
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
      mission: this.mission.toJSON(true),
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
