import { TMetisRouterMap } from 'metis/server/http/router'
import expressWs from 'express-ws'
import { Request, Response } from 'express'

export const routerMap: TMetisRouterMap = (
  router: expressWs.Router,
  done: () => void,
) => {
  // -- POST | /api/v1/target-environments/ --
  // This will create a new target environment.

  // -- GET | /api/v1/target-environments/ --
  // This will get all target environments.

  // -- GET | /api/v1/target-environments/targets/ --
  // This will get all targets.

  // -- PUT | /api/v1/target-environments/ --
  // This will update a target environment.

  // -- DELETE | /api/v1/target-environments/ --
  // This will delete a target environment.

  done()
}

export default routerMap
