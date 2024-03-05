import {
  TClientEvents,
  TClientMethod,
  TRequestEvent,
  TServerEvents,
} from './data'

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

export interface IServerEmittedErrorOptions {
  /**
   * The message for this error given to the client, describing the error the occurred in more detail than what is provided by the error code. Defaults to the default error message for the given code.
   */
  message?: string
  /**
   * The request that caused the error, if any.
   */
  request?: TRequestEvent<TClientMethod>
}

/**
 * An error sent in the ClientConnection class from the server to the client.
 */
export class ServerEmittedError extends WSEmittedError {
  /**
   * The request that caused the error, if any.
   */
  public request?: TRequestEvent<TClientMethod>

  public constructor(code: number, options: IServerEmittedErrorOptions = {}) {
    // Extract options.
    let { message, request } = options

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
    this.request = request
  }

  /**
   * Converts this error to a JSON payload.
   * @returns {TServerData<'error'>} The JSON representation of this error.
   */
  public toJSON(): TServerEvents['error'] {
    return {
      method: 'error',
      code: this.code,
      message: this.message,
      request: this.request,
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
   * Code for a client requesting to open a node that cannot be found.
   */
  public static readonly CODE_NODE_NOT_FOUND: number = 20000
  /**
   * Code for a client requesting to open a node that cannot be opened.
   */
  public static readonly CODE_NODE_NOT_OPENABLE: number = 20001
  /**
   * Code for a client requesting to execute an action that cannot be found.
   */
  public static readonly CODE_ACTION_NOT_FOUND: number = 20002
  /**
   * Code for a client requesting to execute an action on a node that is not executable.
   */
  public static readonly CODE_NODE_NOT_EXECUTABLE: number = 20003
  /**
   * Code for a client requesting to execute an action on a node that is not yet revealed.
   */
  public static readonly CODE_NODE_NOT_REVEALED: number = 20004
  /**
   * Code for a client request failing due to a server-side general error.
   */
  public static readonly CODE_SERVER_ERROR: number = 30000

  public static readonly DEFAULT_MESSAGES: { [code: number]: string } = {
    [ServerEmittedError.CODE_UNKNOWN]: 'An unknown error occurred.',
    [ServerEmittedError.CODE_INVALID_DATA]: 'Data sent was invalid.',
    [ServerEmittedError.CODE_DUPLICATE_CLIENT]:
      'You are already connected via another tab.',
    [ServerEmittedError.CODE_NODE_NOT_FOUND]: 'Node not found.',
    [ServerEmittedError.CODE_NODE_NOT_OPENABLE]: 'Node not openable.',
    [ServerEmittedError.CODE_ACTION_NOT_FOUND]: 'Action not found.',
    [ServerEmittedError.CODE_NODE_NOT_EXECUTABLE]: 'Node not executable.',
    [ServerEmittedError.CODE_NODE_NOT_REVEALED]: 'Node not revealed.',
    [ServerEmittedError.CODE_SERVER_ERROR]: 'Server error.',
  }

  /**
   * Converts JSON data to a new ClientError object.
   * @param {TServerData<'error'>} json The JSON to convert.
   * @returns {ServerEmittedError} The new ServerEmittedError object.
   * @throws {Error} If the JSON data is invalid.
   */
  public static fromJSON({
    code,
    message,
    request,
  }: TServerEvents['error']): ServerEmittedError {
    return new ServerEmittedError(code, { message, request })
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
  public toJSON(): TClientEvents['error'] {
    return {
      method: 'error',
      code: this.code,
      message: this.message,
      data: {},
    }
  }

  /**
   * Converts JSON data to a new ClientEmittedError object.
   * @param json The JSON to convert.
   * @returns The new ClientEmittedError object.
   * @throws If the JSON data is invalid.
   */
  public static fromJSON({
    code,
    message,
  }: TClientEvents['error']): ClientEmittedError {
    return new ClientEmittedError(code, message)
  }
}

export default {}
