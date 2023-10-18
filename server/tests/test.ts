// file path (switches to the "metis-test" database)
process.env.environment = 'TEST'

process.argv

// npm imports
import mocha from 'mocha'
import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'

// metis imports
import { testLogger } from '../logging'
import { TUserRole } from 'metis/users'
import MissionModel from 'metis/server/database/models/missions'
import UserModel, { hashPassword } from 'metis/server/database/models/users'
import MetisServer from 'metis/server'

// global fields
let missionID: string
let missionName: string
let server: MetisServer = require('../start').server
let PORT: number = server.port
let MONGO_DB: string = server.mongoDB
const baseUrl = `localhost:${PORT}`
const MONGO_TEST_DB: string = 'metis-test'
const permittedUserRole: TUserRole = 'admin'
let agent: ChaiHttp.Agent

// json
const userCredentials = {
  userID: 'admin',
  password: 'temppass',
}
const createMissionWithNoNodeData = {
  mission: {
    name: 'No Node Data Mission (To Delete)',
    introMessage: 'This is a new mission.',
    versionNumber: 1,
    initialResources: 5,
    live: false,
    nodeStructure: {
      'e72aa13b-3d99-406a-a435-b0f5f2e31873': {},
    },
    schemaBuildNumber: 5,
  },
}
const testMission = {
  mission: {
    name: 'Test Mission (To Delete)',
    introMessage: 'This is a new mission.',
    versionNumber: 1,
    live: false,
    initialResources: 5,
    nodeStructure: {
      '7e6e3ddd-53be-40b1-881e-945cd6891425': {},
    },
    nodeData: [
      {
        nodeID: '7e6e3ddd-53be-40b1-881e-945cd6891425',
        name: 'Test Node',
        color: '#ffffff',
        description: 'This is a new node.',
        preExecutionText: 'Node has not been executed.',
        depthPadding: 0,
        executable: false,
        device: false,
        actions: [
          {
            actionID: '5a3acf01-7ea6-48c5-bff8-155233dcf46c',
            name: 'Destroy',
            description: 'This will destroy.',
            processTime: 3000,
            successChance: 0.6,
            resourceCost: 1,
            postExecutionSuccessText:
              'Destroy was performed successfully on Test Node.',
            postExecutionFailureText:
              'Destroy was performed unsuccessfully on Test Node.',
            scripts: [
              {
                label: 'Test-Command-Script: "test"',
                description: 'Used for unit test.',
                scriptName: 'TestCommandScript',
                originalPath: 'test/test_command_script',
                args: { script: 'test' },
              },
            ],
          },
        ],
      },
    ],
    schemaBuildNumber: 9,
  },
}
const updateMissionWithNoMissionID = {
  mission: {
    name: 'Updated No Node Data (To Delete)',
    introMessage: 'This is a new mission.',
    versionNumber: 1,
    initialResources: 5,
    live: false,
    nodeStructure: {
      'e72aa13b-3d99-406a-a435-b0f5f2e31873': {},
    },
    nodeData: [
      {
        nodeID: 'e72aa13b-3d99-406a-a435-b0f5f2e31873',
        name: 'Test Node',
        color: '#ffffff',
        description: 'This is a new node.',
        preExecutionText: 'Node has not been executed.',
        depthPadding: 0,
        executable: false,
        device: false,
        actions: [
          {
            actionID: '5a3acf01-7ea6-48c5-bff8-155233dcf46c',
            name: 'Destroy',
            description: 'This will destroy.',
            processTime: 3000,
            successChance: 0.6,
            resourceCost: 1,
            postExecutionSuccessText:
              'Destroy was performed successfully on Test Node.',
            postExecutionFailureText:
              'Destroy was performed unsuccessfully on Test Node.',
            scripts: [],
          },
        ],
      },
    ],
    schemaBuildNumber: 9,
  },
}
const updateMissionWithNoNodeStructure = {
  mission: {
    missionID: '',
    name: 'Update No Node Structure (To Delete)',
    introMessage: 'This is a new mission.',
    versionNumber: 1,
    initialResources: 5,
    live: false,
    nodeData: [
      {
        nodeID: 'e72aa13b-3d99-406a-a435-b0f5f2e31873',
        name: 'Test Node',
        color: '#ffffff',
        description: 'This is a new node.',
        preExecutionText: 'Node has not been executed.',
        depthPadding: 0,
        executable: false,
        device: false,
        actions: [
          {
            actionID: '5a3acf01-7ea6-48c5-bff8-155233dcf46c',
            name: 'Destroy',
            description: 'This will destroy.',
            processTime: 3000,
            successChance: 0.6,
            resourceCost: 1,
            postExecutionSuccessText:
              'Destroy was performed successfully on Test Node.',
            postExecutionFailureText:
              'Destroy was performed unsuccessfully on Test Node.',
            scripts: [],
          },
        ],
      },
    ],
    schemaBuildNumber: 9,
  },
}
const updateMissionWithNoNodeData = {
  mission: {
    missionID: '',
    name: 'No Node Data Mission (To Delete)',
    introMessage: 'This is a new mission.',
    versionNumber: 1,
    initialResources: 5,
    live: false,
    nodeStructure: {
      'e72aa13b-3d99-406a-a435-b0f5f2e31873': {},
    },
    schemaBuildNumber: 5,
  },
}
const correctUpdateTestMission = {
  mission: {
    missionID: '',
    name: 'Updated Test Mission (To Delete)',
    introMessage: 'This is a new mission.',
    versionNumber: 1,
    live: false,
    initialResources: 5,
    nodeStructure: {
      '7e6e3ddd-53be-40b1-881e-945cd6891425': {},
    },
    nodeData: [
      {
        nodeID: '7e6e3ddd-53be-40b1-881e-945cd6891425',
        name: 'Test Node',
        color: '#ffffff',
        description: 'This is a new node.',
        preExecutionText: 'Node has not been executed.',
        depthPadding: 0,
        executable: false,
        device: false,
        actions: [
          {
            actionID: '5a3acf01-7ea6-48c5-bff8-155233dcf46c',
            name: 'Destroy',
            description: 'This will destroy.',
            processTime: 3000,
            successChance: 0.6,
            resourceCost: 1,
            postExecutionSuccessText:
              'Destroy was performed successfully on Test Node.',
            postExecutionFailureText:
              'Destroy was performed unsuccessfully on Test Node.',
            scripts: [
              {
                label: 'Test-Command-Script: "test"',
                description: 'Used for unit test.',
                scriptName: 'TestCommandScript',
                originalPath: 'test/test_command_script',
                args: {},
              },
            ],
          },
        ],
      },
    ],
    schemaBuildNumber: 9,
  },
}
const correctUser = {
  user: {
    userID: 'test23',
    role: 'student',
    firstName: 'Test',
    lastName: 'User',
    password: 'password',
  },
}
let newCorrectUser = {
  user: {
    userID: 'test24',
    role: 'student',
    firstName: 'Test',
    lastName: 'User',
    password: 'password',
    needsPasswordReset: false,
  },
}
const userWithNoPassword = {
  user: {
    userID: 'test23',
    role: 'student',
    firstName: 'Test',
    lastName: 'User',
  },
}

