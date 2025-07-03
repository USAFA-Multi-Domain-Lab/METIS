import { Router } from 'express'
import MetisServer from 'metis/server'
import defineRequests, {
  RequestBodyFilters,
} from 'metis/server/middleware/requests'
import Session, { TSessionConfig } from 'metis/sessions'
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
          autoAssign: RequestBodyFilters.BOOLEAN,
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
