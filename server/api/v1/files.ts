import express from 'express'
import expressWs from 'express-ws'
import MetisServer from 'metis/server'
import { TMetisRouterMap } from 'metis/server/http/router'
import { auth } from 'metis/server/middleware/users'

const routerMap: TMetisRouterMap = (
  router: expressWs.Router,
  server: MetisServer,
  done: () => void,
) => {
  /* ---------------------------- READ ------------------------------ */

  /* ---------------------------- ROUTES ---------------------------- */

  router.use('/', auth({}), express.static(server.fileStore.directory))
  done()
}

export default routerMap
