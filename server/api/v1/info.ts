import fs from 'fs'
import expressWs from 'express-ws'
import { TMetisRouterMap } from 'metis/server/http/router'
import path from 'path'

const routerMap: TMetisRouterMap = (
  router: expressWs.Router,
  done: () => void,
) => {
  router.get('/changelog/', (request, response) => {
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
  })

  done()
}

export default routerMap
