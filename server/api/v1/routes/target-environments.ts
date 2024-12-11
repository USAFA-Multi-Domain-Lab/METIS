import { Router } from 'express'
import MetisServer from 'metis/server'
import { TMetisRouterMap } from 'metis/server/http/router'
import { auth } from 'metis/server/middleware/users'
import getTargetEnvironments from '../controllers/target-environments/index.get'

export const routerMap: TMetisRouterMap = (
  router: Router,
  server: MetisServer,
  done: () => void,
) => {
  /* ---------------------------- READ ------------------------------ */

  // -- GET | /api/v1/target-environments/ --
  router.get(
    '/',
    auth({ permissions: ['environments_read'] }),
    getTargetEnvironments,
  )

  done()
}

export default routerMap
