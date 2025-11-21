import { ServerTargetEnvironment } from '@server/target-environments/ServerTargetEnvironment'
import type { NextFunction, Request, Response } from 'express-serve-static-core'

/**
 * Middleware that validates the target environment configurations
 * provided in the request body when launching a session.
 */
export const validateTargetEnvConfigs = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  const { targetEnvConfigs } = request.body

  // If targetEnvConfigs is provided, validate the target environment IDs and config IDs
  if (targetEnvConfigs && typeof targetEnvConfigs === 'object') {
    const allTargetEnvs = ServerTargetEnvironment.REGISTRY.getAll()
    const validEnvIds = new Set(allTargetEnvs.map((env) => env._id))

    // Validate each target environment ID in the map
    for (const [targetEnvId, configId] of Object.entries(targetEnvConfigs)) {
      // Check if target environment exists
      if (!validEnvIds.has(targetEnvId)) {
        response.sendStatus(400)
        return
      }

      // Check if config ID is a non-empty string
      if (typeof configId !== 'string' || configId.length === 0) {
        response.sendStatus(400)
        return
      }

      // Optionally: Verify the config exists in the target environment
      const targetEnv = allTargetEnvs.find((env) => env._id === targetEnvId)
      if (targetEnv && !targetEnv.configs.find((cfg) => cfg._id === configId)) {
        response.sendStatus(400)
        return
      }
    }
  }

  return next()
}

export default { validateTargetEnvConfigs }
