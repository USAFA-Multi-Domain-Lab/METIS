import { MetisServer } from '@metis/server/MetisServer'
import { MetisRouter } from '@metis/server/api/v1/library/MetisRouter'
import routerMap_files from '@metis/server/api/v1/routes/files'
import routerMap_info from '@metis/server/api/v1/routes/info'
import routerMap_logins from '@metis/server/api/v1/routes/logins'
import routerMap_missions from '@metis/server/api/v1/routes/missions'
import routerMap_sessions from '@metis/server/api/v1/routes/sessions'
import routerMap_targetEnvironments from '@metis/server/api/v1/routes/target-environments'
import routerMap_users from '@metis/server/api/v1/routes/users'
import fs from 'fs'
import path from 'path'

/**
 * Middleware class for managing a METIS server instance for tests.
 */
export abstract class TestMetisServer {
  /**
   * Cache for storing the METIS server instance, which can be reused upon subsequent calls
   * to the {@link useMetisServer} middleware function.
   */
  private static server: MetisServer | undefined

  /**
   * Creates and starts a new METIS server instance with all v1 routers registered.
   * @resolves with the started {@link MetisServer} instance.
   * @rejects if the server fails to start.
   */
  private static async create(): Promise<MetisServer> {
    if (process.env.METIS_ENV_TYPE !== TestMetisServer.METIS_ENV_TYPE) {
      throw new Error(
        `METIS_ENV_TYPE must be set to "${TestMetisServer.METIS_ENV_TYPE}" for TestMetisServer.`,
      )
    }

    let storeDir = path.resolve(
      process.cwd(),
      process.env.FILE_STORE_DIR ?? './server/files/store-test',
    )
    try {
      fs.rmSync(storeDir, { recursive: true, force: true })
      fs.mkdirSync(storeDir, { recursive: true })
    } catch (error) {
      console.warn('Failed to reset test file store directory.')
      console.warn(error)
    }

    // Create METIS server
    this.server = new MetisServer()

    // Add routers
    this.server.addRouter(new MetisRouter('/api/v1/info/', routerMap_info))
    this.server.addRouter(new MetisRouter('/api/v1/users/', routerMap_users))
    this.server.addRouter(
      new MetisRouter('/api/v1/missions/', routerMap_missions),
    )
    this.server.addRouter(
      new MetisRouter('/api/v1/sessions/', routerMap_sessions),
    )
    this.server.addRouter(new MetisRouter('/api/v1/files/', routerMap_files))
    this.server.addRouter(
      new MetisRouter(
        '/api/v1/target-environments/',
        routerMap_targetEnvironments,
      ),
    )
    this.server.addRouter(new MetisRouter('/api/v1/logins/', routerMap_logins))

    // Start server and return server.
    await this.server.start()
    return this.server
  }

  /**
   * Yields a METIS server instance for tests, starting one if no instance is running yet.
   * @resolves with a running {@link MetisServer} instance.
   * @rejects if the server cannot be started.
   */
  public static async use(): Promise<MetisServer> {
    if (this.server) {
      return this.server
    } else {
      console.log(
        '\n🚀 A project was found needing a METIS server instance, spinning one up now...\n',
      )
      this.server = await this.create()
      console.log('\n✅ METIS server started.\n')
      return this.server
    }
  }

  /**
   * Stops the METIS server instance, if one is running.
   * @resolves when shutdown completes or no server instance is cached.
   * @rejects if server shutdown fails.
   */
  public static async stop(): Promise<void> {
    if (this.server) {
      console.log('\n🧹 Stopping METIS server...\n')
      await this.server.close()
      this.server = undefined
      console.log('\n✅ Server stopped.\n')
    }
  }

  /**
   * @returns Whether the METIS server instance is currently cached and running.
   */
  public static isRunning(): boolean {
    return Boolean(this.server)
  }

  /**
   * The environment type for the METIS server instance used in tests.
   */
  public static readonly METIS_ENV_TYPE = 'test'
}
