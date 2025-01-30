import fs from 'fs'
import routerMap_files from '../api/v1/routes/files'
import routerMap_info from '../api/v1/routes/info'
import routerMap_logins from '../api/v1/routes/logins'
import routerMap_missions from '../api/v1/routes/missions'
import routerMap_sessions from '../api/v1/routes/sessions'
import routerMap_targetEnvironments from '../api/v1/routes/target-environments'
import routerMap_users from '../api/v1/routes/users'
import MetisRouter from '../http/router'
import MetisServer, { TMetisServerOptions } from '../index'
import routerMap_tests from './api/v1/routes-test'

const environmentFilePath = './environment-test.json'
let serverOptions: TMetisServerOptions = {}

console.log('Reading enviroment.json file...')

// If the environment file exists, read it.
if (fs.existsSync(environmentFilePath)) {
  let environmentData: any = fs.readFileSync(environmentFilePath, 'utf8')

  // Parse data to JSON.
  environmentData = JSON.parse(environmentData)

  // Join environment data with server options.
  serverOptions = { ...environmentData }
} else {
  console.error(
    'Environment file not found. Continuing with default options...',
  )
}

console.log('Starting METIS Test Server...')

// Create METIS server.
export let testServer: MetisServer = new MetisServer(serverOptions)

// Add routers.
testServer.addRouter(new MetisRouter('/api/v1/info/', routerMap_info))
testServer.addRouter(new MetisRouter('/api/v1/users/', routerMap_users))
testServer.addRouter(new MetisRouter('/api/v1/missions/', routerMap_missions))
testServer.addRouter(new MetisRouter('/api/v1/sessions/', routerMap_sessions))
testServer.addRouter(new MetisRouter('/api/v1/files/', routerMap_files))
testServer.addRouter(
  new MetisRouter('/api/v1/target-environments/', routerMap_targetEnvironments),
)
testServer.addRouter(new MetisRouter('/api/v1/logins/', routerMap_logins))
testServer.addRouter(new MetisRouter('/api/v1/tests/', routerMap_tests))

export default { testServer }
