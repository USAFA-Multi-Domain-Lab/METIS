import { DateToolbox } from '../../../shared/toolbox/dates'

/**
 * Creates a universal standard for logging to
 * the console for the METIS client.
 */
export default class Logging {
  /**
   * Logs information to the console.
   * @param message The message to log, if any.
   * @param context The context of the message. Defaults to `Logging.CONTEXT_METIS`.
   * @param properties Extra properties to log, other than the time and type. Defaults to `[]`.
   * @example
   * ```typescript
   * // Log a message to the console regarding a request
   * // in the WebSocket system to open a node within a
   * // session.
   * Logging.info(
   *     "Requesting to open 'Initial Access'...",
   *     Logging.CONTEXT_WS,
   *     ['request-open-node']
   * )
   *
   * // Output:
   * // [07:54:10][WS]['request-open-node'] Requesting to open 'Initial Access'...
   * ```
   */
  public static info(
    message: string,
    context: string = Logging.CONTEXT_METIS,
    properties: string[] = [],
  ): void {
    // Combine all properties.
    properties = [DateToolbox.nowFormatted, context, ...properties]
    // Format all properties.
    let allPropertiesFormatted = properties
      .map((value) => `[${value}]`)
      .join('')
    // Generate an output string.
    let output = `${allPropertiesFormatted} ${message}`

    // Log the output to the console.
    console.log(output)
  }

  /**
   * Logs an error to the console.
   * @param message The message to log, if any.
   * @param context The context of the message. Defaults to `this.CONTEXT_METIS`.
   * @param properties Extra properties to log, other than the time and type. Defaults to `[]`.
   * @example
   * ```typescript
   * // Log an error to the console regarding a failed
   * // request to open a node within a session.
   * Logging.error(
   *     "Failed to open 'Initial Access'...",
   *     Logging.CONTEXT_WS,
   *     ['request-open-node']
   * )
   *
   * // Output:
   * // [07:54:10][WS]['request-open-node'] Failed to open 'Initial Access'...
   * ```
   */
  public static error(
    error: string | Error,
    context: string = this.CONTEXT_METIS,
    properties: string[] = [],
  ): void {
    // Convert the error to a string.
    let message = error instanceof Error ? error.message : error
    // Combine all properties.
    properties = [DateToolbox.nowFormatted, context, ...properties]
    // Format all properties.
    let allPropertiesFormatted = properties
      .map((value) => `[${value}]`)
      .join('')
    // Generate an output string.
    let output = `${allPropertiesFormatted} ${message}`

    // Log the output to the console.
    console.error(output)

    // If the error is an instance of `Error`, log the stack trace.
    if (error instanceof Error) {
      console.error(error.stack)
    }
  }

  /**
   * Global logging context.
   */
  public static readonly CONTEXT_METIS = 'METIS'

  /**
   * Context for the WebSocket system.
   */
  public static readonly CONTEXT_WS = 'WS'
}
