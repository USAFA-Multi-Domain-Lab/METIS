import { Router } from 'express'
import MetisServer from 'metis/server'
import { TMetisRouterMap } from 'metis/server/http/router'
import {
  RequestBodyFilters,
  defineRequests,
} from '../../../middleware/requests'
import uploads from '../../../middleware/uploads'
import { auth } from '../../../middleware/users'
import deleteMission from '../controllers/missions/[_id].delete'
import getMission from '../controllers/missions/[_id].get'
import updateMission from '../controllers/missions/[_id].put'
import copyMission from '../controllers/missions/copy.post'
import exportMission from '../controllers/missions/export.get'
import importMission from '../controllers/missions/import.post'
import getMissions from '../controllers/missions/index.get'
import createMission from '../controllers/missions/index.post'

export const routerMap: TMetisRouterMap = async (
  router: Router,
  server: MetisServer,
  done: () => void,
) => {
  /* -- CREATE -- */
  router.post(
    '/',
    auth({ permissions: ['missions_write'] }),
    defineRequests({
      body: {
        name: RequestBodyFilters.STRING,
        versionNumber: RequestBodyFilters.NUMBER,
        seed: RequestBodyFilters.STRING,
        resourceLabel: RequestBodyFilters.STRING,
        structure: RequestBodyFilters.OBJECT,
        forces: RequestBodyFilters.ARRAY,
        prototypes: RequestBodyFilters.ARRAY,
        files: RequestBodyFilters.ARRAY,
      },
    }),
    createMission,
  )
  router.post(
    '/import/',
    auth({ permissions: ['missions_write'] }),
    uploads.array('files', 12),
    (request, response) => importMission(request, response, server.fileStore),
  )

  /* -- READ -- */
  router.get('/', auth({ permissions: ['missions_read'] }), getMissions)
  router.get(
    '/:_id/',
    auth({ permissions: ['missions_read'] }),
    defineRequests({ params: { _id: 'objectId' } }),
    getMission,
  )
  router.get(
    '/:_id/export/*', // The "*" is to ensure the downloaded file includes the mission's name and the .metis extension.
    auth({ permissions: ['missions_read', 'missions_write'] }),
    defineRequests({ params: { _id: 'objectId' } }),
    (request, response) => exportMission(request, response, server.fileStore),
  )

  /* -- UPDATE -- */
  router.put(
    '/',
    auth({ permissions: ['missions_write'] }),
    defineRequests(
      {
        body: {
          _id: RequestBodyFilters.OBJECTID,
        },
      },
      {
        body: {
          name: RequestBodyFilters.STRING,
          versionNumber: RequestBodyFilters.NUMBER,
          seed: RequestBodyFilters.STRING,
          resourceLabel: RequestBodyFilters.STRING,
          structure: RequestBodyFilters.OBJECT,
          forces: RequestBodyFilters.ARRAY,
          prototypes: RequestBodyFilters.ARRAY,
          files: RequestBodyFilters.ARRAY,
        },
      },
    ),
    updateMission,
  )
  router.post(
    '/copy/',
    auth({ permissions: ['missions_write'] }),
    defineRequests({
      body: {
        copyName: RequestBodyFilters.STRING,
        originalId: RequestBodyFilters.OBJECTID,
      },
    }),
    copyMission,
  )

  /* -- DELETE -- */
  router.delete(
    '/:_id/',
    auth({ permissions: ['missions_write'] }),
    defineRequests({ params: { _id: 'objectId' } }),
    deleteMission,
  )

  done()
}

export default routerMap
