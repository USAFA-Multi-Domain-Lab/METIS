import chai from 'chai'
import chaiHttp from 'chai-http'
import { testServer } from './server'
import Setup from './setup'
import Middleware from './suites/middleware'
import Missions from './suites/missions'
import TargetEnvironments from './suites/target-environments'
import Users from './suites/users'
import Teardown from './teardown'

// Use chai-http
chai.use(chaiHttp)

// Global variable(s)
export let agent = chai.request.agent(`localhost:${testServer.port}`)

// Run the tests
Setup()
Missions()
Middleware()
Users()
TargetEnvironments()
Teardown()
