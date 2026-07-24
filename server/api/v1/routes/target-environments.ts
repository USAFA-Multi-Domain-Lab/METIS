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

  // This route requires 'read' rather than 'write' permissions
  // because it makes no changes on the server: it takes already
  // known information and transforms it based on a registered
  // target-environment script, returning the result for the
  // caller to persist separately.
  //
  // It requires two reads because it touches two subsystems.
  // The handler first loads a full mission document by id and
  // returns effect-argument data from it, so 'missions_read'
  // governs the data that actually leaves the server. It then
  // runs the target-environment migration scripts, so
  // 'environments_read' governs use of that subsystem. Both are
  // required (AND), which correctly excludes students, who hold
  // 'environments_read' but not 'missions_read'.
  router.post(
    '/migrate/effect-args',
    auth({ permissions: ['missions_read', 'environments_read'] }),
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
