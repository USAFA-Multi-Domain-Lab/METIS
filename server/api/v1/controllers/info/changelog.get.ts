import { Request, Response } from 'express-serve-static-core'
import fs from 'fs'
import path from 'path'
import ApiResponse from '../../library/response'
/**
 * This will retrieve the changelog.
 * @param request The express request.
 * @param response The express response.
 * @returns The changelog in JSON format.
 */
const getChangelog = (request: Request, response: Response) => {
  try {
    // This is the path to the root of the project.
    let __dirname = '../'

    // This is the path to the changelog.
    let changelogPath: string = path.join(__dirname, 'docs', 'changelog.md')

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

export default getChangelog
