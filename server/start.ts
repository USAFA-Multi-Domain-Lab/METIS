import fs from 'fs'
import MetisServer, { IMetisServerOptions } from 'metis/server'
import MetisRouter from 'metis/server/http/router'
import routerMap_info from 'metis/server/api/v1/info'
import routerMap_users from 'metis/server/api/v1/users'
import routerMap_missions from 'metis/server/api/v1/missions'
import routerMap_games from 'metis/server/api/v1/games'
import routerMap_tests from 'metis/server/tests/api/v1/routes-test'
import routerMap_targetEnvironments from 'metis/server/api/v1/target-environments'
import routerMap_connect from 'metis/server/connect'
import ServerTargetEnvironment from './target-environments'
import path from 'path'

let { ENVIRONMENT_FILE_PATH: environmentFilePath } = MetisServer
let serverOptions: IMetisServerOptions = {}

// Update server options based on environment.
if (process.env.environment === 'TEST') {
  environmentFilePath = './environment-test.json'
  serverOptions.mongoDB = 'metis-test'
  serverOptions.port = 8081
}

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

// todo: remove (target-environments)
// // Get the target environment directory.
// let targetEnvDir: string = path.join(__dirname, '../integration/target-env')
// // Fetch all target environments.
// console.log(ServerTargetEnvironment.scan(targetEnvDir, []))

// Create METIS server.
export let server: MetisServer = new MetisServer(serverOptions)

// Add routers.
server.addRouter(new MetisRouter('/api/v1/info/', routerMap_info))
server.addRouter(new MetisRouter('/api/v1/users/', routerMap_users))
server.addRouter(new MetisRouter('/api/v1/missions/', routerMap_missions))
server.addRouter(new MetisRouter('/api/v1/games/', routerMap_games))
server.addRouter(new MetisRouter('/api/v1/test/', routerMap_tests))
server.addRouter(
  new MetisRouter('/api/v1/target-environments/', routerMap_targetEnvironments),
)
server.addRouter(new MetisRouter('/connect', routerMap_connect))

// Start server.
server.serve()

export default { server }
