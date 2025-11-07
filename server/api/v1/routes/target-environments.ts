import type { Router } from 'express'
import type { MetisServer } from '../../..'
import defineRequests, {
  RequestBodyFilters,
} from '../../../middleware/requests'
import { auth } from '../../../middleware/users'
import { getTargetEnvironments } from '../controllers/target-environments/index.get'
import { migrateEffectArgs } from '../controllers/target-environments/migrate/effect-args.post'
import type { TMetisRouterMap } from '../library/MetisRouter'

export const routerMap: TMetisRouterMap = (
  router: Router,
  server: MetisServer,
  done: () => void,
) => {
  /* ---------------------------- READ ------------------------------ */

  // -- GET | /api/v1/target-environments/ --
  router.get(
    '/',
    auth({ permissions: ['environments_read'] }),
    getTargetEnvironments,
  )

  router.post(
    '/migrate/effect-args',
    auth({ permissions: ['environments_read'] }),
    defineRequests({
      body: {
        targetId: RequestBodyFilters.STRING,
        environmentId: RequestBodyFilters.STRING,
        effectEnvVersion: RequestBodyFilters.VERSION,
        effectArgs: RequestBodyFilters.OBJECT,
      },
    }),
    migrateEffectArgs,
  )

  done()
}

export default routerMap
