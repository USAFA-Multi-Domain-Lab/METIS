import { Router } from 'express'
import MetisServer from 'metis/server'
import { TMetisRouterMap } from 'metis/server/http/router'
import defineRequests from 'metis/server/middleware/requests'
import { auth } from 'metis/server/middleware/users'
import downloadFile from '../controllers/files/[_id]/download.get'
import deleteFile from '../controllers/files/[_id]/index.delete'
import getFile from '../controllers/files/[_id]/index.get'
import getFiles from '../controllers/files/index.get'
import uploadFiles from '../controllers/files/index.post'

const routerMap: TMetisRouterMap = (
  router: Router,
  server: MetisServer,
  done: () => void,
) => {
  const { fileStore } = server

  /* ---------------------------- ROUTES ---------------------------- */

  router.get(
    '/',
    auth({ permissions: ['files_read'] }),
    defineRequests({}),
    getFiles,
  )

  router.get(
    '/:_id',
    auth({ permissions: ['files_read'] }),
    defineRequests({ params: { _id: 'objectId' } }),
    getFile,
  )

  router.get(
    '/:_id/download',
    auth({ permissions: ['files_read'] }),
    defineRequests({ params: { _id: 'objectId' } }),
    (request, response) => downloadFile(request, response, fileStore),
  )

  router.post(
    '/',
    auth({ permissions: ['files_write'] }),
    fileStore.uploadMiddleware,
    (request, response) => uploadFiles(request, response, fileStore),
  )

  router.delete(
    '/:_id',
    auth({ permissions: ['files_write'] }),
    defineRequests({ params: { _id: 'objectId' } }),
    deleteFile,
  )

  done()
}

export default routerMap
