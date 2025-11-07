/**
 * Represents an error containing an HTTP status code
 * and a message.
 */
export class StatusError extends Error {
  /**
   * The HTTP status code associated with the error.
   */
  public status: number

  /**
   * @param message The message describing the error.
   * @param status The HTTP status code associated with the error.
   */
  public constructor(message?: string, status?: number) {
    super(message)
    this.status = status !== undefined ? status : 500
  }
}
