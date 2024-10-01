import express from 'express'
import MetisServer from 'metis/server'
import { TMetisRouterMap } from 'metis/server/http/router'
import { auth } from 'metis/server/middleware/users'

const routerMap: TMetisRouterMap = (
  router: express.Router,
  server: MetisServer,
  done: () => void,
) => {
  /* ---------------------------- READ ------------------------------ */

  /* ---------------------------- ROUTES ---------------------------- */

  router.use('/', auth({}), express.static(server.fileStore.directory))
  done()
}

export default routerMap
