import { Request, Response } from 'express-serve-static-core'
import MetisServer from 'metis/server'
import ApiResponse from '../../library/response'

/**
 * This will retrieve the info about METIS.
 * @param request The express request.
 * @param response The express response.
 * @returns The info in JSON format.
 */
const getInfo = (request: Request, response: Response) =>
  ApiResponse.sendJson(response, {
    name: MetisServer.PROJECT_NAME,
    description: MetisServer.PROJECT_DESCRIPTION,
    version: MetisServer.PROJECT_VERSION,
  })

export default getInfo
