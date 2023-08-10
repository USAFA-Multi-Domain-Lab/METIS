// file path (switches to the "metis-test" database)
process.env.environment = 'TEST'

process.argv

// npm imports
import mocha from 'mocha'
import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'

// metis imports
import { testLogger } from '../modules/logging'
import { cyberCityCommandScripts } from '../action-execution'
import { AnyObject } from '../modules/toolbox/objects'
import { startServer } from '../server'
import { userRoles } from '../user'
import MissionModel from '../database/models/model-mission'
import UserModel, { hashPassword } from '../database/models/model-user'

// global fields
let missionID: string
let userID: string
let missionName: string
let PORT: string = require('../config').PORT
const baseUrl = `localhost:${PORT}`
let MONGO_DB: string = require('../config').MONGO_DB
const MONGO_TEST_DB: string = 'metis-test'
const permittedRoles: string[] = [userRoles.Admin, userRoles.Instructor]
const permittedUserRole = userRoles.Admin
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
const newCorrectUser = {
  user: {
    userID: 'test24',
    role: 'student',
    firstName: 'Test',
    lastName: 'User',
    password: 'password',
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

// Starts the test server
before(function (done) {
  this.timeout(30000)

  startServer(() => {
    console.log('\n')
    done()
  })
})

// Sets up the test environment
before(function (done) {
  chai.use(chaiHttp)

  // Creates a session with a user because
  // certain API routes require authentication
  // for access
  agent = chai.request.agent(baseUrl)

  // Checks to make sure the correct database is being used
  if (MONGO_DB === MONGO_TEST_DB) {
    // Creates a session with a user because
    // certain API routes require authentication
    // for access
    agent
      .post('/api/v1/users/login')
      .send(userCredentials)
      .then(function () {
        MissionModel.find({}).exec((error: any, missions: any) => {
          if (error) {
            testLogger.error(error)
            done(error)
          } else {
            missionID = missions[0].missionID
            missionName = missions[0].name
            done()
          }
        })
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  } else {
    let error = new Error(
      'Database is not using "metis-test." Please make sure the test database is running.',
    )
    testLogger.error(error)
    done(error)
    process.exit(1)
  }
})

// Tests for the export/import mission feature
describe('Export/Import File Tests', function () {
  it('Calling the missions route on the API should return a successful (200) response', function (done) {
    agent
      .get('/api/v1/missions/')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('User should be logged in as an admin to access the import and/or export API', function (done) {
    agent
      .get('/api/v1/users/session')
      .then(function (response: ChaiHttp.Response) {
        expect(response.body.currentUser.role).to.equal(permittedUserRole)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Calling the export route with the correct name and missionID should return a successful (200) response', function (done) {
    agent
      .get(`/api/v1/missions/export/${missionName}?missionID=${missionID}`)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Calling the export route on the API without a missionID as a query should return a not found (404) response', function (done) {
    agent
      .get(`/api/v1/missions/export/`)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(404)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Calling the import route on the API with a valid file should have a "successfulImportCount" set to 1, "failedImportCount" set to 0, and an array called "failedImportErrorMessages" with a length of 0', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach('files', './test/static/Valid Mission.cesar')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(1)
        expect(response.body.failedImportCount).to.equal(0)
        expect(response.body.failedImportErrorMessages.length).to.equal(0)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Calling the import route on the API with an invalid file should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach('files', './test/static/Invalid Mission.cesar')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Calling the import route on the API with a file that has valid contents, but an invalid extension should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach('files', './test/static/Attack Mission.jpeg')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Calling the import route on the API with a file that has a "schemaBuildNumber" missing should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach('files', './test/static/No schemaBuildNumber Mission.cesar')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Calling the import route on the API with a file that has a syntax error should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach('files', './test/static/Syntax Error Mission.cesar')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Calling the import route on the API with a file that has an extra invalid property in the node data should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach('files', './test/static/Extra Invalid Property Mission.cesar')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Calling the import route on the API with a file that has extra data in the node data should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach('files', './test/static/Extra Data Mission.cesar')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Calling the import route on the API with a multiple valid files should have a "successfulImportCount" set to 2, "failedImportCount" set to 0, and an array called "failedImportErrorMessages" with a length of 0', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach('files', './test/static/Valid Mission.cesar')
      .attach('files', './test/static/Valid Mission(1).cesar')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(2)
        expect(response.body.failedImportCount).to.equal(0)
        expect(response.body.failedImportErrorMessages.length).to.equal(0)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Calling the import route on the API with one valid file and one invalid file should have a "successfulImportCount" set to 1, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach('files', './test/static/Valid Mission.cesar')
      .attach('files', './test/static/Invalid Mission.cesar')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(1)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Calling the import route on the API with a file that has an invalid extension (i.e., should be a .svg, .png, .pdf, etc. and is a .cesar instead) should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach('files', './test/static/bolt-solid.cesar')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 9 or less and a ".cesar" extension should have a "successfulImportCount" set to 1, "failedImportCount" set to 0, and an array called "failedImportErrorMessages" with a length of 0', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach('files', './test/static/Schema Build 4.cesar')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(1)
        expect(response.body.failedImportCount).to.equal(0)
        expect(response.body.failedImportErrorMessages.length).to.equal(0)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 9 or less and a ".metis" extension should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach('files', './test/static/Schema Build 4.metis')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 10 or greater and a ".metis" extension should have a "successfulImportCount" set to 1, "failedImportCount" set to 0, and an array called "failedImportErrorMessages" with a length of 0', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach('files', './test/static/Schema Build 10.metis')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(1)
        expect(response.body.failedImportCount).to.equal(0)
        expect(response.body.failedImportErrorMessages.length).to.equal(0)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 10 or greater and a ".cesar" extension should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach('files', './test/static/Schema Build 10.cesar')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 10 or greater and a ".metis" extension and a valid file that has a "schemaBuildNumber" of 9 or less and a ".metis" extension should have a "successfulImportCount" set to 1, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach('files', './test/static/Schema Build 10.metis')
      .attach('files', './test/static/Schema Build 4.metis')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(1)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 10 or greater and a ".metis" extension, a valid file that has a "schemaBuildNumber" of 9 or less and a ".metis" extension, a file that has an invalid extension (i.e., should be a .svg, .png, .pdf, etc. and is a .cesar instead), and a file that has valid contents, but an invalid extension should have a "successfulImportCount" set to 1, "failedImportCount" set to 3, and an array called "failedImportErrorMessages" with a length of 3', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach('files', './test/static/Schema Build 10.metis')
      .attach('files', './test/static/Schema Build 4.metis')
      .attach('files', './test/static/bolt-solid.cesar')
      .attach('files', './test/static/Attack Mission.jpeg')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(1)
        expect(response.body.failedImportCount).to.equal(3)
        expect(response.body.failedImportErrorMessages.length).to.equal(3)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })
})

// Tests for each mission route
describe('API Mission Routes', function () {
  // Stores all the missions that were in
  // the database before the tests were run
  let createdMissionIDArray: Array<string> = []

  it('User should be logged in as an admin to be able to post missions to the database via the API', function (done) {
    agent
      .get('/api/v1/users/session')
      .then(function (response: ChaiHttp.Response) {
        expect(response.body.currentUser.role).to.equal(permittedUserRole)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Calling the missions route without any queries should return a successful (200) response', function (done) {
    agent
      .get(`/api/v1/missions`)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Sending the wrong query is ignored and a successful (200) response should be returned', function (done) {
    agent
      .get(`/api/v1/missions`)
      .query({
        wrongQueryProperty: 'alsdkfdskjfsl',
      })
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Getting a mission where the "missionID" is not of type "objectId" in the query of the request should return a bad (400) response', function (done) {
    agent
      .get(`/api/v1/missions`)
      .query({
        missionID: 2,
      })
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(400)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Getting a mission with all the correct properties in the query of the request should result in a successful (200) response', function (done) {
    agent
      .get(`/api/v1/missions?missionID=${missionID}`)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Getting the environment should return a successful (200) response', function (done) {
    agent
      .get(`/api/v1/missions/environment/`)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Creating a mission with (a) missing property/properties in the body of the request should return a bad (400) response', function (done) {
    agent
      .post('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(createMissionWithNoNodeData)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(400)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Creating a mission with all the correct properties in the body of the request should return a successful (200) response', function (done) {
    agent
      .post('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(testMission)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        createdMissionIDArray.push(response.body.mission.missionID)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Calling the handle-action-execution route with the proper missionID, nodeID, and actionID returns a successful (200) response', function (done) {
    let testVariable: null | 'successful' = null

    // New command script that tests to make sure
    // the functionality of calling on another API
    // works properly
    const TestCommandScript = (args: AnyObject) => {
      testVariable = 'successful'
    }
    cyberCityCommandScripts['TestCommandScript'] = TestCommandScript

    missionID = createdMissionIDArray[0]
    correctUpdateTestMission.mission.missionID = missionID

    let nodeID: string = correctUpdateTestMission.mission.nodeData[0].nodeID
    let actionID: string =
      correctUpdateTestMission.mission.nodeData[0].actions[0].actionID

    const data: AnyObject = {
      missionID: missionID,
      nodeID: nodeID,
      actionID: actionID,
    }

    agent
      .put('/api/v1/missions/handle-action-execution/')
      .set('Content-Type', 'application/json')
      .send(data)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(testVariable).to.equal('successful')
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Updating a mission with (a) missing property/properties that is required (missionID) in the body of the request should return a bad (400) response', function (done) {
    agent
      .put('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(updateMissionWithNoMissionID)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(400)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Updating a mission where the nodeStructure is defined, but the nodeData is undefined in the body of the request should return an internal server error (500) response', function (done) {
    missionID = createdMissionIDArray[0]
    updateMissionWithNoNodeData.mission.missionID = missionID

    agent
      .put('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(updateMissionWithNoNodeData)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(500)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Updating a mission where the nodeData is defined, but the nodeStructure is undefined in the body of the request should return an internal server error (500) response', function (done) {
    missionID = createdMissionIDArray[0]
    updateMissionWithNoNodeStructure.mission.missionID = missionID

    agent
      .put('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(updateMissionWithNoNodeStructure)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(500)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Updating a mission with all the correct properties in the body of the request should return a successful (200) response', function (done) {
    missionID = createdMissionIDArray[0]
    correctUpdateTestMission.mission.missionID = missionID

    agent
      .put('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(correctUpdateTestMission)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Copying a mission with (a) missing property/properties in the body of the request should return a bad (400) response', function (done) {
    agent
      .put('/api/v1/missions/copy/')
      .set('Content-Type', 'application/json')
      .send({ copyName: 'Copied Mission' })
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(400)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Copying a mission with all the correct properties in the body of the request should return a successful (200) response', function (done) {
    missionID = createdMissionIDArray[0]

    agent
      .put('/api/v1/missions/copy/')
      .set('Content-Type', 'application/json')
      .send({ copyName: 'Copied Mission', originalID: missionID })
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Deleting a mission with the wrong type for the missionID in the query of the request should return a bad (400) response', function (done) {
    agent
      .delete(`/api/v1/missions?missionID=${2}`)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(400)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Deleting a mission with all the correct properties in the query of the request should return a successful (200) response', function (done) {
    missionID = createdMissionIDArray[0]

    agent
      .delete(`/api/v1/missions?missionID=${missionID}`)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
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

  it('Sending a request with all required and optional body keys and their correct types results in a successful (200) response', function (done) {
    agent
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
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Sending a request with all required and optional body keys and their types being incorrect results in a bad (400) response', function (done) {
    agent
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
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Sending a request with a missing body key (OBJECTID) that is required results in a bad (400) request', function (done) {
    agent
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
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Sending a request with a missing body key (BOOLEAN) that is optional results in a successful (200) request', function (done) {
    agent
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
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Sending a request with additional body keys results in those additional body keys being removed from the request body', function (done) {
    agent
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
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
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

  it('Sending a request with all required and optional query keys and their correct types results in a successful (200) response', function (done) {
    agent
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
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Sending a request with all required and optional query keys and their types being incorrect results in a bad (400) response', function (done) {
    agent
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
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Sending a request with a missing query key that is required results in a bad (400) request', function (done) {
    agent
      .get(`/api/v1/test/request-query-type-check/`)
      .query({
        string: string,
        number: number,
        integer: integer,
        boolean: boolean,
      })
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(400)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Sending a request with a missing query key (string) that is optional results in a successful (200) request', function (done) {
    agent
      .get(`/api/v1/test/request-query-type-check/`)
      .query({
        number: number,
        integer: integer,
        boolean: boolean,
        objectId: objectId,
      })
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Sending a request with additional query keys results in those additional query keys being removed from the request query', function (done) {
    agent
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
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
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

  it('Sending a request with all params keys and their correct types results in a successful (200) response', function (done) {
    agent
      .get(
        `/api/v1/test/request-params-type-check/${string}/${number}/${integer}/${boolean}/${objectId}`,
      )
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Sending a request with all params keys and their types being incorrect results in a bad (400) response', function (done) {
    agent
      .get(
        `/api/v1/test/request-params-type-check/${number}/${string}/${number}/${objectId}/${boolean}`,
      )
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(400)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Sending a request with a missing params key (OBJECTID) results in a not found (404) request', function (done) {
    agent
      .get(
        `/api/v1/test/request-params-type-check/${string}/${number}/${integer}/${boolean}`,
      )
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(404)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })
})

// Tests the mission schema validation functions that are
// used to validate data that is trying to be sent
// to the database to be stored.
describe('Mission Schema Validation', function () {
  it('User should be logged in as an admin to be able to access certain API routes', function (done) {
    agent
      .get('/api/v1/users/session')
      .then(function (response: ChaiHttp.Response) {
        expect(response.body.currentUser.role).to.equal(permittedUserRole)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#fffffg") should result in an internal server error (500) response', function (done) {
    testMission.mission.nodeData[0].color = '#fffffg'

    agent
      .post('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(testMission)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(500)
        expect(response.error).to.not.equal(false)
        expect(response.ok).to.equal(false)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("ffffff") should result in an internal server error (500) response', function (done) {
    testMission.mission.nodeData[0].color = 'ffffff'

    agent
      .post('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(testMission)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(500)
        expect(response.error).to.not.equal(false)
        expect(response.ok).to.equal(false)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#fffffff") should result in an internal server error (500) response', function (done) {
    testMission.mission.nodeData[0].color = '#fffffff'

    agent
      .post('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(testMission)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(500)
        expect(response.error).to.not.equal(false)
        expect(response.ok).to.equal(false)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("white") should result in an internal server error (500) response', function (done) {
    testMission.mission.nodeData[0].color = 'white'

    agent
      .post('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(testMission)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(500)
        expect(response.error).to.not.equal(false)
        expect(response.ok).to.equal(false)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#white") should result in an internal server error (500) response', function (done) {
    testMission.mission.nodeData[0].color = '#white'

    agent
      .post('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(testMission)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(500)
        expect(response.error).to.not.equal(false)
        expect(response.ok).to.equal(false)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("asfjsdjkf #ffffff sadlkfsld") should result in an internal server error (500) response', function (done) {
    testMission.mission.nodeData[0].color = 'asfjsdjkf #ffffff sadlkfsld'

    agent
      .post('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(testMission)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(500)
        expect(response.error).to.not.equal(false)
        expect(response.ok).to.equal(false)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("asfjsdjkf#ffffffsadlkfsld") should result in an internal server error (500) response', function (done) {
    testMission.mission.nodeData[0].color = 'asfjsdjkf#ffffffsadlkfsld'

    agent
      .post('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(testMission)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(500)
        expect(response.error).to.not.equal(false)
        expect(response.ok).to.equal(false)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#6545169") should result in an internal server error (500) response', function (done) {
    testMission.mission.nodeData[0].color = '#6545169'

    agent
      .post('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(testMission)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(500)
        expect(response.error).to.not.equal(false)
        expect(response.ok).to.equal(false)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#abcdef99") should result in an internal server error (500) response', function (done) {
    testMission.mission.nodeData[0].color = '#abcdef99'

    agent
      .post('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(testMission)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(500)
        expect(response.error).to.not.equal(false)
        expect(response.ok).to.equal(false)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("abcdef") should result in an internal server error (500) response', function (done) {
    testMission.mission.nodeData[0].color = 'abcdef'

    agent
      .post('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(testMission)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(500)
        expect(response.error).to.not.equal(false)
        expect(response.ok).to.equal(false)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("fff") should result in an internal server error (500) response', function (done) {
    testMission.mission.nodeData[0].color = 'fff'

    agent
      .post('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(testMission)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(500)
        expect(response.error).to.not.equal(false)
        expect(response.ok).to.equal(false)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#fff") should result in an internal server error (500) response', function (done) {
    testMission.mission.nodeData[0].color = '#fff'

    agent
      .post('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(testMission)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(500)
        expect(response.error).to.not.equal(false)
        expect(response.ok).to.equal(false)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#*&@^%!") should result in an internal server error (500) response', function (done) {
    testMission.mission.nodeData[0].color = '#*&@^%!'

    agent
      .post('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(testMission)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(500)
        expect(response.error).to.not.equal(false)
        expect(response.ok).to.equal(false)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#+89496") should result in an internal server error (500) response', function (done) {
    testMission.mission.nodeData[0].color = '#+89496'

    agent
      .post('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(testMission)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(500)
        expect(response.error).to.not.equal(false)
        expect(response.ok).to.equal(false)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#89a96+") should result in an internal server error (500) response', function (done) {
    testMission.mission.nodeData[0].color = '#89a96+'

    agent
      .post('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(testMission)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(500)
        expect(response.error).to.not.equal(false)
        expect(response.ok).to.equal(false)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#8996+") should result in an internal server error (500) response', function (done) {
    testMission.mission.nodeData[0].color = '#8996+'

    agent
      .post('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(testMission)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(500)
        expect(response.error).to.not.equal(false)
        expect(response.ok).to.equal(false)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Creating a mission with a mission-node that has a color that is not a valid hex color code ("#896+") should result in an internal server error (500) response', function (done) {
    testMission.mission.nodeData[0].color = '#896+'

    agent
      .post('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(testMission)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(500)
        expect(response.error).to.not.equal(false)
        expect(response.ok).to.equal(false)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Creating a mission with a mission-node that has a color that is a valid hex color code ("#acde58") should result in a successful (200) response', function (done) {
    testMission.mission.nodeData[0].color = '#acde58'

    agent
      .post('/api/v1/missions/')
      .set('Content-Type', 'application/json')
      .send(testMission)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.error).to.equal(false)
        expect(response.ok).to.equal(true)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
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
          return expect(response.body.currentUser.role).to.equal(
            permittedUserRole,
          )
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
      user.password = await hashPassword(user.password)
    } catch (error) {
      testLogger.error(error)
    }

    try {
      let retreivedUser = await UserModel.create({ user }).exec()
      retreivedUser.should.have
        .property('userID')
        .equal(newCorrectUser.user.userID)
      retreivedUser.should.have
        .property('firstName')
        .equal(newCorrectUser.user.firstName)
      retreivedUser.should.have
        .property('lastName')
        .equal(newCorrectUser.user.lastName)

      hashedPassword = retreivedUser.password
      let isHashedPassword: boolean = hashedPasswordExpression.test(
        retreivedUser.password,
      )
      return expect(isHashedPassword).to.equal(true)
    } catch (error) {
      testLogger.error(error)
      return error
    }
  })

  it('Querying for the newly created user should return the correct user', async function () {
    try {
      let user = await UserModel.findOne({
        userID: newCorrectUser.user.userID,
      }).exec()

      user.should.have.property('userID').equal(newCorrectUser.user.userID)
      user.should.have
        .property('firstName')
        .equal(newCorrectUser.user.firstName)
      user.should.have.property('lastName').equal(newCorrectUser.user.lastName)
      let isHashedPassword: boolean = hashedPasswordExpression.test(
        user.password,
      )
      expect(isHashedPassword).to.equal(true)
      return expect(user.password).to.equal(hashedPassword)
    } catch (error) {
      testLogger.error(error)
      return error
    }
  })

  it('Updating a user should not hash the password again', async function () {
    try {
      let updatedUser = await UserModel.updateOne(
        {
          userID: newCorrectUser.user.userID,
        },
        { firstName: 'updatedFirstName', lastName: 'updatedLastName' },
      ).exec()

      updatedUser.should.have
        .property('userID')
        .equal(newCorrectUser.user.userID)
      updatedUser.should.have.property('firstName').equal('updatedFirstName')
      updatedUser.should.have.property('lastName').equal('updatedLastName')
      let isHashedPassword: boolean = hashedPasswordExpression.test(
        updatedUser.password,
      )
      expect(isHashedPassword).to.equal(true)
      return expect(updatedUser.password).to.equal(hashedPassword)
    } catch (error) {
      testLogger.error(error)
      return error
    }
  })

  it('Querying for the updated user should return the correct user', async function () {
    try {
      let user = await UserModel.findOne({
        userID: newCorrectUser.user.userID,
      }).exec()

      user.should.have.property('userID').equal(newCorrectUser.user.userID)
      user.should.have.property('firstName').equal('updatedFirstName')
      user.should.have.property('lastName').equal('updatedLastName')
      let isHashedPassword: boolean = hashedPasswordExpression.test(
        user.password,
      )
      expect(isHashedPassword).to.equal(true)
      return expect(user.password).to.equal(hashedPassword)
    } catch (error) {
      testLogger.error(error)
      return error
    }
  })
})

// Deletes all the data that was created from the tests.
after(async function () {
  // Deletes all missions in the test database
  await MissionModel.deleteMany({}).exec((error: any) => {
    if (error) {
      testLogger.error(error)
    }
  })

  // Deletes all users in the test database
  await UserModel.deleteMany({}).exec((error: any) => {
    if (error) {
      testLogger.error(error)
    }
  })

  try {
    let missions = await MissionModel.find({}).exec()
    missions.should.have.length(0)
  } catch (error) {
    testLogger.error(error)
    return error
  }

  try {
    let users = await UserModel.find({}).exec()
    return users.should.have.length(0)
  } catch (error) {
    testLogger.error(error)
    return error
  }
})
