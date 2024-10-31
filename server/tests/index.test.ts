import chai from 'chai'
import chaiHttp from 'chai-http'
import UserAccess, { TUserAccessId } from '../../shared/users/accesses'
import { testServer } from './server'
import Setup from './setup'
import MetisFiles from './suites/MetisFiles'
import MissionApiRoutes from './suites/MissionApiRoutes'
import MissionSchema from './suites/MissionSchema'
import RequestBody from './suites/RequestBody'
import RequestParams from './suites/RequestParams'
import RequestQuery from './suites/RequestQuery'
import UserApiRoutes from './suites/UserApiRoutes'
import UserSchema from './suites/UserSchema'
import Teardown from './teardown'

// Use chai-http
chai.use(chaiHttp)

// Global variables
export const permittedUserAccess: TUserAccessId =
  UserAccess.AVAILABLE_ACCESSES.admin._id
export let agent = chai.request.agent(`localhost:${testServer.port}`)

Setup()
MetisFiles()
MissionApiRoutes()
MissionSchema()
RequestBody()
RequestQuery()
RequestParams()
UserApiRoutes()
UserSchema()
Teardown()
