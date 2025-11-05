import type { Router } from 'express'
import type { TSessionConfig } from 'metis/sessions'
import { Session } from 'metis/sessions'
import type { MetisServer } from '../../..'
import defineRequests, {
  RequestBodyFilters,
} from '../../../middleware/requests'
import { auth } from '../../../middleware/users'
import deleteSession from '../controllers/sessions/[_id].delete'
import downloadMissionFile from '../controllers/sessions/files/[_id]/download.get'
import getSessions from '../controllers/sessions/index.get'
import launchSession from '../controllers/sessions/launch.post'

const routerMap = (router: Router, server: MetisServer, done: () => void) => {
  const { fileStore } = server

  /* -- CREATE -- */

  router.post(
    '/launch/',
    auth({ permissions: ['sessions_write_native', 'missions_read'] }),
    defineRequests(
      {
        body: {
          missionId: RequestBodyFilters.OBJECTID,
        },
      },
      {
        body: {
          accessibility: RequestBodyFilters.STRING_LITERAL<
            TSessionConfig['accessibility']
          >(Session.ACCESSIBILITY_OPTIONS),
          infiniteResources: RequestBodyFilters.BOOLEAN,
          effectsEnabled: RequestBodyFilters.BOOLEAN,
          name: RequestBodyFilters.STRING,
        },
      },
    ),
    launchSession,
  )

  /* -- READ -- */

  router.get('/', auth({}), getSessions)

  /* -- UPDATE -- */

  router.get(
    '/files/:_id/download',
    auth({ authentication: 'in-session' }),
    defineRequests({ params: { _id: 'string' } }),
    (request, response) => downloadMissionFile(request, response, fileStore),
  )

  /* -- DELETE -- */

  router.delete('/:_id/', auth({}), deleteSession)

  done()
}

export default routerMap
