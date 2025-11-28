import { MetisServer } from '@server/MetisServer'
import fs from 'fs'
import path from 'path'
import { ApiResponse } from '../../library/ApiResponse'

/**
 * This will retrieve the changelog.
 * @param request The express request.
 * @param response The express response.
 * @returns The changelog in JSON format.
 */
export const getChangelog: TExpressHandler = (request, response) => {
  try {
    // This is the path to the changelog.
    let changelogPath = path.join(MetisServer.APP_DIR, '../docs/changelog.md')

    // This is the changelog.
    let changelog: string = fs.readFileSync(changelogPath, {
      encoding: 'utf8',
    })

    // This is the response.
    return ApiResponse.sendJson(response, changelog)
  } catch (error: any) {
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}
