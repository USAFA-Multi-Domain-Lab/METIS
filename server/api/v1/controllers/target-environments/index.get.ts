import { Request, Response } from 'express-serve-static-core'
import ServerTargetEnvironment from 'metis/server/target-environments'
import ApiResponse from '../../library/response'
/**
 * This will retrieve all target environments.
 * @param request The express request.
 * @param response The express response.
 * @returns The target environments in JSON format.
 */
const getTargetEnvironments = (request: Request, response: Response) =>
  ApiResponse.sendJson(response, ServerTargetEnvironment.getAllJson())

export default getTargetEnvironments
