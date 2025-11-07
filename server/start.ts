import { MetisServer } from './MetisServer'
import { MetisRouter } from './api/v1/library/MetisRouter'
import routerMap_files from './api/v1/routes/files'
import routerMap_info from './api/v1/routes/info'
import routerMap_logins from './api/v1/routes/logins'
import routerMap_missions from './api/v1/routes/missions'
import routerMap_sessions from './api/v1/routes/sessions'
import routerMap_targetEnvironments from './api/v1/routes/target-environments'
import routerMap_users from './api/v1/routes/users'

console.log('Starting METIS...')

// Create METIS server.
export let server: MetisServer = new MetisServer({})

// Add routers.
server.addRouter(new MetisRouter('/api/v1/info/', routerMap_info))
server.addRouter(new MetisRouter('/api/v1/users/', routerMap_users))
server.addRouter(new MetisRouter('/api/v1/missions/', routerMap_missions))
server.addRouter(new MetisRouter('/api/v1/sessions/', routerMap_sessions))
server.addRouter(new MetisRouter('/api/v1/files/', routerMap_files))
server.addRouter(
  new MetisRouter('/api/v1/target-environments/', routerMap_targetEnvironments),
)
server.addRouter(new MetisRouter('/api/v1/logins/', routerMap_logins))

// Start server.
server.start()

export default { server }
