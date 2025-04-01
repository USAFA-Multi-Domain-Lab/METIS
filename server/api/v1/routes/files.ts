import { Router } from 'express'
import MetisServer from 'metis/server'
import { TMetisRouterMap } from 'metis/server/http/router'
import defineRequests from 'metis/server/middleware/requests'
import { auth } from 'metis/server/middleware/users'
import downloadFile from '../controllers/files/[_id]/download.get'
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

  router.get('/', auth({}), defineRequests({}), getFiles)

  router.get(
    '/:_id',
    auth({}), // todo: Add file permissions.
    defineRequests({ params: { _id: 'objectId' } }),
    getFile,
  )

  router.get(
    '/:_id/download',
    auth({}), // todo: Add file permissions.
    defineRequests({ params: { _id: 'objectId' } }),
    (request, response) => downloadFile(request, response, fileStore),
  )

  // router.get(
  //   '/:_id/download',
  //   auth({}), // todo: Add file permissions.
  //   defineRequests({ params: { _id: 'objectId' } }),
  //   downloadFile,
  // )

  router.post(
    '/',
    auth({}), // todo: Add file permissions.
    fileStore.uploadMiddleware,
    uploadFiles,
  )

  done()
}

export default routerMap
