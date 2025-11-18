import type { TargetEnvContext } from './TargetEnvContext'

/**
 * A simple error indicating that a callback was made
 * to an outdated {@link TargetEnvContext} instance.
 */
export class OutdatedContextError extends Error {
  public constructor(message: string) {
    super(message)
    this.name = 'OutdatedContextError'
  }
}
