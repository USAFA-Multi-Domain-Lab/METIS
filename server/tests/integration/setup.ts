/**
 * Global setup for API integration tests
 * Starts the server once before any tests run
 */

import MetisServer from 'metis/server'
import routerMap_files from 'metis/server/api/v1/routes/files'
import routerMap_info from 'metis/server/api/v1/routes/info'
import routerMap_logins from 'metis/server/api/v1/routes/logins'
import routerMap_missions from 'metis/server/api/v1/routes/missions'
import routerMap_sessions from 'metis/server/api/v1/routes/sessions'
import routerMap_targetEnvironments from 'metis/server/api/v1/routes/target-environments'
import routerMap_users from 'metis/server/api/v1/routes/users'
import MetisRouter from 'metis/server/http/router'

export default async function globalSetup() {
  console.log('\n🚀 Starting METIS server for integration tests...\n')

  // Create METIS server
  const server = new MetisServer({})

  // Add routers
  server.addRouter(new MetisRouter('/api/v1/info/', routerMap_info))
  server.addRouter(new MetisRouter('/api/v1/users/', routerMap_users))
  server.addRouter(new MetisRouter('/api/v1/missions/', routerMap_missions))
  server.addRouter(new MetisRouter('/api/v1/sessions/', routerMap_sessions))
  server.addRouter(new MetisRouter('/api/v1/files/', routerMap_files))
  server.addRouter(
    new MetisRouter(
      '/api/v1/target-environments/',
      routerMap_targetEnvironments,
    ),
  )
  server.addRouter(new MetisRouter('/api/v1/logins/', routerMap_logins))

  // Start server
  server.serve()

  // Store server instance in the integration namespace so tests can access it
  globalThis.integration = { server }

  console.log('✅ Server started and ready for tests\n')
}
