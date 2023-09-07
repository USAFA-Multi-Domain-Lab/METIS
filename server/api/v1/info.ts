import fs from 'fs'
import expressWs from 'express-ws'
import { TMetisRouterMap } from 'metis/server/http/router'

const routerMap: TMetisRouterMap = (
  router: expressWs.Router,
  done: () => void,
) => {
  router.get('/changelog/', (request, response) => {
    let changelog: string = fs.readFileSync('./public/changelog.md', {
      encoding: 'utf8',
    })

    return response.json(changelog)
  })

  done()
}

export default routerMap
