import { MetisServer } from '@server/MetisServer'
import fs from 'fs'
import path from 'path'
import { ApiResponse } from '../../library/ApiResponse'

/**
 * This will retrieve the credits.
 * @param request The express request.
 * @param response The express response.
 * @returns The credits in JSON format.
 */
export const getCredits: TExpressHandler = (request, response) => {
  try {
    // This is the path to the credits.
    let creditsPath = path.join(MetisServer.APP_DIR, '../docs/credits.md')

    // This is the credits.
    let credits: string = fs.readFileSync(creditsPath, {
      encoding: 'utf8',
    })

    // This is the response.
    return ApiResponse.sendJson(response, credits)
  } catch (error: any) {
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}
