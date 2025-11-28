import type { MetisServer } from '@server/MetisServer'
import type { Router } from 'express'
import defineRequests, {
  RequestBodyFilters,
} from '../../../middleware/requests'
import { logout } from '../controllers/logins/index.delete'
import { getLogin } from '../controllers/logins/index.get'
import { login } from '../controllers/logins/index.post'
import type { TMetisRouterMap } from '../library/MetisRouter'

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
