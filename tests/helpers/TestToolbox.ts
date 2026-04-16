import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'

/**
 * Toolbox class for test utilities.
 */
export abstract class TestToolbox {
  /**
   * Generates a short random ID for test resource naming.
   * @returns A short random string ID.
   */
  public static generateRandomId = () =>
    StringToolbox.generateRandomId().substring(0, 8)

  /**
   * Default password for test users.
   */
  public static readonly DEFAULT_PASSWORD = 'ValidPassw0rd!'
}
