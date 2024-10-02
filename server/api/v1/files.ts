import express, { Router } from 'express'
import MetisServer from 'metis/server'
import { TMetisRouterMap } from 'metis/server/http/router'
import { auth } from 'metis/server/middleware/users'

const routerMap: TMetisRouterMap = (
  router: Router,
  server: MetisServer,
  done: () => void,
) => {
  /* ---------------------------- READ ------------------------------ */

  /* ---------------------------- ROUTES ---------------------------- */

  router.use('/', auth({}), express.static(server.fileStore.directory))
  done()
}

export default routerMap
