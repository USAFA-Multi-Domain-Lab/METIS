import { Router } from 'express'
import MetisServer from 'metis/server'
import { TMetisRouterMap } from 'metis/server/http/router'
import defineRequests, {
  RequestBodyFilters,
} from 'metis/server/middleware/requests'
import logout from '../controllers/logins/index.delete'
import getLogin from '../controllers/logins/index.get'
import login from '../controllers/logins/index.post'

const routerMap: TMetisRouterMap = (
  router: Router,
  server: MetisServer,
  done,
) => {
  /* -- CREATE -- */
  router.post(
    '/',
    defineRequests({
      body: {
        username: RequestBodyFilters.USERNAME,
        password: RequestBodyFilters.PASSWORD,
      },
    }),
    login,
  )

  /* -- READ -- */
  router.get('/', getLogin)

  /* -- DELETE -- */
  router.delete('/', logout)

  done()
}

export default routerMap
