import { ServerTargetEnvironment } from '@server/target-environments/ServerTargetEnvironment'
import { ApiResponse } from '../../library/ApiResponse'
/**
 * This will retrieve all target environments.
 * @param request The express request.
 * @param response The express response.
 * @returns The target environments in JSON format.
 */
export const getTargetEnvironments: TExpressHandler = (request, response) =>
  ApiResponse.sendJson(response, ServerTargetEnvironment.REGISTRY.toJson())
