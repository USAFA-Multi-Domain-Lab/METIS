/**
 * Global type declarations for test environment
 */

import MetisServer from 'metis/server'

declare global {
  /**
   * Namespace for integration-test-only globals.
   * These are initialized in tests/integration/setup.ts
   */
  var integration: {
    readonly server: MetisServer
  }
}

export {}
