import { Request, Response } from 'express-serve-static-core'
import expressWs from 'express-ws'
import { TMetisRouterMap } from 'metis/server/http/router'
import defineRequests, {
  RequestBodyFilters,
} from 'metis/server/middleware/requests'
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

  /* ---------------------------- UPDATE ---------------------------- */

  /**
   * This will update a target environment.
   * @returns The updated target environment.
   */
  const updateTargetEnvironment = (request: Request, response: Response) => {
    let targetEnvUpdates = request.body
    // Get the target environment ID from the request body.
    let _id: any = targetEnvUpdates._id

    // Get the target environment JSON.
    let targetEnvironmentJson: any = ServerTargetEnvironment.getJson(_id)

    // If the target environment JSON is found, update the target environment.
    if (targetEnvironmentJson) {
      // Places all values found in
      // targetEnvUpdates into targetEnvironmentJson.
      for (let key in targetEnvUpdates) {
        if (key !== '_id') {
          targetEnvironmentJson[key] = targetEnvUpdates[key]
        }
      }

      // Update the target environment in the registry.
      ServerTargetEnvironment.updateTargetEnvInRegistry(targetEnvironmentJson)

      // Send the updated target environment to the client.
      return response.json(ServerTargetEnvironment.getJson(_id))
    } else {
      return response.status(404).json({
        message: `Target environment with ID "${_id}" not found.`,
      })
    }
  }

  /* ---------------------------- ROUTES ---------------------------- */

  // -- GET | /api/v1/target-environments/ --
  router.get(
    '/',
    auth({ permissions: ['missions_read'] }),
    getTargetEnvironments,
  )

  // -- GET | /api/v1/target-environments/:_id/ --
  router.get(
    '/:_id/',
    auth({ permissions: ['missions_read'] }),
    defineRequests({
      params: { _id: 'string' },
    }),
    getTargetEnvironment,
  )

  // -- GET | /api/v1/target-environments/targets/:_id/ --
  router.get(
    '/targets/:_id',
    auth({ permissions: ['missions_read'] }),
    defineRequests({
      params: { _id: 'string' },
    }),
    getTarget,
  )

  // -- PUT | /api/v1/target-environments/ --
  router.put(
    '/',
    auth({ permissions: ['missions_write'] }),
    defineRequests(
      {
        body: {
          _id: RequestBodyFilters.STRING,
        },
      },
      {
        body: {
          name: RequestBodyFilters.STRING,
          description: RequestBodyFilters.STRING_MEDIUMTEXT,
          version: RequestBodyFilters.STRING,
          targets: RequestBodyFilters.ARRAY,
        },
      },
    ),
    updateTargetEnvironment,
  )

  done()
}

export default routerMap
