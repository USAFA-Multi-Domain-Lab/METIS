import { Request, Response } from 'express-serve-static-core'
import expressWs from 'express-ws'
import { TMetisRouterMap } from 'metis/server/http/router'
import { auth } from 'metis/server/middleware/users'
import ServerTargetEnvironment from 'metis/server/target-environments'

export const routerMap: TMetisRouterMap = (
  router: expressWs.Router,
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
    auth({ permissions: ['missions_read'] }),
    getTargetEnvironments,
  )

  done()
}

export default routerMap
