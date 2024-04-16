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
  // -- GET | /api/v1/target-environments/ --
  // This will get all target environments.
  router.get(
    '/',
    auth({ permissions: ['missions_read'] }),
    defineRequests(
      {
        query: {},
      },
      {
        query: { targetEnvId: 'string' },
      },
    ),
    (request, response) => {
      // Get the target environment ID from the request query.
      let targetEnvId: any = request.query.targetEnvId

      // If the target environment ID is provided, send the target environment to the client.
      if (targetEnvId) {
        // Get the target environment JSON.
        let targetEnvironmentJson = ServerTargetEnvironment.getJson(targetEnvId)

        // If the target environment JSON is found, send it to the client.
        if (targetEnvironmentJson) {
          // Send the target environment JSON to the client.
          return response.json(targetEnvironmentJson)
        }
        // Otherwise, send a 404.
        else {
          return response.status(404).json({
            message: `Target environment with ID "${targetEnvId}" not found.`,
          })
        }
      }
      // Otherwise, send all target environments to the client.
      else {
        // Send the target environments to the client.
        return response.json(ServerTargetEnvironment.getAllJson())
      }
    },
  )

  // -- GET | /api/v1/target-environments/targets/ --
  // This will get all targets in a target environment.
  router.get(
    '/targets',
    auth({ permissions: ['missions_read'] }),
    defineRequests({
      query: { targetId: 'string' },
    }),
    (request, response) => {
      // Get the target ID from the request query.
      let targetId: any = request.query.targetId

      // Get the target JSON.
      let targetJson: TCommonTargetJson | undefined =
        ServerTarget.getTargetJson(targetId)

      // If the target JSON is found, send it to the client.
      if (targetJson) {
        // Send the target JSON to the client.
        return response.json(targetJson)
      }
      // Otherwise, send a 404.
      else {
        return response.status(404).json({
          message: `Target with ID "${targetId}" not found.`,
        })
      }
    },
  )

  done()
}

export default routerMap
