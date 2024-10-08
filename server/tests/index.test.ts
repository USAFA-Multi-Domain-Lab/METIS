import { request } from 'chai-http'
import UserAccess, { TUserAccessId } from '../../shared/users/accesses'
import Setup from './setup'
import { testServer } from './start'
import MetisFiles from './suites/MetisFiles'
import MissionApiRoutes from './suites/MissionApiRoutes'
import MissionSchema from './suites/MissionSchema'
import RequestBody from './suites/RequestBody'
import RequestParams from './suites/RequestParams'
import RequestQuery from './suites/RequestQuery'
import UserApiRoutes from './suites/UserApiRoutes'
import UserSchema from './suites/UserSchema'
import Teardown from './teardown'

// Global variables
export const permittedUserAccess: TUserAccessId =
  UserAccess.AVAILABLE_ACCESSES.admin._id
export const agent = request.agent(`localhost:${testServer.port}`)

// run tests
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