// Sets up the test environment
before(async function () {
  // Starts the test server
  try {
    await server.serve()
  } catch (error: any) {
    testLogger.error(error)
  }

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
    try {
      await agent.post('/api/v1/users/login').send(userCredentials)

      await MissionModel.find({}).exec((error: any, missions: any) => {
        if (error) {
          testLogger.error(error)
          return error
        } else {
          missionID = missions[0].missionID
          missionName = missions[0].name
          return
        }
      })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  } else {
    let error = new Error(
      'Database is not using "metis-test." Please make sure the test database is running.',
    )
    testLogger.error(error)
    process.exit(1)
  }
})

// Tests for the export/import mission feature
describe('Export/Import File Tests', function () {
  it('Calling the missions route on the API should return a successful (200) response', async function () {
    try {
      return await agent
        .get('/api/v1/missions/')
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('User should be logged in as an admin to access the import and/or export API', async function () {
    try {
      return await agent
        .get('/api/v1/users/session')
        .then(function (response: ChaiHttp.Response) {
          expect(response.body.user.role).to.equal(permittedUserRole)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Calling the export route with the correct name and missionID should return a successful (200) response', async function () {
    try {
      return await agent
        .get(`/api/v1/missions/export/${missionName}?missionID=${missionID}`)
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Calling the export route on the API without a missionID as a query should return a not found (404) response', async function () {
    try {
      return await agent
        .get(`/api/v1/missions/export/`)
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(404)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Calling the import route on the API with a valid file should have a "successfulImportCount" set to 1, "failedImportCount" set to 0, and an array called "failedImportErrorMessages" with a length of 0', async function () {
    try {
      return await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Valid Mission.cesar')
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
          expect(response.body.successfulImportCount).to.equal(1)
          expect(response.body.failedImportCount).to.equal(0)
          expect(response.body.failedImportErrorMessages.length).to.equal(0)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Calling the import route on the API with an invalid file should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
    try {
      return await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Invalid Mission.cesar')
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
          expect(response.body.successfulImportCount).to.equal(0)
          expect(response.body.failedImportCount).to.equal(1)
          expect(response.body.failedImportErrorMessages.length).to.equal(1)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Calling the import route on the API with a file that has valid contents, but an invalid extension should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
    try {
      return await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Attack Mission.jpeg')
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
          expect(response.body.successfulImportCount).to.equal(0)
          expect(response.body.failedImportCount).to.equal(1)
          expect(response.body.failedImportErrorMessages.length).to.equal(1)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Calling the import route on the API with a file that has a "schemaBuildNumber" missing should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
    try {
      return await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/No schemaBuildNumber Mission.cesar')
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
          expect(response.body.successfulImportCount).to.equal(0)
          expect(response.body.failedImportCount).to.equal(1)
          expect(response.body.failedImportErrorMessages.length).to.equal(1)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Calling the import route on the API with a file that has a syntax error should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
    try {
      return await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Syntax Error Mission.cesar')
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
          expect(response.body.successfulImportCount).to.equal(0)
          expect(response.body.failedImportCount).to.equal(1)
          expect(response.body.failedImportErrorMessages.length).to.equal(1)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Calling the import route on the API with a file that has an extra invalid property in the node data should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
    try {
      return await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Extra Invalid Property Mission.cesar')
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
          expect(response.body.successfulImportCount).to.equal(0)
          expect(response.body.failedImportCount).to.equal(1)
          expect(response.body.failedImportErrorMessages.length).to.equal(1)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Calling the import route on the API with a file that has extra data in the node data should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
    try {
      return await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Extra Data Mission.cesar')
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
          expect(response.body.successfulImportCount).to.equal(0)
          expect(response.body.failedImportCount).to.equal(1)
          expect(response.body.failedImportErrorMessages.length).to.equal(1)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Calling the import route on the API with a multiple valid files should have a "successfulImportCount" set to 2, "failedImportCount" set to 0, and an array called "failedImportErrorMessages" with a length of 0', async function () {
    try {
      return await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Valid Mission.cesar')
        .attach('files', './tests/static/Valid Mission(1).cesar')
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
          expect(response.body.successfulImportCount).to.equal(2)
          expect(response.body.failedImportCount).to.equal(0)
          expect(response.body.failedImportErrorMessages.length).to.equal(0)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Calling the import route on the API with one valid file and one invalid file should have a "successfulImportCount" set to 1, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
    try {
      return await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Valid Mission.cesar')
        .attach('files', './tests/static/Invalid Mission.cesar')
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
          expect(response.body.successfulImportCount).to.equal(1)
          expect(response.body.failedImportCount).to.equal(1)
          expect(response.body.failedImportErrorMessages.length).to.equal(1)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Calling the import route on the API with a file that has an invalid extension (i.e., should be a .svg, .png, .pdf, etc. and is a .cesar instead) should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
    try {
      return await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/bolt-solid.cesar')
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
          expect(response.body.successfulImportCount).to.equal(0)
          expect(response.body.failedImportCount).to.equal(1)
          expect(response.body.failedImportErrorMessages.length).to.equal(1)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 9 or less and a ".cesar" extension should have a "successfulImportCount" set to 1, "failedImportCount" set to 0, and an array called "failedImportErrorMessages" with a length of 0', async function () {
    try {
      return await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Schema Build 4.cesar')
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
          expect(response.body.successfulImportCount).to.equal(1)
          expect(response.body.failedImportCount).to.equal(0)
          expect(response.body.failedImportErrorMessages.length).to.equal(0)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 9 or less and a ".metis" extension should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
    try {
      return await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Schema Build 4.metis')
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
          expect(response.body.successfulImportCount).to.equal(0)
          expect(response.body.failedImportCount).to.equal(1)
          expect(response.body.failedImportErrorMessages.length).to.equal(1)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 10 or greater and a ".metis" extension should have a "successfulImportCount" set to 1, "failedImportCount" set to 0, and an array called "failedImportErrorMessages" with a length of 0', async function () {
    try {
      return await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Schema Build 10.metis')
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
          expect(response.body.successfulImportCount).to.equal(1)
          expect(response.body.failedImportCount).to.equal(0)
          expect(response.body.failedImportErrorMessages.length).to.equal(0)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 10 or greater and a ".cesar" extension should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
    try {
      return await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Schema Build 10.cesar')
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
          expect(response.body.successfulImportCount).to.equal(0)
          expect(response.body.failedImportCount).to.equal(1)
          expect(response.body.failedImportErrorMessages.length).to.equal(1)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 10 or greater and a ".metis" extension and a valid file that has a "schemaBuildNumber" of 9 or less and a ".metis" extension should have a "successfulImportCount" set to 1, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
    try {
      return await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Schema Build 10.metis')
        .attach('files', './tests/static/Schema Build 4.metis')
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
          expect(response.body.successfulImportCount).to.equal(1)
          expect(response.body.failedImportCount).to.equal(1)
          expect(response.body.failedImportErrorMessages.length).to.equal(1)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 10 or greater and a ".metis" extension, a valid file that has a "schemaBuildNumber" of 9 or less and a ".metis" extension, a file that has an invalid extension (i.e., should be a .svg, .png, .pdf, etc. and is a .cesar instead), and a file that has valid contents, but an invalid extension should have a "successfulImportCount" set to 1, "failedImportCount" set to 3, and an array called "failedImportErrorMessages" with a length of 3', async function () {
    try {
      return await agent
        .post('/api/v1/missions/import/')
        .attach('files', './tests/static/Schema Build 10.metis')
        .attach('files', './tests/static/Schema Build 4.metis')
        .attach('files', './tests/static/bolt-solid.cesar')
        .attach('files', './tests/static/Attack Mission.jpeg')
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
          expect(response.body.successfulImportCount).to.equal(1)
          expect(response.body.failedImportCount).to.equal(3)
          expect(response.body.failedImportErrorMessages.length).to.equal(3)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })
})

// Tests for each mission route
describe('API Mission Routes', function () {
  // Stores all the missions that were in
  // the database before the tests were run
  let createdMissionIDArray: Array<string> = []

  it('User should be logged in as an admin to be able to post missions to the database via the API', async function () {
    try {
      return await agent
        .get('/api/v1/users/session')
        .then(function (response: ChaiHttp.Response) {
          expect(response.body.user.role).to.equal(permittedUserRole)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Calling the missions route without any queries should return a successful (200) response', async function () {
    try {
      return await agent
        .get(`/api/v1/missions`)
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Sending the wrong query is ignored and a successful (200) response should be returned', async function () {
    try {
      return await agent
        .get(`/api/v1/missions`)
        .query({
          wrongQueryProperty: 'alsdkfdskjfsl',
        })
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Getting a mission where the "missionID" is not of type "objectId" in the query of the request should return a bad (400) response', async function () {
    try {
      return await agent
        .get(`/api/v1/missions`)
        .query({
          missionID: 2,
        })
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(400)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Getting a mission with all the correct properties in the query of the request should result in a successful (200) response', async function () {
    try {
      return await agent
        .get(`/api/v1/missions?missionID=${missionID}`)
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Getting the environment should return a successful (200) response', async function () {
    try {
      return await agent
        .get(`/api/v1/missions/environment/`)
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Creating a mission with (a) missing property/properties in the body of the request should return a bad (400) response', async function () {
    try {
      return await agent
        .post('/api/v1/missions/')
        .set('Content-Type', 'application/json')
        .send(createMissionWithNoNodeData)
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(400)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Creating a mission with all the correct properties in the body of the request should return a successful (200) response', async function () {
    try {
      return await agent
        .post('/api/v1/missions/')
        .set('Content-Type', 'application/json')
        .send(testMission)
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
          createdMissionIDArray.push(response.body.mission.missionID)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  // it("Calling the handle-action-execution route with the proper missionID, nodeID, and actionID returns a successful (200) response", async function () {
  //   let testVariable: null | "successful" = null;

  //   // New command script that tests to make sure
  //   // the functionality of calling on another API
  //   // works properly
  //   const TestCommandScript = (args: AnyObject) => {
  //     testVariable = "successful";
  //   };
  //   cyberCityCommandScripts["TestCommandScript"] = TestCommandScript;

  //   missionID = createdMissionIDArray[0];
  //   correctUpdateTestMission.mission.missionID = missionID;

  //   let nodeID: string = correctUpdateTestMission.mission.nodeData[0].nodeID;
  //   let actionID: string =
  //     correctUpdateTestMission.mission.nodeData[0].actions[0].actionID;

  //   const data: AnyObject = {
  //     missionID: missionID,
  //     nodeID: nodeID,
  //     actionID: actionID,
  //   };

  //  try {
  //    return await agent
  //      .put('/api/v1/missions/handle-action-execution/')
  //      .set('Content-Type', 'application/json')
  //      .send(data)
  //      .then(function (response: ChaiHttp.Response) {
  //        expect(response).to.have.status(200)
  //        expect(testVariable).to.equal('successful')
  //      })
  //  } catch (error: any) {
  //    testLogger.error(error)
  //    return error
  //  }
  // });

  it('Updating a mission with (a) missing property/properties that is required (missionID) in the body of the request should return a bad (400) response', async function () {
    try {
      return await agent
        .put('/api/v1/missions/')
        .set('Content-Type', 'application/json')
        .send(updateMissionWithNoMissionID)
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(400)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Updating a mission where the nodeStructure is defined, but the nodeData is undefined in the body of the request should return an internal server error (500) response', async function () {
    missionID = createdMissionIDArray[0]
    updateMissionWithNoNodeData.mission.missionID = missionID

    try {
      return await agent
        .put('/api/v1/missions/')
        .set('Content-Type', 'application/json')
        .send(updateMissionWithNoNodeData)
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(500)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Updating a mission where the nodeData is defined, but the nodeStructure is undefined in the body of the request should return an internal server error (500) response', async function () {
    missionID = createdMissionIDArray[0]
    updateMissionWithNoNodeStructure.mission.missionID = missionID

    try {
      return await agent
        .put('/api/v1/missions/')
        .set('Content-Type', 'application/json')
        .send(updateMissionWithNoNodeStructure)
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(500)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Updating a mission with all the correct properties in the body of the request should return a successful (200) response', async function () {
    missionID = createdMissionIDArray[0]
    correctUpdateTestMission.mission.missionID = missionID

    try {
      return await agent
        .put('/api/v1/missions/')
        .set('Content-Type', 'application/json')
        .send(correctUpdateTestMission)
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Copying a mission with (a) missing property/properties in the body of the request should return a bad (400) response', async function () {
    try {
      agent
        .put('/api/v1/missions/copy/')
        .set('Content-Type', 'application/json')
        .send({ copyName: 'Copied Mission' })
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(400)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Copying a mission with all the correct properties in the body of the request should return a successful (200) response', async function () {
    missionID = createdMissionIDArray[0]

    try {
      return await agent
        .put('/api/v1/missions/copy/')
        .set('Content-Type', 'application/json')
        .send({ copyName: 'Copied Mission', originalID: missionID })
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Deleting a mission with the wrong type for the missionID in the query of the request should return a bad (400) response', async function () {
    try {
      return await agent
        .delete(`/api/v1/missions?missionID=${2}`)
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(400)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Deleting a mission with all the correct properties in the query of the request should return a successful (200) response', async function () {
    missionID = createdMissionIDArray[0]

    try {
      return await agent
        .delete(`/api/v1/missions?missionID=${missionID}`)
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
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
      return await agent
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
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Sending a request with all required and optional body keys and their types being incorrect results in a bad (400) response', async function () {
    try {
      return await agent
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
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(400)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Sending a request with a missing body key (OBJECTID) that is required results in a bad (400) request', async function () {
    try {
      return await agent
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
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(400)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Sending a request with a missing body key (BOOLEAN) that is optional results in a successful (200) request', async function () {
    try {
      return await agent
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
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Sending a request with additional body keys results in those additional body keys being removed from the request body', async function () {
    try {
      return await agent
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
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
          expect(response.body.bodyKeys.EXTRA_KEY).to.equal(undefined)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
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
      return await agent
        .get(`/api/v1/test/request-query-type-check/`)
        .query({
          string: string,
          number: number,
          integer: integer,
          boolean: boolean,
          objectId: objectId,
        })
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Sending a request with all required and optional query keys and their types being incorrect results in a bad (400) response', async function () {
    try {
      return await agent
        .get(`/api/v1/test/request-query-type-check/`)
        .query({
          string: number,
          number: string,
          integer: number,
          boolean: objectId,
          objectId: boolean,
        })
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(400)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Sending a request with a missing query key that is required results in a bad (400) request', async function () {
    try {
      return await agent
        .get(`/api/v1/test/request-query-type-check/`)
        .query({
          string: string,
          number: number,
          integer: integer,
          boolean: boolean,
        })
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(400)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Sending a request with a missing query key (string) that is optional results in a successful (200) request', async function () {
    try {
      return await agent
        .get(`/api/v1/test/request-query-type-check/`)
        .query({
          number: number,
          integer: integer,
          boolean: boolean,
          objectId: objectId,
        })
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Sending a request with additional query keys results in those additional query keys being removed from the request query', async function () {
    try {
      return await agent
        .get(`/api/v1/test/request-query-type-check/`)
        .query({
          number: number,
          integer: integer,
          boolean: boolean,
          objectId: objectId,
          extraKey: 'extra key',
        })
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
          expect(response.body.query.extraKey).to.equal(undefined)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })
})

// Tests for the middleware function used to
// validate the data sent in the request params
// of the API routes
describe('Request Params Validation', function () {
  let string: string = 'string'
  let number: number = 3.5
  let integer: number = 3
  let boolean: boolean = true
  let objectId: string = '643ea778c10a4de66a9448d0'

  it('Sending a request with all params keys and their correct types results in a successful (200) response', async function () {
    try {
      return await agent
        .get(
          `/api/v1/test/request-params-type-check/${string}/${number}/${integer}/${boolean}/${objectId}`,
        )
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(200)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Sending a request with all params keys and their types being incorrect results in a bad (400) response', async function () {
    try {
      return await agent
        .get(
          `/api/v1/test/request-params-type-check/${number}/${string}/${number}/${objectId}/${boolean}`,
        )
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(400)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })

  it('Sending a request with a missing params key (OBJECTID) results in a not found (404) request', async function () {
    try {
      return await agent
        .get(
          `/api/v1/test/request-params-type-check/${string}/${number}/${integer}/${boolean}`,
        )
        .then(function (response: ChaiHttp.Response) {
          expect(response).to.have.status(404)
        })
    } catch (error: any) {
      testLogger.error(error)
      return error
    }
  })
})

// Tests the mission schema validation functions that are
// used to validate data that is trying to be sent
// to the database to be stored.
describe('Mission Schema Validation', function () {
  it('Creating a mission with all the correct properties should save the mission to the database', async function () {
    // Remove the schemaBuildNumber from the mission data
    const { schemaBuildNumber, ...missionData } = testMission.mission
    // Create a new mission model
    let mission = new MissionModel(missionData)
    // Grab the missionID that is auto-generated
    // to use for the next test
    missionID = mission.missionID

    try {
      // Save the mission to the database
      return await mission.save(function (error: Error, retrievedMission: any) {
        // Check to make sure there were no errors
        expect(error).to.equal(null)
        // The retrieved mission should have the same
        // name as the test mission
        expect(retrievedMission.name).to.equal(testMission.mission.name)
        // The retrieved mission should have the same
        // introMessage as the test mission
        expect(retrievedMission.introMessage).to.equal(
          testMission.mission.introMessage,
        )
        // The retrieved mission should have the same
        // versionNumber as the test mission
        expect(retrievedMission.versionNumber).to.equal(
          testMission.mission.versionNumber,
        )
        // The retrieved mission's live property should
        // be the same as the test mission's live property
        expect(retrievedMission.live).to.equal(testMission.mission.live)
        // The retrieved mission should have the same
        // amount of initialResources as the test mission
        expect(retrievedMission.initialResources).to.equal(
          testMission.mission.initialResources,
        )
        // The retrieved mission should have the same
        // nodeStructure as the test mission
        expect(retrievedMission.nodeStructure).to.deep.equal(
          testMission.mission.nodeStructure,
        )
        // The retrieved mission should have the same
        // nodeData as the test mission
        expect(retrievedMission.nodeData[0].nodeID).to.equal(
          testMission.mission.nodeData[0].nodeID,
        )
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })

  it('Querying for the newly created mission should return the correct mission', async function () {
    try {
      // Query for the mission with the missionID
      // set from the previous test
      return await MissionModel.findOne({
        missionID: missionID,
      }).exec((error: Error, retrievedMission: any) => {
        // Check to make sure there were no errors
        expect(error).to.equal(null)
        // The retrieved mission should have the same
        // name as the test mission
        expect(retrievedMission.name).to.equal(testMission.mission.name)
        // The retrieved mission should have the same
        // introMessage as the test mission
        expect(retrievedMission.introMessage).to.equal(
          testMission.mission.introMessage,
        )
        // The retrieved mission should have the same
        // versionNumber as the test mission
        expect(retrievedMission.versionNumber).to.equal(
          testMission.mission.versionNumber,
        )
        // The retrieved mission's live property should
        // be the same as the test mission's live property
        expect(retrievedMission.live).to.equal(testMission.mission.live)
        // The retrieved mission should have the same
        // amount of initialResources as the test mission
        expect(retrievedMission.initialResources).to.equal(
          testMission.mission.initialResources,
        )
        // The retrieved mission should have the same
        // nodeStructure as the test mission
        expect(retrievedMission.nodeStructure).to.deep.equal(
          testMission.mission.nodeStructure,
        )
        // The retrieved mission should have the same
        // nodeData as the test mission
        expect(retrievedMission.nodeData[0].nodeID).to.equal(
          testMission.mission.nodeData[0].nodeID,
        )
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#fffffg") should result in a validation error', async function () {
    // Remove the schemaBuildNumber from the mission data
    const { schemaBuildNumber, ...missionData } = testMission.mission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#fffffg'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      return await mission.save(function (error: Error) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `#fffffg`',
        )
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("ffffff") should result in an internal server error (500) response', async function () {
    // Remove the schemaBuildNumber from the mission data
    const { schemaBuildNumber, ...missionData } = testMission.mission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = 'ffffff'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      return await mission.save(function (error: Error) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `ffffff`',
        )
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#fffffff") should result in an internal server error (500) response', async function () {
    // Remove the schemaBuildNumber from the mission data
    const { schemaBuildNumber, ...missionData } = testMission.mission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#fffffff'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      return await mission.save(function (error: Error) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `#fffffff`',
        )
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("white") should result in an internal server error (500) response', async function () {
    // Remove the schemaBuildNumber from the mission data
    const { schemaBuildNumber, ...missionData } = testMission.mission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = 'white'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      return await mission.save(function (error: Error) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `white`',
        )
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#white") should result in an internal server error (500) response', async function () {
    // Remove the schemaBuildNumber from the mission data
    const { schemaBuildNumber, ...missionData } = testMission.mission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#white'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      return await mission.save(function (error: Error) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `#white`',
        )
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("asfjsdjkf #ffffff sadlkfsld") should result in an internal server error (500) response', async function () {
    // Remove the schemaBuildNumber from the mission data
    const { schemaBuildNumber, ...missionData } = testMission.mission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = 'asfjsdjkf #ffffff sadlkfsld'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      return await mission.save(function (error: Error) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `asfjsdjkf #ffffff sadlkfsld`',
        )
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("asfjsdjkf#ffffffsadlkfsld") should result in an internal server error (500) response', async function () {
    // Remove the schemaBuildNumber from the mission data
    const { schemaBuildNumber, ...missionData } = testMission.mission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = 'asfjsdjkf#ffffffsadlkfsld'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      return await mission.save(function (error: Error) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `asfjsdjkf#ffffffsadlkfsld`',
        )
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#6545169") should result in an internal server error (500) response', async function () {
    // Remove the schemaBuildNumber from the mission data
    const { schemaBuildNumber, ...missionData } = testMission.mission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#6545169'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      return await mission.save(function (error: Error) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `#6545169`',
        )
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#abcdef99") should result in an internal server error (500) response', async function () {
    // Remove the schemaBuildNumber from the mission data
    const { schemaBuildNumber, ...missionData } = testMission.mission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#abcdef99'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      return await mission.save(function (error: Error) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `#abcdef99`',
        )
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("abcdef") should result in an internal server error (500) response', async function () {
    // Remove the schemaBuildNumber from the mission data
    const { schemaBuildNumber, ...missionData } = testMission.mission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = 'abcdef'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      return await mission.save(function (error: Error) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `abcdef`',
        )
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("fff") should result in an internal server error (500) response', async function () {
    // Remove the schemaBuildNumber from the mission data
    const { schemaBuildNumber, ...missionData } = testMission.mission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = 'fff'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      return await mission.save(function (error: Error) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `fff`',
        )
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#fff") should result in an internal server error (500) response', async function () {
    // Remove the schemaBuildNumber from the mission data
    const { schemaBuildNumber, ...missionData } = testMission.mission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#fff'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      return await mission.save(function (error: Error) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `#fff`',
        )
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#*&@^%!") should result in an internal server error (500) response', async function () {
    // Remove the schemaBuildNumber from the mission data
    const { schemaBuildNumber, ...missionData } = testMission.mission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#*&@^%!'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      return await mission.save(function (error: Error) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `#*&@^%!`',
        )
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#+89496") should result in an internal server error (500) response', async function () {
    // Remove the schemaBuildNumber from the mission data
    const { schemaBuildNumber, ...missionData } = testMission.mission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#+89496'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      return await mission.save(function (error: Error) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `#+89496`',
        )
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#89a96+") should result in an internal server error (500) response', async function () {
    // Remove the schemaBuildNumber from the mission data
    const { schemaBuildNumber, ...missionData } = testMission.mission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#89a96+'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      return await mission.save(function (error: Error) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `#89a96+`',
        )
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#8996+") should result in an internal server error (500) response', async function () {
    // Remove the schemaBuildNumber from the mission data
    const { schemaBuildNumber, ...missionData } = testMission.mission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#8996+'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      return await mission.save(function (error: Error) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `#8996+`',
        )
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#896+") should result in an internal server error (500) response', async function () {
    // Remove the schemaBuildNumber from the mission data
    const { schemaBuildNumber, ...missionData } = testMission.mission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#896+'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      return await mission.save(function (error: Error) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: nodeData.0.color: Validator failed for path `color` with value `#896+`',
        )
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })

  it('Creating a mission with a mission-node that has a color that is a valid hex color code ("#acde58") should result in a successful (200) response', async function () {
    // Remove the schemaBuildNumber from the mission data
    const { schemaBuildNumber, ...missionData } = testMission.mission
    // Set the color of the first mission-node to an invalid hex color code
    missionData.nodeData[0].color = '#acde58'
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      return await mission.save(function (error: Error) {
        // Check to make sure there were no errors
        expect(error).to.equal(null)
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })

  it('Creating a mission with HTMl tags that are not allowed ("<script></script>") in the mission should result in those tags being removed from the mission', async function () {
    // Remove the schemaBuildNumber from the mission data
    const { schemaBuildNumber, ...missionData } = testMission.mission
    // Set the introMessage of the mission to a string with a "script" tag
    missionData.introMessage =
      "<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a href='https://google.com' rel='noopener noreferrer' target='_blank'>message</a> here.</p><script>function consoleLog() {console.log('Successful script execution.')} consoleLog()</script>"
    // Set the preExecutionText of the first mission-node to a string with an improper "p" tag
    missionData.nodeData[0].preExecutionText =
      "<p>Node has not been executed.</p> <p href='https://google.com>Google</p>'"
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      return await mission.save(function (error: Error, mission: any) {
        // Check to make sure there were no errors
        expect(error).to.equal(null)
        // The introMessage of the mission should be the same as what was set above
        expect(mission.introMessage).to.equal(
          '<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a href="https://google.com" rel="noopener noreferrer" target="_blank">message</a> here.</p>',
        )
        // The preExecutionText of the first mission-node should be the same as what was set above
        expect(mission.nodeData[0].preExecutionText).to.equal(
          '<p>Node has not been executed.</p> ',
        )
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })

  it('Creating a mission with HTMl tags that are not allowed ("<style></style>") in the mission should result in those tags being removed from the mission', async function () {
    // Remove the schemaBuildNumber from the mission data
    const { schemaBuildNumber, ...missionData } = testMission.mission
    // Set the introMessage of the mission to a string with a "style" tag
    missionData.introMessage =
      "<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a href='https://google.com' rel='noopener noreferrer' target='_blank'>message</a> here.</p>   <style>.Content {font-size: 25px;}</style>"
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      return await mission.save(function (error: Error, mission: any) {
        // Check to make sure there were no errors
        expect(error).to.equal(null)
        // The introMessage of the mission should be the same as what was set above
        expect(mission.introMessage).to.equal(
          "<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a href='https://google.com' rel='noopener noreferrer' target='_blank'>message</a> here.</p>   <style>.Content {font-size: 25px;}</style>",
        )
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })

  it('Creating a mission with HTMl tags that are not allowed ("<iframe></iframe>") in the mission should result in those tags being removed from the mission', async function () {
    // Remove the schemaBuildNumber from the mission data
    const { schemaBuildNumber, ...missionData } = testMission.mission
    // Set the introMessage of the mission to a string with an "iframe" tag
    missionData.introMessage = `<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a href='https://google.com' rel='noopener noreferrer' target='_blank'>message</a> here.</p>   <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13026964.31028058!2d-106.25408262379291!3d37.1429207037123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x54eab584e432360b%3A0x1c3bb99243deb742!2sUnited%20States!5e0!3m2!1sen!2sus!4v1695930378392!5m2!1sen!2sus" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      return await mission.save(function (error: Error, mission: any) {
        // Check to make sure there were no errors
        expect(error).to.equal(null)
        // The introMessage of the mission should be the same as what was set above
        expect(mission.introMessage).to.equal(
          `<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a href='https://google.com' rel='noopener noreferrer' target='_blank'>message</a> here.</p>   <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13026964.31028058!2d-106.25408262379291!3d37.1429207037123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x54eab584e432360b%3A0x1c3bb99243deb742!2sUnited%20States!5e0!3m2!1sen!2sus!4v1695930378392!5m2!1sen!2sus" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`,
        )
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })

  it('Creating a mission with HTMl tags that are not allowed ("<input />") in the mission should result in those tags being removed from the mission', async function () {
    // Remove the schemaBuildNumber from the mission data
    const { schemaBuildNumber, ...missionData } = testMission.mission
    // Set the introMessage of the mission to a string with an "input" tag
    missionData.introMessage = `<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a href='https://google.com' rel='noopener noreferrer' target='_blank'>message</a> here.</p>   <input type="text" id="fname" name="fname" value="John">`
    // Create a new mission model
    let mission = new MissionModel(missionData)

    try {
      return await mission.save(function (error: Error, mission: any) {
        // Check to make sure there were no errors
        expect(error).to.equal(null)
        // The introMessage of the mission should be the same as what was set above
        expect(mission.introMessage).to.equal(
          `<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a href='https://google.com' rel='noopener noreferrer' target='_blank'>message</a> here.</p>   <input type="text" id="fname" name="fname" value="John">`,
        )
      })
    } catch (error: any) {
      // Logs the error
      testLogger.error(error)
      // Ends the test with the error thrown
      return error
    }
  })
})

// Tests for each of the API routes that are used
// to access the user data in the database
describe('User API Routes', function () {
  it('User should be logged in as an admin to be able to create users via the API', async function () {
    try {
      await agent
        .get('/api/v1/users/session')
        .then(function (response: ChaiHttp.Response) {
          return expect(response.body.user.role).to.equal(permittedUserRole)
        })
        .catch(function (error) {
          testLogger.error(error)
          return error
        })
    } catch (error) {
      testLogger.error(error)
      return error
    }
  })

  it('Creating a user with (a) missing property/properties in the body of the request should return a bad (400) response', async function () {
    try {
      await agent
        .post('/api/v1/users/')
        .set('Content-Type', 'application/json')
        .send(userWithNoPassword)
        .then(function (response: ChaiHttp.Response) {
          return expect(response).to.have.status(400)
        })
        .catch(function (error) {
          testLogger.error(error)
          return error
        })
    } catch (error) {
      testLogger.error(error)
      return error
    }
  })

  it('Creating a user with all the correct properties in the body of the request should return a successful (200) response', async function () {
    try {
      await agent
        .post('/api/v1/users/')
        .set('Content-Type', 'application/json')
        .send(correctUser)
        .then(function (response: ChaiHttp.Response) {
          return expect(response).to.have.status(200)
        })
        .catch(function (error: Error) {
          testLogger.error(error)
          return error
        })
    } catch (error) {
      testLogger.error(error)
      return error
    }
  })

  it(`Updating a user's first and last name should return a successful (200) response`, async function () {
    correctUser.user.firstName = 'updatedFirstName'
    correctUser.user.lastName = 'updatedLastName'

    try {
      await agent
        .put('/api/v1/users/')
        .set('Content-Type', 'application/json')
        .send(correctUser)
        .then(function (response: ChaiHttp.Response) {
          let user: any = response.body.user
          expect(user.firstName).to.equal('updatedFirstName')
          expect(user.lastName).to.equal('updatedLastName')
          return expect(response).to.have.status(200)
        })
        .catch(function (error) {
          testLogger.error(error)
          return error
        })
    } catch (error) {
      testLogger.error(error)
    }
  })

  it('Deleting a mission with all the correct properties in the query of the request should return a successful (200) response', async function () {
    try {
      await agent
        .delete(`/api/v1/users?userID=${correctUser.user.userID}`)
        .then(function (response: ChaiHttp.Response) {
          return expect(response).to.have.status(200)
        })
        .catch(function (error) {
          testLogger.error(error)
          return error
        })
    } catch (error) {
      testLogger.error(error)
      return error
    }
  })
})

// Tests the user schema validation functions that are
// used to validate data that is trying to be sent
// to the database to be stored.
describe('User Schema Validation', function () {
  // Regex for a bcrypt hashed password
  let hashedPasswordExpression: RegExp = /^\$2[ayb]\$.{56}$/
  let hashedPassword: string = ''

  it('Creating a user with all the correct properties should save the user to the database', async function () {
    let user = new UserModel(newCorrectUser.user)

    try {
      // Hashes the password
      user.password = await hashPassword(user.password)
    } catch (error: any) {
      testLogger.error(error)
      return error
    }

    try {
      // Saves the user to the database
      await user.save((error: Error, retrievedUser: any) => {
        expect(error).to.equal(null)
        expect(retrievedUser.userID).to.equal(newCorrectUser.user.userID)
        expect(retrievedUser.firstName).to.equal(newCorrectUser.user.firstName)
        expect(retrievedUser.lastName).to.equal(newCorrectUser.user.lastName)
        hashedPassword = retrievedUser.password
        let isHashedPassword: boolean = hashedPasswordExpression.test(
          retrievedUser.password,
        )
        expect(isHashedPassword).to.equal(true)
        return expect(retrievedUser.password).to.equal(hashedPassword)
      })
    } catch (error) {
      testLogger.error(error)
      return error
    }
  })

  it('Querying for the newly created user should return the correct user', async function () {
    try {
      await UserModel.findOne({
        userID: newCorrectUser.user.userID,
      }).exec((error: Error, retrievedUser: any) => {
        expect(error).to.equal(null)
        expect(retrievedUser.userID).to.equal(newCorrectUser.user.userID)
        expect(retrievedUser.firstName).to.equal(newCorrectUser.user.firstName)
        expect(retrievedUser.lastName).to.equal(newCorrectUser.user.lastName)
        let isHashedPassword: boolean = hashedPasswordExpression.test(
          retrievedUser.password,
        )
        expect(isHashedPassword).to.equal(true)
        return expect(retrievedUser.password).to.equal(hashedPassword)
      })
    } catch (error) {
      testLogger.error(error)
      return error
    }
  })

  it('Updating a user should not hash the password again', async function () {
    try {
      return await UserModel.updateOne(
        {
          userID: newCorrectUser.user.userID,
        },
        {
          firstName: 'updatedFirstName',
          lastName: 'updatedLastName',
        },
      ).exec((error: Error) => {
        expect(error).to.equal(null)
      })
    } catch (error) {
      testLogger.error(error)
      return error
    }
  })

  it('Querying for the updated user should return the correct user', async function () {
    try {
      return await UserModel.findOne({
        userID: newCorrectUser.user.userID,
      }).exec((error: Error, retrievedUser: any) => {
        expect(error).to.equal(null)
        expect(retrievedUser.userID).to.equal(newCorrectUser.user.userID)
        expect(retrievedUser.firstName).to.equal('updatedFirstName')
        expect(retrievedUser.lastName).to.equal('updatedLastName')
        let isHashedPassword: boolean = hashedPasswordExpression.test(
          retrievedUser.password,
        )
        expect(isHashedPassword).to.equal(true)
        expect(retrievedUser.password).to.equal(hashedPassword)
      })
    } catch (error) {
      testLogger.error(error)
      return error
    }
  })
})

// Deletes all the data that was created from the tests.
after(async function () {
  try {
    // Deletes all missions in the test database
    await MissionModel.deleteMany({}).exec()
  } catch (error) {
    testLogger.error(error)
  }

  try {
    // Deletes all users in the test database
    await UserModel.deleteMany({}).exec()
  } catch (error) {
    testLogger.error(error)
  }

  try {
    await MissionModel.find({}).exec((error: any, missions: any) => {
      expect(error).to.equal(null)
      expect(missions).to.have.length(0)
    })
  } catch (error) {
    testLogger.error(error)
  }

  try {
    await UserModel.find({}).exec((error: any, users: any) => {
      expect(error).to.equal(null)
      return expect(users).to.have.length(0)
    })
  } catch (error) {
    testLogger.error(error)
    return error
  }
})
