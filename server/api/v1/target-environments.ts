import expressWs from 'express-ws'
import { TMetisRouterMap } from 'metis/server/http/router'
import defineRequests from 'metis/server/middleware/requests'
import { authorized } from 'metis/server/middleware/users'
import ServerTargetEnvironment from 'metis/server/target-environments'
import { TCommonTargetEnvJson } from 'metis/target-environments'
import path from 'path'

export const routerMap: TMetisRouterMap = (
  router: expressWs.Router,
  done: () => void,
) => {
  // -- GET | /api/v1/target-environments/ --
  // This will get all target environments.
  router.get(
    '/',
    authorized(['READ']),
    defineRequests({
      query: {},
    }),
    (request, response) => {
      // The directory where the target environments are located.
      let targetEnvDir: string = path.join(
        __dirname,
        '../../../integration/target-env',
      )

      // Get the target environments.
      let targetEnvJson: TCommonTargetEnvJson[] =
        ServerTargetEnvironment.scan(targetEnvDir)

      // Send the target environments to the client.
      return response.json(targetEnvJson)
    },
  )

  done()
}

export default routerMap
