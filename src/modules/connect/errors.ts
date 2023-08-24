import { TServerData, TClientData } from 'src/modules/connect/data'

/**
 * An abstract class representing an error sent in a web socket connection from one party to another.
 */
export abstract class WSEmittedError {
  /**
   * The code for this error, which are enumerated as static properties in this class.
   */
  public code: number
  /**
   * The message for this error given to the client, describing the error the occurred in more detail than what is provided by the error code.
   */
  public message: string

  /**
   *
   * @param {number} code The code for this error, which are enumerated as static properties in this class.
   * @param {string} message The message for this error given to the client, describing the error the occurred in more detail than what is provided by the error code.
   */
  public constructor(code: number, message: string) {
    this.code = code
    this.message = message
  }
}

/**
 * An error sent in the ClientConnection class from the server to the client.
 */
export class ServerEmittedError extends WSEmittedError {
  public constructor(code: number, message?: string) {
    // Grab default message for the code
    // passed if no message is provided.
    if (message === undefined) {
      let defaultMessage = ServerEmittedError.DEFAULT_MESSAGES[code]

      if (defaultMessage !== undefined) {
        message = defaultMessage
      } else {
        message =
          ServerEmittedError.DEFAULT_MESSAGES[ServerEmittedError.CODE_UNKNOWN]
      }
    }
    super(code, message)
  }

  /**
   * Converts this error to a JSON payload.
   * @returns {TServerData<'error'>} The JSON representation of this error.
   */
  public toJSON(): TServerData<'error'> {
    return {
      method: 'error',
      code: this.code,
      message: this.message,
    }
  }

  /**
   * Code for an unknown error.
   */
  public static readonly CODE_UNKNOWN: number = 10000
  /**
   * Code for invalid data being sent to the server from the client given the method.
   */
  public static readonly CODE_INVALID_DATA: number = 10001
  /**
   * Code for the same client attempting a second connection to the server when another connection for that user already exists.
   */
  public static readonly CODE_DUPLICATE_CLIENT: number = 10002
  /**
   * Code for a client requesting to join a game that cannot be found.
   */
  public static readonly CODE_GAME_NOT_FOUND: number = 20000
  /**
   * Code for a client requesting to join a game when they are already in a game.
   */
  public static readonly CODE_DOUBLE_JOIN: number = 20001
  /**
   * Code for a client request failing due to a server-side general error.
   */
  public static readonly CODE_SERVER_ERROR: number = 30000

  public static readonly DEFAULT_MESSAGES: { [code: number]: string } = {
    [ServerEmittedError.CODE_UNKNOWN]: 'An unknown error occurred.',
    [ServerEmittedError.CODE_INVALID_DATA]: 'Data sent was invalid.',
    [ServerEmittedError.CODE_DUPLICATE_CLIENT]:
      'You are already connected via another tab.',
    [ServerEmittedError.CODE_GAME_NOT_FOUND]: 'Game not found.',
    [ServerEmittedError.CODE_DOUBLE_JOIN]: 'You are already in a game.',
    [ServerEmittedError.CODE_SERVER_ERROR]: 'Server error.',
  }

  /**
   * Converts JSON data to a new ClientError object.
   * @param {TServerData<'error'>} json The JSON to convert.
   * @returns {ServerEmittedError} The new ServerEmittedError object.
   * @throws {Error} If the JSON data is invalid.
   */
  public static fromJSON(json: TServerData<'error'>): ServerEmittedError {
    return new ServerEmittedError(json.code, json.message)
  }
}

/**
 * An error sent in the ServerConnection class from the client to the server.
 */
export class ClientEmittedError extends WSEmittedError {
  /**
   * Converts this error to a JSON payload.
   * @returns {TClientData<'error'>} The JSON representation of this error.
   */
  public toJSON(): TClientData<'error'> {
    return {
      method: 'error',
      code: this.code,
      message: this.message,
    }
  }

  /**
   * Converts JSON data to a new ClientEmittedError object.
   * @param {TClientData<'error'>} json The JSON to convert.
   * @returns {ClientEmittedError} The new ClientEmittedError object.
   * @throws {Error} If the JSON data is invalid.
   */
  public static fromJSON(json: TClientData<'error'>): ClientEmittedError {
    return new ServerEmittedError(json.code, json.message)
  }
}

export default {}
