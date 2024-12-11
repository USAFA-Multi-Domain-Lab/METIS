import { Router } from 'express'
import MetisServer from 'metis/server'
import { TMetisRouterMap } from 'metis/server/http/router'
import { auth } from 'metis/server/middleware/users'
import getChangelog from '../controllers/info/changelog.get'
import getInfo from '../controllers/info/index.get'

const routerMap: TMetisRouterMap = (
  router: Router,
  server: MetisServer,
  done: () => void,
) => {
  /* ---------------------------- READ ------------------------------ */

  router.get('/', getInfo)
  router.get(
    '/changelog/',
    auth({
      permissions: ['changelog_read'],
    }),
    getChangelog,
  )

  done()
}

export default routerMap
