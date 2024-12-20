import fs from 'fs'
import MetisServer, { IMetisServerOptions } from 'metis/server'
import routerMap_files from 'metis/server/api/v1/routes/files'
import routerMap_info from 'metis/server/api/v1/routes/info'
import routerMap_logins from 'metis/server/api/v1/routes/logins'
import routerMap_missions from 'metis/server/api/v1/routes/missions'
import routerMap_sessions from 'metis/server/api/v1/routes/sessions'
import routerMap_targetEnvironments from 'metis/server/api/v1/routes/target-environments'
import routerMap_users from 'metis/server/api/v1/routes/users'
import MetisRouter from 'metis/server/http/router'

let { ENVIRONMENT_FILE_PATH: environmentFilePath } = MetisServer
let serverOptions: IMetisServerOptions = {}

console.log('Reading enviroment.json file...')

// If the environment file exists, read it.
if (fs.existsSync(environmentFilePath)) {
  let environmentData: any = fs.readFileSync(environmentFilePath, 'utf8')

  // Parse data to JSON.
  environmentData = JSON.parse(environmentData)

  // Join environment data with server options.
  serverOptions = { ...serverOptions, ...environmentData }
} else {
  console.error(
    'Environment file not found. Continuing with default options...',
  )
}

console.log('Starting METIS...')

// Create METIS server.
export let server: MetisServer = new MetisServer(serverOptions)

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
server.serve()

export default { server }
