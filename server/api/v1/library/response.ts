import { Response } from 'express-serve-static-core'
import MetisDatabase from 'metis/server/database'
import { StatusError } from 'metis/server/http'

/**
 * This class handles responses from the API.
 */
export default abstract class ApiResponse {
  /**
   * Sends a JSON response to the client.
   * @param response The response to the request.
   * @param data The data to send to the client.
   * @returns The JSON response to send to the client.
   */
  public static sendJson(response: Response, data: any): Response {
    return response.status(200).json(data)
  }

  /**
   * Sends a file to the client.
   * @param response The response to the request.
   * @param filePath The path to the file to send to the client.
   * @returns The file to send to the client.
   */
  public static sendFile(response: Response, filePath: string): void {
    return response.status(200).sendFile(filePath)
  }

  /**
   * Sends a status to the client.
   * @param response The response to the request.
   * @param status The status to send to the client.
   * @returns The status to send to the client.
   */
  public static sendStatus(response: Response, status: number): Response {
    return response.sendStatus(status)
  }

  /**
   * Handles errors that occur in the API.
   * @param error The error that occurred.
   * @param response The response to the request.
   * @returns The response to send to the client.
   */
  public static error(
    error: Error | StatusError,
    response: Response,
  ): Response {
    // If the error was a validation error, return a 400.
    if (
      error.name === MetisDatabase.ERROR_BAD_DATA ||
      error.message.includes('validation failed')
    ) {
      return response.sendStatus(400)
    }

    // If the error was a duplicate key error, return a 409.
    if (error.message.includes('duplicate key error')) {
      return response.sendStatus(409)
    }

    // Return the appropriate status code if it exists.
    if (error instanceof StatusError) {
      return response.sendStatus(error.status)
    }

    // Otherwise, it's an internal server error, so return a 500.
    return response.sendStatus(500)
  }
}
