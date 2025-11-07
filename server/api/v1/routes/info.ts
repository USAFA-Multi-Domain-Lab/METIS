import type { Router } from 'express'
import type { MetisServer } from '../../..'
import { auth } from '../../../middleware/users'
import { getChangelog } from '../controllers/info/changelog.get'
import { getInfo } from '../controllers/info/index.get'
import type { TMetisRouterMap } from '../library/MetisRouter'

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
