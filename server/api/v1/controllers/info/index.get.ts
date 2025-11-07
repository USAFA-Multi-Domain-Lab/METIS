import { MetisServer } from '../../../..'
import { ApiResponse } from '../../library/ApiResponse'

/**
 * This will retrieve the info about METIS.
 * @param request The express request.
 * @param response The express response.
 * @returns The info in JSON format.
 */
export const getInfo: TExpressHandler = (request, response) =>
  ApiResponse.sendJson(response, {
    name: MetisServer.PROJECT_NAME,
    description: MetisServer.PROJECT_DESCRIPTION,
    version: MetisServer.PROJECT_VERSION,
  })
