import type { launchSessionCore } from './launchSessionCore'

/**
 * A transport-agnostic reason a session launch was rejected. Each caller
 * (REST controller, WS play-test handler) maps these to its own error
 * representation rather than sharing an HTTP- or WS-specific error type.
 */
export type TLaunchSessionErrorReason =
  /** The requested mission does not exist. */
  | 'mission-not-found'
  /** The provided session config is invalid (e.g. a missing/unknown force). */
  | 'invalid-config'

/**
 * Thrown by {@link launchSessionCore} when a launch is rejected for a reason
 * the caller can meaningfully surface to the client.
 */
export class LaunchSessionError extends Error {
  /**
   * The transport-agnostic reason the launch was rejected.
   */
  public readonly reason: TLaunchSessionErrorReason

  /**
   * @param reason The reason the launch was rejected.
   * @param message A human-readable description of the rejection.
   */
  public constructor(reason: TLaunchSessionErrorReason, message: string) {
    super(message)
    this.name = 'LaunchSessionError'
    this.reason = reason
  }
}
