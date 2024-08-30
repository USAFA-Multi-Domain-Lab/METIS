import { Request, Response } from 'express-serve-static-core'
import expressWs from 'express-ws'
import fs from 'fs'
import MetisServer from 'metis/server'
import { TMetisRouterMap } from 'metis/server/http/router'
import path from 'path'

const routerMap: TMetisRouterMap = (
  router: expressWs.Router,
  server: MetisServer,
  done: () => void,
) => {
  /* ---------------------------- READ ------------------------------ */

  /**
   * This will retrieve the changelog.
   * @returns The changelog in JSON format.
   */
  const getChangelog = (request: Request, response: Response) => {
    // This is the path to the root of the project.
    let __dirname = '../'

    // This is the path to the changelog.
    let changelogPath: string = path.join(__dirname, 'changelog.md')

    // This is the changelog.
    let changelog: string = fs.readFileSync(changelogPath, {
      encoding: 'utf8',
    })

    // This is the response.
    return response.json(changelog)
  }

  /* ---------------------------- ROUTES ---------------------------- */

  // -- GET | /api/v1/info/changelog/ --
  router.get('/changelog/', getChangelog)
  done()
}

export default routerMap
