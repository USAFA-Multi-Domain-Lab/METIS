import type { TClientEvents } from '../types'
import { WsEmittedError } from './WsEmittedError'

/**
 * An error sent in the ServerConnection class from the client to the server.
 */
export class ClientEmittedError extends WsEmittedError {
  /**
   * Converts this error to a JSON payload.
   * @returns The JSON representation of this error.
   */
  public toJson(): TClientEvents['error'] {
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
  public static fromJson({
    code,
    message,
  }: TClientEvents['error']): ClientEmittedError {
    return new ClientEmittedError(code, message)
  }
}
