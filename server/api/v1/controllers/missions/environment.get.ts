import { Request, Response } from 'express-serve-static-core'
import ApiResponse from '../../library/response'

/**
 * This will return the environment of the database that is currently in use.
 * @param request The express request.
 * @param response The express response.
 * @returns The environment.
 */
const getEnvironment = (request: Request, response: Response) => {
  try {
    // Return a successful response with the environment.
    return ApiResponse.sendJson(response, process.env)
  } catch (error: any) {
    // Handle the error.
    ApiResponse.error(error, response)
  }
}

export default getEnvironment
