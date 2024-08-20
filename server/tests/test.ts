// file path (switches to the "metis-test" database)
process.env.environment = 'TEST'

process.argv

// npm imports
import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'

// metis imports
import Mission, { TCommonMissionJson } from 'metis/missions'
import MetisServer from 'metis/server'
import MissionModel from 'metis/server/database/models/missions'
import UserModel, { hashPassword } from 'metis/server/database/models/users'
import { TCommonUserJson } from 'metis/users'
import UserAccess, { TUserAccessId } from 'metis/users/accesses'
import mongoose from 'mongoose'
import { testLogger } from '../logging'
import ServerUser from '../users'

// global fields
let missionId: string
let server: MetisServer = require('../start').server
let PORT: number = server.port
let MONGO_DB: string = server.mongoDB
const baseUrl = `localhost:${PORT}`
const MONGO_TEST_DB: string = 'metis-test'
const permittedUserAccess: TUserAccessId =
  UserAccess.AVAILABLE_ACCESSES.admin._id
let agent: ChaiHttp.Agent

// json
const userCredentials = {
  username: 'admin',
  password: 'temppass',
}
const createMissionWithNoNodeData: Omit<TCommonMissionJson, 'nodeData'> = {
  name: 'No Node Data Mission (To Delete)',
  introMessage: 'This is a new mission.',
  versionNumber: 1,
  initialResources: 5,
  seed: Mission.DEFAULT_PROPERTIES.seed,
  nodeStructure: {
    'e72aa13b-3d99-406a-a435-b0f5f2e31873': {},
  },
}
const testMission: TCommonMissionJson = {
  name: 'Test Mission (To Delete)',
  introMessage: 'This is a new mission.',
  versionNumber: 1,
  initialResources: 5,
  seed: Mission.DEFAULT_PROPERTIES.seed,
  nodeStructure: {
    '7e6e3ddd-53be-40b1-881e-945cd6891425': {},
  },
  nodeData: [
    {
      structureKey: '7e6e3ddd-53be-40b1-881e-945cd6891425',
      name: 'Test Node',
      color: '#ffffff',
      description: 'This is a new node.',
      preExecutionText: 'Node has not been executed.',
      depthPadding: 0,
      executable: false,
      device: false,
      actions: [
        {
          name: 'Destroy',
          description: 'This will destroy.',
          processTime: 3000,
          successChance: 0.6,
          resourceCost: 1,
          postExecutionSuccessText:
            'Destroy was performed successfully on Test Node.',
          postExecutionFailureText:
            'Destroy was performed unsuccessfully on Test Node.',
          externalEffects: [
            {
              name: 'test',
              description: 'Used for unit test.',
              targetEnvironmentVersion: '0.1',
              targetId: '',
              args: {},
            },
          ],
        },
      ],
    },
  ],
}
const updateMissionWithNoMissionId: TCommonMissionJson = {
  name: 'Updated No Node Data (To Delete)',
  introMessage: 'This is a new mission.',
  versionNumber: 1,
  initialResources: 5,
  seed: Mission.DEFAULT_PROPERTIES.seed,
  nodeStructure: {
    'e72aa13b-3d99-406a-a435-b0f5f2e31873': {},
  },
  nodeData: [
    {
      structureKey: 'e72aa13b-3d99-406a-a435-b0f5f2e31873',
      name: 'Test Node',
      color: '#ffffff',
      description: 'This is a new node.',
      preExecutionText: 'Node has not been executed.',
      depthPadding: 0,
      executable: false,
      device: false,
      actions: [
        {
          name: 'Destroy',
          description: 'This will destroy.',
          processTime: 3000,
          successChance: 0.6,
          resourceCost: 1,
          postExecutionSuccessText:
            'Destroy was performed successfully on Test Node.',
          postExecutionFailureText:
            'Destroy was performed unsuccessfully on Test Node.',
          externalEffects: [],
        },
      ],
    },
  ],
}
const updateMissionWithNoNodeStructure: Omit<
  TCommonMissionJson,
  'nodeStructure'
> = {
  name: 'Update No Node Structure (To Delete)',
  introMessage: 'This is a new mission.',
  versionNumber: 1,
  initialResources: 5,
  seed: Mission.DEFAULT_PROPERTIES.seed,
  nodeData: [
    {
      structureKey: 'e72aa13b-3d99-406a-a435-b0f5f2e31873',
      name: 'Test Node',
      color: '#ffffff',
      description: 'This is a new node.',
      preExecutionText: 'Node has not been executed.',
      depthPadding: 0,
      executable: false,
      device: false,
      actions: [
        {
          name: 'Destroy',
          description: 'This will destroy.',
          processTime: 3000,
          successChance: 0.6,
          resourceCost: 1,
          postExecutionSuccessText:
            'Destroy was performed successfully on Test Node.',
          postExecutionFailureText:
            'Destroy was performed unsuccessfully on Test Node.',
          externalEffects: [],
        },
      ],
    },
  ],
}
const updateMissionWithNoNodeData: Omit<TCommonMissionJson, 'nodeData'> = {
  name: 'No Node Data Mission (To Delete)',
  introMessage: 'This is a new mission.',
  versionNumber: 1,
  initialResources: 5,
  seed: Mission.DEFAULT_PROPERTIES.seed,
  nodeStructure: {
    'e72aa13b-3d99-406a-a435-b0f5f2e31873': {},
  },
}
const correctUpdateTestMission: TCommonMissionJson = {
  name: 'Updated Test Mission (To Delete)',
  introMessage: 'This is a new mission.',
  versionNumber: 1,
  seed: Mission.DEFAULT_PROPERTIES.seed,
  initialResources: 5,
  nodeStructure: {
    '7e6e3ddd-53be-40b1-881e-945cd6891425': {},
  },
  nodeData: [
    {
      structureKey: '7e6e3ddd-53be-40b1-881e-945cd6891425',
      name: 'Test Node',
      color: '#ffffff',
      description: 'This is a new node.',
      preExecutionText: 'Node has not been executed.',
      depthPadding: 0,
      executable: false,
      device: false,
      actions: [
        {
          name: 'Destroy',
          description: 'This will destroy.',
          processTime: 3000,
          successChance: 0.6,
          resourceCost: 1,
          postExecutionSuccessText:
            'Destroy was performed successfully on Test Node.',
          postExecutionFailureText:
            'Destroy was performed unsuccessfully on Test Node.',
          externalEffects: [
            {
              name: 'test',
              description: 'Used for unit test.',
              targetEnvironmentVersion: '0.1',
              targetId: '',
              args: {},
            },
          ],
        },
      ],
    },
  ],
}
const correctUser: { user: TCommonUserJson } = {
  user: {
    _id: new mongoose.Types.ObjectId().toHexString(),
    username: 'test23',
    accessId: UserAccess.AVAILABLE_ACCESSES.student._id,
    expressPermissionIds: [],
    firstName: 'Test',
    lastName: 'User',
    needsPasswordReset: false,
    password: 'password',
  },
}
let newCorrectUser: { user: TCommonUserJson } = {
  user: {
    _id: new mongoose.Types.ObjectId().toHexString(),
    username: 'test24',
    accessId: UserAccess.AVAILABLE_ACCESSES.student._id,
    expressPermissionIds: [],
    firstName: 'Test',
    lastName: 'User',
    needsPasswordReset: false,
    password: 'password',
  },
}
const userWithNoPassword: { user: TCommonUserJson } = {
  user: {
    _id: new mongoose.Types.ObjectId().toHexString(),
    username: 'test23',
    accessId: UserAccess.AVAILABLE_ACCESSES.student._id,
    expressPermissionIds: [],
    firstName: 'Test',
    lastName: 'User',
    needsPasswordReset: false,
  },
}

