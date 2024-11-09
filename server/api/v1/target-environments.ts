import { Router } from 'express'
import { Request, Response } from 'express-serve-static-core'
import MetisServer from 'metis/server'
import { TMetisRouterMap } from 'metis/server/http/router'
import { auth } from 'metis/server/middleware/users'
import ServerTargetEnvironment from 'metis/server/target-environments'

export const routerMap: TMetisRouterMap = (
  router: Router,
  server: MetisServer,
  done: () => void,
) => {
  /* ---------------------------- READ ------------------------------ */

  /**
   * This will retrieve all target environments.
   * @returns The target environments in JSON format.
   */
  const getTargetEnvironments = (request: Request, response: Response) => {
    // Send the target environments to the client.
    return response.json(ServerTargetEnvironment.getAllJson())
  }

  /* ---------------------------- ROUTES ---------------------------- */

  // -- GET | /api/v1/target-environments/ --
  router.get(
    '/',
    auth({ permissions: ['environments_read'] }),
    getTargetEnvironments,
  )

  done()
}

export default routerMap
