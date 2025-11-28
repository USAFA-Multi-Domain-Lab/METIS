import zod from 'zod'
import type { TTargetEnvConfig } from './types'

/**
 * Represents the configuration for a target environment.
 */
export class TargetEnvConfig {
  /**
   * The schema for validating `TTargetEnvConfig` objects.
   */
  public static schema = zod.object({
    /**
     * The unique identifier for the configuration.
     */
    _id: zod.string().min(1, 'Config _id cannot be empty'),
    /**
     * The name of the configuration.
     */
    name: zod.string().min(1, 'Config name cannot be empty'),
    /**
     * The target environment identifier associated with the configuration.
     */
    targetEnvId: zod.string().min(1, 'targetEnvId cannot be empty'),
    /**
     * A description of the configuration.
     */
    description: zod.string().optional(),
    /**
     * The variables associated with the configuration.
     * On the server, this contains all variables including sensitive ones.
     * On the client, this should be an empty object to avoid exposing secrets.
     */
    data: zod.record(zod.string(), zod.unknown()).default({}),
  })

  /**
   * The schema for an array of `TTargetEnvConfig` objects.
   */
  public static arraySchema = zod.array(TargetEnvConfig.schema)

  /**
   * Sets the target environment ID for each configuration in the array.
   * @param configs Target environment configurations
   * @param targetEnvId The target environment ID to set
   * @returns Updated target environment configurations with the targetEnvId set
   */
  public static setTargetEnvIds(
    configs: TTargetEnvConfig[],
    targetEnvId: string,
  ): TTargetEnvConfig[] {
    return configs.map((config) => ({
      ...config,
      targetEnvId,
    }))
  }

  /**
   * Converts a TTargetEnvConfig to a JSON-safe version for client consumption.
   * @param config The target environment configuration
   * @returns A JSON-safe version of the target environment configuration
   */
  public static toJson(config: TTargetEnvConfig): TTargetEnvConfig {
    return {
      ...config,
      // Never send sensitive config data to client
      data: {},
    }
  }
}