// Sets up the test environment
before(async function () {
  // Starts the test server
  try {
    await server.serve()

    // Creates a session with a user because
    // certain API routes require authentication
    // for access
    chai.use(chaiHttp)
    agent = chai.request.agent(baseUrl)

    // Checks to make sure the correct database is being used
    if (MONGO_DB === MONGO_TEST_DB) {
      // Creates a session with a user because
      // certain API routes require authentication
      // for access
      let loginResponse = await agent
        .post('/api/v1/logins/')
        .send(userCredentials)
      expect(loginResponse).to.have.status(200)

      // Gets the mission's ID and missionName of the mission
      let missionResponse = await agent.get('/api/v1/missions/')
      expect(missionResponse).to.have.status(200)
      missionId = missionResponse.body[0]._id
    } else {
      throw new Error(
        'Database is not using "metis-test." Please make sure the test database is running.',
      )
    }
  } catch (error: any) {
    if (
      error.message ===
      'Database is not using "metis-test." Please make sure the test database is running.'
    ) {
      testLogger.error(error)
      process.exit(1)
    } else {
      testLogger.error(error)
      throw error
    }
  }
})

// Tests for the export/import mission feature
describe('Export/Import File Tests', function () {
  it('Calling the missions route on the API should return a successful (200) response', async function () {
    try {
      let response = await agent.get('/api/v1/missions/')
      expect(response).to.have.status(200)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('User should be logged in as an admin to access the import and/or export API', async function () {
    try {
      let response = await agent.get('/api/v1/logins/')
      expect(response.body.user.accessId).to.equal(permittedUserAccess)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Calling the export route with the correct name and "_id" should return a successful (200) response', async function () {
    try {
      let response = await agent.get(`/api/v1/missions/${missionId}/export/`)
      expect(response).to.have.status(200)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Calling the export route on the API without a "_id" as a query should return a bad request (400) response', async function () {
    try {
      let response = await agent.get(`/api/v1/missions/''/export/`)
      expect(response).to.have.status(400)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Calling the export route on the API with a "_id" that does not exist should return a not found (404) response', async function () {
    try {
      let response = await agent.get(
        `/api/v1/missions/65328d4c978db2d9540048eb/export/`,
      )
      expect(response).to.have.status(404)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Calling the import route on the API with a valid file should have a "successfulImportCount" set to 1, "failedImportCount" set to 0, and an array called "failedImportErrorMessages" with a length of 0', async function () {
    try {
      let response = await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Valid Mission.cesar')
      expect(response).to.have.status(200)
      expect(response.body.successfulImportCount).to.equal(1)
      expect(response.body.failedImportCount).to.equal(0)
      expect(response.body.failedImportErrorMessages.length).to.equal(0)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Calling the import route on the API with an invalid file should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
    try {
      let response = await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Invalid Mission.cesar')
      expect(response).to.have.status(200)
      expect(response.body.successfulImportCount).to.equal(0)
      expect(response.body.failedImportCount).to.equal(1)
      expect(response.body.failedImportErrorMessages.length).to.equal(1)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Calling the import route on the API with a file that has valid contents, but an invalid extension should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
    try {
      let response = await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Attack Mission.jpeg')
      expect(response).to.have.status(200)
      expect(response.body.successfulImportCount).to.equal(0)
      expect(response.body.failedImportCount).to.equal(1)
      expect(response.body.failedImportErrorMessages.length).to.equal(1)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Calling the import route on the API with a file that has a "schemaBuildNumber" missing should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
    try {
      let response = await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/No schemaBuildNumber Mission.cesar')
      expect(response).to.have.status(200)
      expect(response.body.successfulImportCount).to.equal(0)
      expect(response.body.failedImportCount).to.equal(1)
      expect(response.body.failedImportErrorMessages.length).to.equal(1)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Calling the import route on the API with a file that has a syntax error should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
    try {
      let response = await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Syntax Error Mission.cesar')
      expect(response).to.have.status(200)
      expect(response.body.successfulImportCount).to.equal(0)
      expect(response.body.failedImportCount).to.equal(1)
      expect(response.body.failedImportErrorMessages.length).to.equal(1)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Calling the import route on the API with a file that has an extra invalid property in the node data should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
    try {
      let response = await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Extra Invalid Property Mission.cesar')
      expect(response).to.have.status(200)
      expect(response.body.successfulImportCount).to.equal(0)
      expect(response.body.failedImportCount).to.equal(1)
      expect(response.body.failedImportErrorMessages.length).to.equal(1)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Calling the import route on the API with a file that has extra data in the node data should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
    try {
      let response = await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Extra Data Mission.cesar')
      expect(response).to.have.status(200)
      expect(response.body.successfulImportCount).to.equal(0)
      expect(response.body.failedImportCount).to.equal(1)
      expect(response.body.failedImportErrorMessages.length).to.equal(1)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Calling the import route on the API with a multiple valid files should have a "successfulImportCount" set to 2, "failedImportCount" set to 0, and an array called "failedImportErrorMessages" with a length of 0', async function () {
    try {
      let response = await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Valid Mission.cesar')
        .attach('files', './tests/static/Valid Mission(1).cesar')

      expect(response).to.have.status(200)
      expect(response.body.successfulImportCount).to.equal(2)
      expect(response.body.failedImportCount).to.equal(0)
      expect(response.body.failedImportErrorMessages.length).to.equal(0)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Calling the import route on the API with one valid file and one invalid file should have a "successfulImportCount" set to 1, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
    try {
      let response = await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Valid Mission.cesar')
        .attach('files', './tests/static/Invalid Mission.cesar')

      expect(response).to.have.status(200)
      expect(response.body.successfulImportCount).to.equal(1)
      expect(response.body.failedImportCount).to.equal(1)
      expect(response.body.failedImportErrorMessages.length).to.equal(1)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Calling the import route on the API with a file that has an invalid extension (i.e., should be a .svg, .png, .pdf, etc. and is a .cesar instead) should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
    try {
      let response = await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/bolt-solid.cesar')

      expect(response).to.have.status(200)
      expect(response.body.successfulImportCount).to.equal(0)
      expect(response.body.failedImportCount).to.equal(1)
      expect(response.body.failedImportErrorMessages.length).to.equal(1)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 9 or less and a ".cesar" extension should have a "successfulImportCount" set to 1, "failedImportCount" set to 0, and an array called "failedImportErrorMessages" with a length of 0', async function () {
    try {
      let response = await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Schema Build 4.cesar')

      expect(response).to.have.status(200)
      expect(response.body.successfulImportCount).to.equal(1)
      expect(response.body.failedImportCount).to.equal(0)
      expect(response.body.failedImportErrorMessages.length).to.equal(0)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 9 or less and a ".metis" extension should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
    try {
      let response = await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Schema Build 4.metis')

      expect(response).to.have.status(200)
      expect(response.body.successfulImportCount).to.equal(0)
      expect(response.body.failedImportCount).to.equal(1)
      expect(response.body.failedImportErrorMessages.length).to.equal(1)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 10 or greater and a ".metis" extension should have a "successfulImportCount" set to 1, "failedImportCount" set to 0, and an array called "failedImportErrorMessages" with a length of 0', async function () {
    try {
      let response = await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Schema Build 10.metis')

      expect(response).to.have.status(200)
      expect(response.body.successfulImportCount).to.equal(1)
      expect(response.body.failedImportCount).to.equal(0)
      expect(response.body.failedImportErrorMessages.length).to.equal(0)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 10 or greater and a ".cesar" extension should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
    try {
      let response = await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Schema Build 10.cesar')

      expect(response).to.have.status(200)
      expect(response.body.successfulImportCount).to.equal(0)
      expect(response.body.failedImportCount).to.equal(1)
      expect(response.body.failedImportErrorMessages.length).to.equal(1)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 10 or greater and a ".metis" extension and a valid file that has a "schemaBuildNumber" of 9 or less and a ".metis" extension should have a "successfulImportCount" set to 1, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
    try {
      let response = await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Schema Build 10.metis')
        .attach('files', './tests/static/Schema Build 4.metis')

      expect(response).to.have.status(200)
      expect(response.body.successfulImportCount).to.equal(1)
      expect(response.body.failedImportCount).to.equal(1)
      expect(response.body.failedImportErrorMessages.length).to.equal(1)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 10 or greater and a ".metis" extension, a valid file that has a "schemaBuildNumber" of 9 or less and a ".metis" extension, a file that has an invalid extension (i.e., should be a .svg, .png, .pdf, etc. and is a .cesar instead), and a file that has valid contents, but an invalid extension should have a "successfulImportCount" set to 1, "failedImportCount" set to 3, and an array called "failedImportErrorMessages" with a length of 3', async function () {
    try {
      let response = await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Schema Build 10.metis')
        .attach('files', './tests/static/Schema Build 4.metis')
        .attach('files', './tests/static/bolt-solid.cesar')
        .attach('files', './tests/static/Attack Mission.jpeg')

      expect(response).to.have.status(200)
      expect(response.body.successfulImportCount).to.equal(1)
      expect(response.body.failedImportCount).to.equal(3)
      expect(response.body.failedImportErrorMessages.length).to.equal(3)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })
})

// Tests for each mission route
describe('API Mission Routes', function () {
  // Stores all the missions that were in
  // the database before the tests were run
  let createdMissionIdArray: string[] = []

  it('User should be logged in as an admin to be able to post missions to the database via the API', async function () {
    try {
      let response = await agent.get('/api/v1/logins/')

      expect(response.body.user.accessId).to.equal(permittedUserAccess)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Calling the missions route without any queries should return a successful (200) response', async function () {
    try {
      let response = await agent.get(`/api/v1/missions`)

      expect(response).to.have.status(200)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Sending the wrong query is ignored and a successful (200) response should be returned', async function () {
    try {
      let response = await agent.get(`/api/v1/missions`).query({
        wrongQueryProperty: 'alsdkfdskjfsl',
      })

      expect(response).to.have.status(200)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Getting a mission where the "_id" is not of type "objectId" in the query of the request should return a bad request (400) response', async function () {
    try {
      let response = await agent.get(`/api/v1/missions/${2}`)

      expect(response).to.have.status(400)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Getting a mission with all the correct properties in the params of the request should result in a successful (200) response', async function () {
    try {
      let response = await agent.get(`/api/v1/missions/${missionId}`)

      expect(response).to.have.status(200)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Getting the environment should return a successful (200) response', async function () {
    try {
      let response = await agent.get(`/api/v1/missions/environment/`)

      expect(response).to.have.status(200)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Creating a mission with (a) missing property/properties in the body of the request should return a bad request (400) response', async function () {
    try {
      let response = await agent
        .post('/api/v1/missions/')
        .set('Content-Type', 'application/json')
        .send(createMissionWithNoNodeData)

      expect(response).to.have.status(400)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Creating a mission with all the correct properties in the body of the request should return a successful (200) response', async function () {
    try {
      let response = await agent
        .post('/api/v1/missions/')
        .set('Content-Type', 'application/json')
        .send(testMission)

      expect(response).to.have.status(200)
      createdMissionIdArray.push(response.body._id)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Updating a mission with (a) missing property/properties that is required (_id) in the body of the request should return a bad request (400) response', async function () {
    try {
      let response = await agent
        .put('/api/v1/missions/')
        .set('Content-Type', 'application/json')
        .send(updateMissionWithNoMissionId)

      expect(response).to.have.status(400)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Updating a mission where the nodeStructure is defined, but the nodeData is undefined in the body of the request should return an internal server error (500) response', async function () {
    missionId = createdMissionIdArray[0]
    updateMissionWithNoNodeData._id = missionId

    try {
      let response = await agent
        .put('/api/v1/missions/')
        .set('Content-Type', 'application/json')
        .send(updateMissionWithNoNodeData)

      expect(response).to.have.status(500)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Updating a mission where the nodeData is defined, but the nodeStructure is undefined in the body of the request should return an internal server error (500) response', async function () {
    missionId = createdMissionIdArray[0]
    updateMissionWithNoNodeStructure._id = missionId

    try {
      let response = await agent
        .put('/api/v1/missions/')
        .set('Content-Type', 'application/json')
        .send(updateMissionWithNoNodeStructure)

      expect(response).to.have.status(500)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Updating a mission with all the correct properties in the body of the request should return a successful (200) response', async function () {
    missionId = createdMissionIdArray[0]
    correctUpdateTestMission._id = missionId

    try {
      let response = await agent
        .put('/api/v1/missions/')
        .set('Content-Type', 'application/json')
        .send(correctUpdateTestMission)

      expect(response).to.have.status(200)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Copying a mission with (a) missing property/properties in the body of the request should return a bad request (400) response', async function () {
    try {
      let response = await agent
        .put('/api/v1/missions/copy/')
        .set('Content-Type', 'application/json')
        .send({ copyName: 'Copied Mission' })

      expect(response).to.have.status(400)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Copying a mission with all the correct properties in the body of the request should return a successful (200) response', async function () {
    missionId = createdMissionIdArray[0]

    try {
      let response = await agent
        .put('/api/v1/missions/copy/')
        .set('Content-Type', 'application/json')
        .send({ copyName: 'Copied Mission', originalId: missionId })

      expect(response).to.have.status(200)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Deleting a mission with the wrong type for the "_id" in the params of the request should return a bad request (400) response', async function () {
    try {
      let response = await agent.delete(`/api/v1/missions/${2}`)

      expect(response).to.have.status(400)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Deleting a mission with all the correct properties in the params of the request should return a successful (200) response', async function () {
    missionId = createdMissionIdArray[0]

    try {
      let response = await agent.delete(`/api/v1/missions/${missionId}`)

      expect(response).to.have.status(200)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })
})

// Tests for the middleware function used to
// validate the data that is sent in the request
// body of the API routes
describe('Request Body Validation', function () {
  let STRING = '*'
  let STRING_50_CHAR = '*'.repeat(50)
  let STRING_128_CHAR = '*'.repeat(128)
  let STRING_255_CHAR = '*'.repeat(255)
  let STRING_256_CHAR = '*'.repeat(256)
  let STRING_512_CHAR = '*'.repeat(512)
  let STRING_1024_CHAR = '*'.repeat(1024)
  let STRING_MEDIUMTEXT = '*'.repeat(10000)
  let NUMBER = 2
  let BOOLEAN = true
  let OBJECT = { string: 'string' }
  let OBJECTID = '643ea778c10a4de66a9448d0'

  it('Sending a request with all required and optional body keys and their correct types results in a successful (200) response', async function () {
    try {
      let response = await agent
        .post('/api/v1/test/request-body-filter-check/')
        .set('Content-Type', 'application/json')
        .send({
          bodyKeys: {
            STRING: STRING,
            STRING_50_CHAR: STRING_50_CHAR,
            STRING_128_CHAR: STRING_128_CHAR,
            STRING_255_CHAR: STRING_255_CHAR,
            STRING_256_CHAR: STRING_256_CHAR,
            STRING_512_CHAR: STRING_512_CHAR,
            STRING_1024_CHAR: STRING_1024_CHAR,
            STRING_MEDIUMTEXT: STRING_MEDIUMTEXT,
            NUMBER: NUMBER,
            BOOLEAN: BOOLEAN,
            OBJECT: OBJECT,
            OBJECTID: OBJECTID,
          },
          keys: {
            STRING: STRING,
            BOOLEAN: BOOLEAN,
          },
        })

      expect(response).to.have.status(200)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Sending a request with all required and optional body keys and their types being incorrect results in a bad request (400) response', async function () {
    try {
      let response = await agent
        .post('/api/v1/test/request-body-filter-check/')
        .set('Content-Type', 'application/json')
        .send({
          bodyKeys: {
            STRING: NUMBER,
            STRING_50_CHAR: STRING_128_CHAR,
            STRING_128_CHAR: STRING_255_CHAR,
            STRING_255_CHAR: STRING_256_CHAR,
            STRING_256_CHAR: STRING_512_CHAR,
            STRING_512_CHAR: STRING_1024_CHAR,
            STRING_1024_CHAR: STRING_MEDIUMTEXT,
            STRING_MEDIUMTEXT: NUMBER,
            NUMBER: BOOLEAN,
            BOOLEAN: STRING,
            OBJECT: OBJECTID,
            OBJECTID: OBJECT,
          },
          keys: {
            STRING: BOOLEAN,
            BOOLEAN: STRING,
          },
        })

      expect(response).to.have.status(400)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Sending a request with a missing body key (OBJECTID) that is required results in a bad request (400) request', async function () {
    try {
      let response = await agent
        .post('/api/v1/test/request-body-filter-check/')
        .set('Content-Type', 'application/json')
        .send({
          bodyKeys: {
            STRING: STRING,
            STRING_50_CHAR: STRING_50_CHAR,
            STRING_128_CHAR: STRING_128_CHAR,
            STRING_255_CHAR: STRING_255_CHAR,
            STRING_256_CHAR: STRING_256_CHAR,
            STRING_512_CHAR: STRING_512_CHAR,
            STRING_1024_CHAR: STRING_1024_CHAR,
            STRING_MEDIUMTEXT: STRING_MEDIUMTEXT,
            NUMBER: NUMBER,
            BOOLEAN: BOOLEAN,
            OBJECT: OBJECT,
          },
          keys: {
            STRING: STRING,
            BOOLEAN: BOOLEAN,
          },
        })

      expect(response).to.have.status(400)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Sending a request with a missing body key (BOOLEAN) that is optional results in a successful (200) request', async function () {
    try {
      let response = await agent
        .post('/api/v1/test/request-body-filter-check/')
        .set('Content-Type', 'application/json')
        .send({
          bodyKeys: {
            STRING: STRING,
            STRING_50_CHAR: STRING_50_CHAR,
            STRING_128_CHAR: STRING_128_CHAR,
            STRING_255_CHAR: STRING_255_CHAR,
            STRING_256_CHAR: STRING_256_CHAR,
            STRING_512_CHAR: STRING_512_CHAR,
            STRING_1024_CHAR: STRING_1024_CHAR,
            STRING_MEDIUMTEXT: STRING_MEDIUMTEXT,
            NUMBER: NUMBER,
            OBJECT: OBJECT,
            OBJECTID: OBJECTID,
          },
          keys: {
            STRING: STRING,
          },
        })

      expect(response).to.have.status(200)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Sending a request with additional body keys results in those additional body keys being removed from the request body', async function () {
    try {
      let response = await agent
        .post('/api/v1/test/request-body-filter-check/')
        .set('Content-Type', 'application/json')
        .send({
          bodyKeys: {
            STRING: STRING,
            STRING_50_CHAR: STRING_50_CHAR,
            STRING_128_CHAR: STRING_128_CHAR,
            STRING_255_CHAR: STRING_255_CHAR,
            STRING_256_CHAR: STRING_256_CHAR,
            STRING_512_CHAR: STRING_512_CHAR,
            STRING_1024_CHAR: STRING_1024_CHAR,
            STRING_MEDIUMTEXT: STRING_MEDIUMTEXT,
            NUMBER: NUMBER,
            BOOLEAN: BOOLEAN,
            OBJECT: OBJECT,
            OBJECTID: OBJECTID,
            EXTRA_KEY: 'extra key',
          },
          keys: {
            STRING: STRING,
            BOOLEAN: BOOLEAN,
          },
        })

      expect(response).to.have.status(200)
      expect(response.body.bodyKeys.EXTRA_KEY).to.equal(undefined)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })
})

// Tests for the middleware function used to
// validate the data sent in the request query
// of the API routes
describe('Request Query Validation', function () {
  let string: string = 'string'
  let number: number = 3.5
  let integer: number = 3
  let boolean: boolean = true
  let objectId: string = '643ea778c10a4de66a9448d0'

  it('Sending a request with all required and optional query keys and their correct types results in a successful (200) response', async function () {
    try {
      let response = await agent
        .get(`/api/v1/test/request-query-type-check/`)
        .query({
          string: string,
          number: number,
          integer: integer,
          boolean: boolean,
          objectId: objectId,
        })

      expect(response).to.have.status(200)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Sending a request with all required and optional query keys and their types being incorrect results in a bad request (400) response', async function () {
    try {
      let response = await agent
        .get(`/api/v1/test/request-query-type-check/`)
        .query({
          string: number,
          number: string,
          integer: number,
          boolean: objectId,
          objectId: boolean,
        })

      expect(response).to.have.status(400)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Sending a request with a missing query key that is required results in a bad request (400) request', async function () {
    try {
      let response = await agent
        .get(`/api/v1/test/request-query-type-check/`)
        .query({
          string: string,
          number: number,
          integer: integer,
          boolean: boolean,
        })

      expect(response).to.have.status(400)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Sending a request with a missing query key (string) that is optional results in a successful (200) request', async function () {
    try {
      let response = await agent
        .get(`/api/v1/test/request-query-type-check/`)
        .query({
          number: number,
          integer: integer,
          boolean: boolean,
          objectId: objectId,
        })

      expect(response).to.have.status(200)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Sending a request with additional query keys results in those additional query keys being removed from the request query', async function () {
    try {
      let response = await agent
        .get(`/api/v1/test/request-query-type-check/`)
        .query({
          number: number,
          integer: integer,
          boolean: boolean,
          objectId: objectId,
          extraKey: 'extra key',
        })

      expect(response).to.have.status(200)
      expect(response.body.query.extraKey).to.equal(undefined)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })
})

// Tests for the middleware function used to
// validate the data sent in the request params
// of the API routes
describe('Request Params Validation', function () {
  let string: string = 'string'
  let number: number = 3.5
  let objectId: string = '6532b0b5978db2d9540048fa'

  it('Sending a request with all params keys and their correct types results in a successful (200) response', async function () {
    try {
      let response = await agent.get(
        `/api/v1/test/request-params-type-check/${string}/${number}/${objectId}`,
      )

      expect(response).to.have.status(200)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Sending a request with all params keys and their types being incorrect results in a bad request (400) response', async function () {
    try {
      let response = await agent.get(
        `/api/v1/test/request-params-type-check/${objectId}/${string}/${number}`,
      )

      expect(response).to.have.status(400)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Sending a request with a missing params key (OBJECTID) results in a not found (404) request', async function () {
    try {
      let response = await agent.get(
        `/api/v1/test/request-params-type-check/${string}/${number}/`,
      )

      expect(response).to.have.status(404)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })
})

// Tests the mission schema validation functions that are
// used to validate data that is trying to be sent
// to the database to be stored.
describe('Mission Schema Validation', function () {
  it('Creating a mission with all the correct properties should save the mission to the database', async function () {
    // Grab the mission data
    const missionData = testMission
    // Create a new mission model
    let mission = new MissionModel(missionData)
    // Grab the "_id" that is auto-generated
    // to use for the next test
    missionId = mission._id

    try {
      // Save the mission to the database
      let savedMission = await mission.save()
      // The retrieved mission should have the same
      // name as the test mission
      expect(savedMission.name).to.equal(testMission.name)
      // The retrieved mission should have the same
      // introMessage as the test mission
      expect(savedMission.introMessage).to.equal(testMission.introMessage)
      // The retrieved mission should have the same
      // versionNumber as the test mission
      expect(savedMission.versionNumber).to.equal(testMission.versionNumber)
      // The retrieved mission's seed property should
      // be the same as the test mission's seed property
      expect(savedMission.seed).to.equal(testMission.seed)
      // The retrieved mission should have the same
      // amount of initialResources as the test mission
      expect(savedMission.initialResources).to.equal(
        testMission.initialResources,
      )
      // The retrieved mission should have the same
      // nodeStructure as the test mission
      expect(savedMission.nodeStructure).to.deep.equal(
        testMission.nodeStructure,
      )
      // The retrieved mission should have the same
      // nodeData as the test mission
      expect(savedMission.nodeData[0].nodeID).to.equal(
        testMission.nodeData[0]._id,
      )
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      throw error
    }
  })

  it('Querying for the newly created mission should return the correct mission', async function () {
    try {
      // Query for the mission with the "_id"
      // set from the previous test
      let retrievedMission = await MissionModel.findOne({
        _id: missionId,
      }).exec()
      // The retrieved mission should have the same
      // name as the test mission
      expect(retrievedMission.name).to.equal(testMission.name)
      // The retrieved mission should have the same
      // introMessage as the test mission
      expect(retrievedMission.introMessage).to.equal(testMission.introMessage)
      // The retrieved mission should have the same
      // versionNumber as the test mission
      expect(retrievedMission.versionNumber).to.equal(testMission.versionNumber)
      // The retrieved mission's seed property should
      // be the same as the test mission's seed property
      expect(retrievedMission.seed).to.equal(testMission.seed)
      // The retrieved mission should have the same
      // amount of initialResources as the test mission
      expect(retrievedMission.initialResources).to.equal(
        testMission.initialResources,
      )
      // The retrieved mission should have the same
      // nodeStructure as the test mission
      expect(retrievedMission.nodeStructure).to.deep.equal(
        testMission.nodeStructure,
      )
      // The retrieved mission should have the same
      // nodeData as the test mission
      expect(retrievedMission.nodeData[0].nodeID).to.equal(
        testMission.nodeData[0]._id,
      )
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      throw error
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#fffffg") should result in a validation error', async function () {
    // Grab the mission data
    const missionData = testMission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#fffffg'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      await mission.save()
    } catch (error: any) {
      // Check to make sure there was an error
      expect(error).to.not.equal(null)
      // The error should be a validation error
      expect(error.name).to.equal('ValidationError')
      // The error message should be a validation error
      expect(error.message).to.equal(
        'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `#fffffg`',
      )
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("ffffff") should result in an internal server error (500) response', async function () {
    // Grab the mission data
    const missionData = testMission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = 'ffffff'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      await mission.save()
    } catch (error: any) {
      // Check to make sure there was an error
      expect(error).to.not.equal(null)
      // The error should be a validation error
      expect(error.name).to.equal('ValidationError')
      // The error message should be a validation error
      expect(error.message).to.equal(
        'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `ffffff`',
      )
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#fffffff") should result in an internal server error (500) response', async function () {
    // Grab the mission data
    const missionData = testMission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#fffffff'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      await mission.save()
    } catch (error: any) {
      // Check to make sure there was an error
      expect(error).to.not.equal(null)
      // The error should be a validation error
      expect(error.name).to.equal('ValidationError')
      // The error message should be a validation error
      expect(error.message).to.equal(
        'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `#fffffff`',
      )
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("white") should result in an internal server error (500) response', async function () {
    // Grab the mission data
    const missionData = testMission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = 'white'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      await mission.save()
    } catch (error: any) {
      // Check to make sure there was an error
      expect(error).to.not.equal(null)
      // The error should be a validation error
      expect(error.name).to.equal('ValidationError')
      // The error message should be a validation error
      expect(error.message).to.equal(
        'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `white`',
      )
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#white") should result in an internal server error (500) response', async function () {
    // Grab the mission data
    const missionData = testMission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#white'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      await mission.save()
    } catch (error: any) {
      // Check to make sure there was an error
      expect(error).to.not.equal(null)
      // The error should be a validation error
      expect(error.name).to.equal('ValidationError')
      // The error message should be a validation error
      expect(error.message).to.equal(
        'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `#white`',
      )
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("asfjsdjkf #ffffff sadlkfsld") should result in an internal server error (500) response', async function () {
    // Grab the mission data
    const missionData = testMission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = 'asfjsdjkf #ffffff sadlkfsld'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      await mission.save()
    } catch (error: any) {
      // Check to make sure there was an error
      expect(error).to.not.equal(null)
      // The error should be a validation error
      expect(error.name).to.equal('ValidationError')
      // The error message should be a validation error
      expect(error.message).to.equal(
        'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `asfjsdjkf #ffffff sadlkfsld`',
      )
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("asfjsdjkf#ffffffsadlkfsld") should result in an internal server error (500) response', async function () {
    // Grab the mission data
    const missionData = testMission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = 'asfjsdjkf#ffffffsadlkfsld'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      await mission.save()
    } catch (error: any) {
      // Check to make sure there was an error
      expect(error).to.not.equal(null)
      // The error should be a validation error
      expect(error.name).to.equal('ValidationError')
      // The error message should be a validation error
      expect(error.message).to.equal(
        'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `asfjsdjkf#ffffffsadlkfsld`',
      )
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#6545169") should result in an internal server error (500) response', async function () {
    // Grab the mission data
    const missionData = testMission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#6545169'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      await mission.save()
    } catch (error: any) {
      // Check to make sure there was an error
      expect(error).to.not.equal(null)
      // The error should be a validation error
      expect(error.name).to.equal('ValidationError')
      // The error message should be a validation error
      expect(error.message).to.equal(
        'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `#6545169`',
      )
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#abcdef99") should result in an internal server error (500) response', async function () {
    // Grab the mission data
    const missionData = testMission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#abcdef99'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      await mission.save()
    } catch (error: any) {
      // Check to make sure there was an error
      expect(error).to.not.equal(null)
      // The error should be a validation error
      expect(error.name).to.equal('ValidationError')
      // The error message should be a validation error
      expect(error.message).to.equal(
        'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `#abcdef99`',
      )
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("abcdef") should result in an internal server error (500) response', async function () {
    // Grab the mission data
    const missionData = testMission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = 'abcdef'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      await mission.save()
    } catch (error: any) {
      // Check to make sure there was an error
      expect(error).to.not.equal(null)
      // The error should be a validation error
      expect(error.name).to.equal('ValidationError')
      // The error message should be a validation error
      expect(error.message).to.equal(
        'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `abcdef`',
      )
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("fff") should result in an internal server error (500) response', async function () {
    // Grab the mission data
    const missionData = testMission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = 'fff'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      await mission.save()
    } catch (error: any) {
      // Check to make sure there was an error
      expect(error).to.not.equal(null)
      // The error should be a validation error
      expect(error.name).to.equal('ValidationError')
      // The error message should be a validation error
      expect(error.message).to.equal(
        'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `fff`',
      )
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#fff") should result in an internal server error (500) response', async function () {
    // Grab the mission data
    const missionData = testMission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#fff'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      await mission.save()
    } catch (error: any) {
      // Check to make sure there was an error
      expect(error).to.not.equal(null)
      // The error should be a validation error
      expect(error.name).to.equal('ValidationError')
      // The error message should be a validation error
      expect(error.message).to.equal(
        'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `#fff`',
      )
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#*&@^%!") should result in an internal server error (500) response', async function () {
    // Grab the mission data
    const missionData = testMission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#*&@^%!'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      await mission.save()
    } catch (error: any) {
      // Check to make sure there was an error
      expect(error).to.not.equal(null)
      // The error should be a validation error
      expect(error.name).to.equal('ValidationError')
      // The error message should be a validation error
      expect(error.message).to.equal(
        'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `#*&@^%!`',
      )
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#+89496") should result in an internal server error (500) response', async function () {
    // Grab the mission data
    const missionData = testMission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#+89496'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      await mission.save()
    } catch (error: any) {
      // Check to make sure there was an error
      expect(error).to.not.equal(null)
      // The error should be a validation error
      expect(error.name).to.equal('ValidationError')
      // The error message should be a validation error
      expect(error.message).to.equal(
        'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `#+89496`',
      )
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#89a96+") should result in an internal server error (500) response', async function () {
    // Grab the mission data
    const missionData = testMission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#89a96+'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      await mission.save()
    } catch (error: any) {
      // Check to make sure there was an error
      expect(error).to.not.equal(null)
      // The error should be a validation error
      expect(error.name).to.equal('ValidationError')
      // The error message should be a validation error
      expect(error.message).to.equal(
        'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `#89a96+`',
      )
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#8996+") should result in an internal server error (500) response', async function () {
    // Grab the mission data
    const missionData = testMission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#8996+'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      await mission.save()
    } catch (error: any) {
      // Check to make sure there was an error
      expect(error).to.not.equal(null)
      // The error should be a validation error
      expect(error.name).to.equal('ValidationError')
      // The error message should be a validation error
      expect(error.message).to.equal(
        'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `#8996+`',
      )
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#896+") should result in an internal server error (500) response', async function () {
    // Grab the mission data
    const missionData = testMission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#896+'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      await mission.save()
    } catch (error: any) {
      // Check to make sure there was an error
      expect(error).to.not.equal(null)
      // The error should be a validation error
      expect(error.name).to.equal('ValidationError')
      // The error message should be a validation error
      expect(error.message).to.equal(
        'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `#896+`',
      )
    }
  })

  it('Creating a mission with a mission-node that has a color that is a valid hex color code ("#acde58") should result in a successful (200) response', async function () {
    // Grab the mission data
    const missionData = testMission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#acde58'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      let savedMission = await mission.save()

      expect(savedMission.nodeData[0].color).to.equal('#acde58')
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      throw error
    }
  })

  it('Creating a mission with HTMl tags that are not allowed ("<script></script>") in the mission should result in those tags being removed from the mission', async function () {
    // Grab the mission data
    const missionData = testMission
    // Set the introMessage of the mission to a string with a "script" tag
    missionData.introMessage =
      "<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a href='https://google.com' rel='noopener noreferrer' target='_blank'>message</a> here.</p><script>function consoleLog() {console.log('Successful script execution.')} consoleLog()</script>"
    // Set the preExecutionText of the first mission-node to a string with an improper "p" tag
    missionData.nodeData[0].preExecutionText =
      "<p>Node has not been executed.</p><p href='https://google.com>Google</p>'"
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      let savedMission = await mission.save()
      // The introMessage of the mission should be the same as what was set above
      expect(savedMission.introMessage).to.equal(
        '<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a target="_blank" rel="noopener noreferrer" href="https://google.com">message</a> here.</p>',
      )
      // The preExecutionText of the first mission-node should be the same as what was set above
      expect(savedMission.nodeData[0].preExecutionText).to.equal(
        '<p>Node has not been executed.</p>',
      )
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      throw error
    }
  })

  it('Creating a mission with HTMl tags that are not allowed ("<style></style>") in the mission should result in those tags being removed from the mission', async function () {
    // Grab the mission data
    const missionData = testMission
    // Set the introMessage of the mission to a string with a "style" tag
    missionData.introMessage =
      "<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a href='https://google.com' rel='noopener noreferrer' target='_blank'>message</a> here.</p><style>.Content {font-size: 25px;}</style>"
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      let savedMission = await mission.save()
      // The introMessage of the mission should be the same as what was set above
      expect(savedMission.introMessage).to.equal(
        '<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a target="_blank" rel="noopener noreferrer" href="https://google.com">message</a> here.</p>',
      )
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      throw error
    }
  })

  it('Creating a mission with HTMl tags that are not allowed ("<iframe></iframe>") in the mission should result in those tags being removed from the mission', async function () {
    // Grab the mission data
    const missionData = testMission
    // Set the introMessage of the mission to a string with an "iframe" tag
    missionData.introMessage = `<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a href='https://google.com' rel='noopener noreferrer' target='_blank'>message</a> here.</p><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13026964.31028058!2d-106.25408262379291!3d37.1429207037123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x54eab584e432360b%3A0x1c3bb99243deb742!2sUnited%20States!5e0!3m2!1sen!2sus!4v1695930378392!5m2!1sen!2sus" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      let savedMission = await mission.save()
      // The introMessage of the mission should be the same as what was set above
      expect(savedMission.introMessage).to.equal(
        '<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a target="_blank" rel="noopener noreferrer" href="https://google.com">message</a> here.</p>',
      )
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      throw error
    }
  })

  it('Creating a mission with HTMl tags that are not allowed ("<input />") in the mission should result in those tags being removed from the mission', async function () {
    // Grab the mission data
    const missionData = testMission
    // Set the introMessage of the mission to a string with an "input" tag
    missionData.introMessage = `<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a href='https://google.com' rel='noopener noreferrer' target='_blank'>message</a> here.</p><input type="text" id="fname" name="fname" value="John">`
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      let savedMission = await mission.save()
      // The introMessage of the mission should be the same as what was set above
      expect(savedMission.introMessage).to.equal(
        '<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a target="_blank" rel="noopener noreferrer" href="https://google.com">message</a> here.</p>',
      )
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      throw error
    }
  })
})

// Tests for each of the API routes that are used
// to access the user data in the database
describe('User API Routes', function () {
  it('User should be logged in as an admin to be able to create users via the API', async function () {
    try {
      let response = await agent.get('/api/v1/logins/')

      expect(response.body.user.accessId).to.equal(permittedUserAccess)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Creating a user with (a) missing property/properties in the body of the request should return a bad request (400) response', async function () {
    try {
      let response = await agent
        .post('/api/v1/users/')
        .set('Content-Type', 'application/json')
        .send(userWithNoPassword)

      expect(response).to.have.status(400)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Creating a user with all the correct properties in the body of the request should return a successful (200) response', async function () {
    try {
      let response = await agent
        .post('/api/v1/users/')
        .set('Content-Type', 'application/json')
        .send(correctUser)

      expect(response).to.have.status(200)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it(`Updating a user's first and last name should return a successful (200) response`, async function () {
    correctUser.user.firstName = 'updatedFirstName'
    correctUser.user.lastName = 'updatedLastName'

    try {
      let response = await agent
        .put('/api/v1/users/')
        .set('Content-Type', 'application/json')
        .send(correctUser)

      let user: any = response.body.user
      expect(user.firstName).to.equal('updatedFirstName')
      expect(user.lastName).to.equal('updatedLastName')
      expect(response).to.have.status(200)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })

  it('Deleting a mission with all the correct properties in the query of the request should return a successful (200) response', async function () {
    try {
      let response = await agent.delete(`/api/v1/users/${correctUser.user._id}`)

      expect(response).to.have.status(200)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }
  })
})

// Tests the user schema validation functions that are
// used to validate data that is trying to be sent
// to the database to be stored.
describe('User Schema Validation', function () {
  let hashedPassword: string = ''

  it('Creating a user with all the correct properties should save the user to the database', async function () {
    let user = new UserModel(newCorrectUser.user)

    try {
      // Hashes the password
      user.password = await hashPassword(user.password)
    } catch (error: any) {
      testLogger.error(error)
      throw error
    }

    try {
      // Saves the user to the database
      let savedUser = await user.save()

      expect(savedUser._id).to.equal(newCorrectUser.user._id)
      expect(savedUser.username).to.equal(newCorrectUser.user.username)
      expect(savedUser.accessId).to.equal(newCorrectUser.user.accessId)
      expect(savedUser.firstName).to.equal(newCorrectUser.user.firstName)
      expect(savedUser.lastName).to.equal(newCorrectUser.user.lastName)
      hashedPassword = savedUser.password
      let isHashedPassword: boolean = ServerUser.isValidHashedPassword(
        savedUser.password,
      )
      expect(isHashedPassword).to.equal(true)
      expect(savedUser.password).to.equal(hashedPassword)
    } catch (error) {
      testLogger.error(error)
      throw error
    }
  })

  it('Querying for the newly created user should return the correct user', async function () {
    try {
      let retrievedUser = await UserModel.findOne({
        _id: newCorrectUser.user._id,
      }).exec()

      expect(retrievedUser._id).to.equal(newCorrectUser.user._id)
      expect(retrievedUser.username).to.equal(newCorrectUser.user.username)
      expect(retrievedUser.accessId).to.equal(newCorrectUser.user.accessId)
      expect(retrievedUser.firstName).to.equal(newCorrectUser.user.firstName)
      expect(retrievedUser.lastName).to.equal(newCorrectUser.user.lastName)
      let isHashedPassword: boolean = ServerUser.isValidHashedPassword(
        retrievedUser.password,
      )
      expect(isHashedPassword).to.equal(true)
      expect(retrievedUser.password).to.equal(hashedPassword)
    } catch (error) {
      testLogger.error(error)
      throw error
    }
  })

  it('Updating a user should not hash the password again', async function () {
    try {
      let savedUser = await UserModel.updateOne(
        {
          _id: newCorrectUser.user._id,
        },
        {
          firstName: 'updatedFirstName',
          lastName: 'updatedLastName',
        },
      ).exec()

      expect(savedUser.acknowledged).to.equal(true)
      expect(savedUser.matchedCount).to.equal(1)
      expect(savedUser.modifiedCount).to.equal(1)
    } catch (error) {
      testLogger.error(error)
      throw error
    }
  })

  it('Querying for the updated user should return the correct user', async function () {
    try {
      let retrievedUser = await UserModel.findOne({
        _id: newCorrectUser.user._id,
      }).exec()

      expect(retrievedUser._id).to.equal(newCorrectUser.user._id)
      expect(retrievedUser.username).to.equal(newCorrectUser.user.username)
      expect(retrievedUser.accessId).to.equal(newCorrectUser.user.accessId)
      expect(retrievedUser.firstName).to.equal('updatedFirstName')
      expect(retrievedUser.lastName).to.equal('updatedLastName')
      let isHashedPassword: boolean = ServerUser.isValidHashedPassword(
        retrievedUser.password,
      )
      expect(isHashedPassword).to.equal(true)
      expect(retrievedUser.password).to.equal(hashedPassword)
    } catch (error) {
      testLogger.error(error)
      throw error
    }
  })
})

// Deletes all the data that was created from the tests.
after(async function () {
  try {
    // Deletes all missions in the test database
    let deletedMissions = await MissionModel.deleteMany({}).exec()
    expect(deletedMissions.acknowledged).to.equal(true)

    // Deletes all users in the test database
    let deletedUsers = await UserModel.deleteMany({}).exec()
    expect(deletedUsers.acknowledged).to.equal(true)
  } catch (error) {
    testLogger.error(error)
    throw error
  }
})
