import { DateToolbox } from 'metis/toolbox'

/**
 * Creates a universal standard for logging to
 * the console for the METIS client.
 */
export class Logging {
  /**
   * Whether the app is in debug mode of not.
   * @note This is set by the global context.
   */
  public static debugMode: boolean = false

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
  public static info(message: string, options: TLoggingOptions = {}): void {
    // Parse the options.
    let { context, properties, verboseAppendix } = {
      ...Logging.DEFAULT_OPTIONS,
      ...options,
    }
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
    // Include the verbose appendix if the debug
    // mode is enabled, and the appendix is not empty.
    if (this.debugMode && verboseAppendix) console.log(verboseAppendix)
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
    options: TLoggingOptions = {},
  ): void {
    // Parse the options.
    let { context, properties, verboseAppendix } = {
      ...Logging.DEFAULT_OPTIONS,
      ...options,
    }
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
    // Include the verbose appendix if the debug
    // mode is enabled, and the appendix is not empty.
    if (this.debugMode && verboseAppendix) console.log(verboseAppendix)

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

  /**
   * Default options for logging.
   */
  public static get DEFAULT_OPTIONS(): Required<TLoggingOptions> {
    return {
      context: Logging.CONTEXT_METIS,
      properties: [],
      verboseAppendix: '',
    }
  }
}

/* -- TYPES -- */

/**
 * Options for `Logging` methods that are responsible
 * for the actual logging process.
 */
export type TLoggingOptions = {
  /**
   * The context of the message.
   * @default `Logging.DEFAULT_OPTIONS.context`.
   */
  context?: string
  /**
   * Extra properties to log, other than the time and type.
   * @default `Logging.DEFAULT_OPTIONS.properties`.
   */
  properties?: string[]
  /**
   * A message added to the end of the main message
   * passed, which will only be shown if the verbose
   * logging is enabled.
   * @default `Logging.DEFAULT_OPTIONS.verboseAppendix`.
   */
  verboseAppendix?: string
}
