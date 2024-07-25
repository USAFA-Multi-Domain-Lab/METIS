import { Request, Response } from 'express-serve-static-core'
import expressWs from 'express-ws'
import { TMetisRouterMap } from 'metis/server/http/router'
import defineRequests from 'metis/server/middleware/requests'
import { auth } from 'metis/server/middleware/users'
import ServerTargetEnvironment from 'metis/server/target-environments'
import ServerTarget from 'metis/server/target-environments/targets'
import { TCommonTargetJson } from 'metis/target-environments/targets'

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

  /**
   * This will retrieve a specific target environment.
   * @returns The target environment in JSON format.
   */
  const getTargetEnvironment = (request: Request, response: Response) => {
    // Get the target environment ID from the request params.
    let id: any = request.params._id

    // Get the target environment JSON.
    let targetEnvironmentJson = ServerTargetEnvironment.getJson(id)

    // If the target environment JSON is found, send it to the client.
    if (targetEnvironmentJson) {
      // Send the target environment JSON to the client.
      return response.json(targetEnvironmentJson)
    }
    // Otherwise, send a 404.
    else {
      return response.status(404).json({
        message: `Target environment with ID "${id}" not found.`,
      })
    }
  }

  /**
   * This will retrieve a specific target.
   * @returns The target in JSON format.
   */
  const getTarget = (request: Request, response: Response) => {
    // Get the target ID from the request params.
    let _id: any = request.params._id

    // Get the target JSON.
    let targetJson: TCommonTargetJson | undefined =
      ServerTarget.getTargetJson(_id)

    // If the target JSON is found, send it to the client.
    if (targetJson) {
      // Send the target JSON to the client.
      return response.json(targetJson)
    }
    // Otherwise, send a 404.
    else {
      return response.status(404).json({
        message: `Target with ID "${_id}" not found.`,
      })
    }
  }

  /* ---------------------------- ROUTES ---------------------------- */

  // -- GET | /api/v1/target-environments/ --
  router.get(
    '/',
    auth({ permissions: ['environments_read'] }),
    getTargetEnvironments,
  )

  // -- GET | /api/v1/target-environments/:_id/ --
  router.get(
    '/:_id/',
    auth({ permissions: ['environments_read'] }),
    defineRequests({
      params: { _id: 'string' },
    }),
    getTargetEnvironment,
  )

  // -- GET | /api/v1/target-environments/targets/:_id/ --
  router.get(
    '/targets/:_id',
    auth({ permissions: ['environments_read'] }),
    defineRequests({
      params: { _id: 'string' },
    }),
    getTarget,
  )

  done()
}

export default routerMap
