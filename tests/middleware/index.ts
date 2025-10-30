import MetisServer from 'metis/server'
import routerMap_files from 'metis/server/api/v1/routes/files'
import routerMap_info from 'metis/server/api/v1/routes/info'
import routerMap_logins from 'metis/server/api/v1/routes/logins'
import routerMap_missions from 'metis/server/api/v1/routes/missions'
import routerMap_sessions from 'metis/server/api/v1/routes/sessions'
import routerMap_targetEnvironments from 'metis/server/api/v1/routes/target-environments'
import routerMap_users from 'metis/server/api/v1/routes/users'
import MetisRouter from 'metis/server/http/router'

/**
 * Cache for storing the METIS server instance,
 * which can be reused upon subsequent calls
 * to the {@link useMetisServer} middleware function.
 */
let metisServer: MetisServer | undefined

/**
 * @returns New {@link MetisServer} instance.
 */
async function createMetisServer(): Promise<MetisServer> {
  // Create METIS server
  metisServer = new MetisServer({})

  // Add routers
  metisServer.addRouter(new MetisRouter('/api/v1/info/', routerMap_info))
  metisServer.addRouter(new MetisRouter('/api/v1/users/', routerMap_users))
  metisServer.addRouter(
    new MetisRouter('/api/v1/missions/', routerMap_missions),
  )
  metisServer.addRouter(
    new MetisRouter('/api/v1/sessions/', routerMap_sessions),
  )
  metisServer.addRouter(new MetisRouter('/api/v1/files/', routerMap_files))
  metisServer.addRouter(
    new MetisRouter(
      '/api/v1/target-environments/',
      routerMap_targetEnvironments,
    ),
  )
  metisServer.addRouter(new MetisRouter('/api/v1/logins/', routerMap_logins))

  // Start server and return server.
  await metisServer.start()
  return metisServer
}

/**
 * Yields a METIS server instance for use in the
 * tests, starting an instance if one isn't already
 * running.
 * @returns New {@link MetisServer} instance.
 */
export async function useMetisServer(): Promise<MetisServer> {
  if (metisServer) {
    return metisServer
  } else {
    console.log(
      '\n🚀 A project was found needing a METIS server instance, spinning one up now...\n',
    )
    metisServer = await createMetisServer()
    console.log('\n✅ METIS server started.\n')
    return metisServer
  }
}

/**
 * Stops the METIS server instance, if one is running.
 */
export async function stopMetisServer(): Promise<void> {
  if (metisServer) {
    console.log('\n🧹 Stopping METIS server...\n')
    await metisServer.close()
    metisServer = undefined
    console.log('\n✅ Server stopped.\n')
  }
}
