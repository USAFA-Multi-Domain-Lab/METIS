import type { MetisServer } from '@server/MetisServer'
import type { Router } from 'express'
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

  // One may ask why this route has 'environments_read'
  // permission instead of 'environments_write' since it
  // is performing a migration. The reason is because no
  // actual changes are made on the server via this route.
  // Rather it takes already known information and transforms
  // it based on a registered target-environment script. In this
  // sense, whether the user can see target-environment data is
  // really the only relevant concern here.
  router.post(
    '/migrate/effect-args',
    auth({ permissions: ['environments_read'] }),
    defineRequests({
      body: {
        effectId: RequestBodyFilters.STRING,
        missionId: RequestBodyFilters.STRING,
      },
    }),
    migrateEffectArgs,
  )

  done()
}

export default routerMap
