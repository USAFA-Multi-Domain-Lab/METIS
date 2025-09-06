import { Router } from 'express'
import MetisServer from 'metis/server'
import { TMetisRouterMap } from 'metis/server/http/router'
import defineRequests, {
  RequestBodyFilters,
} from 'metis/server/middleware/requests'
import {
  auth,
  restrictPasswordReset,
  restrictUserManagement,
} from 'metis/server/middleware/users'
import deleteUser from '../controllers/users/[_id].delete'
import getUser from '../controllers/users/[_id].get'
import updateUser from '../controllers/users/[_id].put'
import getUsers from '../controllers/users/index.get'
import createNewUser from '../controllers/users/index.post'
import updateUserPreferences from '../controllers/users/preferences.put'
import resetPassword from '../controllers/users/reset-password.put'

const routerMap: TMetisRouterMap = (
  router: Router,
  server: MetisServer,
  done,
) => {
  /* -- CREATE -- */

  // -- POST | /api/v1/users/ --
  router.post(
    '/',
    auth({ permissions: ['users_write_students'] }),
    restrictUserManagement,
    defineRequests({
      body: {
        username: RequestBodyFilters.USERNAME,
        accessId: RequestBodyFilters.ACCESS,
        expressPermissionIds: RequestBodyFilters.ARRAY,
        firstName: RequestBodyFilters.NAME,
        lastName: RequestBodyFilters.NAME,
        password: RequestBodyFilters.PASSWORD,
        needsPasswordReset: RequestBodyFilters.BOOLEAN,
      },
    }),
    createNewUser,
  )

  /* -- READ -- */

  // -- GET | /api/v1/users/ --
  router.get('/', auth({ permissions: ['users_read_students'] }), getUsers)

  // -- GET | /api/v1/users/:_id/ --
  router.get(
    '/:_id/',
    auth({ permissions: ['users_read_students'] }),
    restrictUserManagement,
    defineRequests({ params: { _id: 'objectId' } }),
    getUser,
  )

  /* -- UPDATE -- */

  // -- PUT | /api/v1/users/preferences/ --
  router.put(
    '/preferences/',
    auth({}),
    defineRequests({
      body: {
        preferences: RequestBodyFilters.USER_PREFERENCES(true),
      },
    }),
    updateUserPreferences,
  )

  // -- PUT | /api/v1/users/reset-password --
  router.put(
    '/reset-password/',
    auth({}),
    restrictPasswordReset,
    defineRequests({
      body: { password: RequestBodyFilters.PASSWORD },
    }),
    resetPassword,
  )

  //  -- PUT | /api/v1/users/ --
  router.put(
    '/:_id/',
    auth({ permissions: ['users_write_students'] }),
    restrictUserManagement,
    defineRequests(
      {
        params: {
          _id: 'objectId',
        },
      },
      {
        body: {
          username: RequestBodyFilters.USERNAME,
          accessId: RequestBodyFilters.ACCESS,
          expressPermissionIds: RequestBodyFilters.ARRAY,
          firstName: RequestBodyFilters.NAME,
          lastName: RequestBodyFilters.NAME,
          password: RequestBodyFilters.PASSWORD,
          needsPasswordReset: RequestBodyFilters.BOOLEAN,
        },
      },
    ),
    updateUser,
  )

  /* -- DELETE -- */

  // -- DELETE | /api/v1/users/:_id/ --
  router.delete(
    '/:_id/',
    auth({ permissions: ['users_write_students'] }),
    restrictUserManagement,
    defineRequests({
      params: {
        _id: 'objectId',
      },
    }),
    deleteUser,
  )

  done()
}

export default routerMap
