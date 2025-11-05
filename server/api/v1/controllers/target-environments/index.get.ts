import type { Request, Response } from 'express-serve-static-core'
import { ServerTargetEnvironment } from '../../../../target-environments'
import { ApiResponse } from '../../library'
/**
 * This will retrieve all target environments.
 * @param request The express request.
 * @param response The express response.
 * @returns The target environments in JSON format.
 */
const getTargetEnvironments = (request: Request, response: Response) =>
  ApiResponse.sendJson(response, ServerTargetEnvironment.REGISTRY.toJson())

export default getTargetEnvironments
