import type { Config as OriginalConfig } from '@jest/types'
import MetisServer from 'metis/server'

/**
 * Global type declarations for test environment
 */
declare global {
  /**
   * @see {@link useMetisServer}
   */
  var useMetisServer: () => Promise<MetisServer>

  /**
   * Enhanced GlobalConfig type with proper projects typing
   */
  interface GlobalConfig extends OriginalConfig.GlobalConfig {
    projects: OriginalConfig.ProjectConfig[]
  }
}

export {}
