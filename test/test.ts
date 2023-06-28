// file path (switches to the "mdl-test" database)
process.env.environment = 'TEST'

process.argv

// npm imports
import mocha from 'mocha'
import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'

// metis imports
import { testLogger } from '../modules/logging'
import { commandScripts } from '../action-execution'
import { AnyObject } from '../modules/toolbox/objects'
import { startServer } from '../server'

// global fields
let missionID: string
let PORT: string = require('../config').PORT
const baseUrl = `localhost:${PORT}`

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
const permittedUserRole = 'admin'

before(function (done) {
  this.timeout(30000)

  startServer(() => {
    console.log('\n')
    done()
  })
})

// Tests for the export/import mission feature
describe('Export/Import File Tests', function () {
  chai.use(chaiHttp)

  // Creates a session with a user because
  // certain API routes require authentication
  // for access
  let agent: ChaiHttp.Agent = chai.request.agent(baseUrl)

  // Stores all the missions that get created
  // in this suite
  let initialMissionIDArray: Array<string> = []

  before(function (done) {
    agent
      .get('/api/v1/missions/')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        // This sets the missionID that is used as a parameter
        // within one of the tests of this suite.
        missionID = response.body.missions[0].missionID

        // Loops through the current missions and stores the current set
        // of mission's IDs that are stored in the database so that after
        // all the tests have run in this suite the missions that were
        // created from the tests can be deleted.
        // This is also an added security measure to help prevent
        // deleting missions if the tests somehow access the "mdl"
        // database instead of the "mdl-test" database.
        response.body.missions.forEach((mission: any) => {
          initialMissionIDArray.push(mission.missionID)
        })
      })
      .catch(function (error) {
        testLogger.error(error)
      })

    agent
      .get('/api/v1/missions/environment/')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.environment).to.equal(process.env.environment)

        if (response.body.environment === process.env.environment) {
          agent
            .post('/api/v1/users/login')
            .send(userCredentials)
            .then(function (response: ChaiHttp.Response) {
              expect(response).to.have.status(200)
              done()
            })
            .catch(function (error) {
              testLogger.error(error)
              done(error)
            })
        } else {
          testLogger.error(
            'Database is not using "mdl-test." Please make sure the test database is running.',
          )
          let error = new Error(
            'Database is not using "mdl-test." Please make sure the test database is running.',
          )
          done(error)
        }
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

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
      .get('/api/v1/users/')
      .then(function (response: ChaiHttp.Response) {
        expect(response.body.currentUser.role).to.equal(permittedUserRole)
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Calling export route on the API should return a successful (200) response', function (done) {
    agent
      .get(
        `/api/v1/missions/export/Attack%20Mission.cesar?missionID=${missionID}`,
      )
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

  after(function (done) {
    // deletes all missions (except the missions that were
    // in the database before the tests ran) in the test database
    // that were created from the tests and then it closes
    // the server and ends the session that was created in
    // the before function.
    agent
      .get('/api/v1/missions/')
      .then(function (response: ChaiHttp.Response) {
        let missionArray: Array<any> = response.body.missions

        for (let mission of missionArray) {
          if (!initialMissionIDArray.includes(mission.missionID)) {
            agent
              .delete(`/api/v1/missions?missionID=${mission.missionID}`)
              .end(function (error, response: ChaiHttp.Response) {
                expect(response).to.have.status(200)
                expect(error).to.equal(null)
              })
          }
        }
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
  chai.use(chaiHttp)

  // Creates a session with a user because
  // certain API routes require authentication
  // for access
  let agent: ChaiHttp.Agent = chai.request.agent(baseUrl)

  // Stores all the missions that are in the
  // database before the tests are run in this
  // suite
  let initialMissionIDArray: Array<string> = []

  // Stores all the missions that get created
  // in this suite
  let createdMissionIDArray: Array<string> = []

  before(function (done) {
    agent
      .get('/api/v1/missions/')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        // This sets the missionID that is used as a parameter
        // within one of the tests of this suite.
        missionID = response.body.missions[0].missionID

        // Loops through the current missions and stores the current set
        // of mission's IDs that are stored in the database so that after
        // all the tests have run in this suite the missions that were
        // created from the tests can be deleted.
        // This is also an added security measure to help prevent
        // deleting missions if the tests somehow access the "mdl"
        // database instead of the "mdl-test" database.
        response.body.missions.forEach((mission: any) => {
          initialMissionIDArray.push(mission.missionID)
        })
      })
      .catch(function (error) {
        testLogger.error(error)
      })

    agent
      .get('/api/v1/missions/environment/')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.environment).to.equal(process.env.environment)

        if (response.body.environment === process.env.environment) {
          agent
            .post('/api/v1/users/login')
            .send(userCredentials)
            .then(function (response: ChaiHttp.Response) {
              expect(response).to.have.status(200)
              done()
            })
            .catch(function (error) {
              testLogger.error(error)
              done(error)
            })
        } else {
          testLogger.error(
            'Database is not using "mdl-test." Please make sure the test database is running.',
          )
          let error = new Error(
            'Database is not using "mdl-test." Please make sure the test database is running.',
          )
          done(error)
        }
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('User should be logged in as an admin to be able to post missions to the database via the API', function (done) {
    agent
      .get('/api/v1/users/')
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

  it('Getting a mission where the "missionID" is not of type "objectId" in the query of the response should return a bad (400) response', function (done) {
    agent
      .get(`/api/v1/missions?missionID=${2}`)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(400)
        done()
      })
      .catch(function (error: Error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Getting a mission with all the correct properties in the query of the response should result in a successful (200) response', function (done) {
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

  it('Creating a mission with (a) missing property/properties in the body of the response should return a bad (400) response', function (done) {
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

  it('Creating a mission with all the correct properties in the body of the response should return a successful (200) response', function (done) {
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
    commandScripts['TestCommandScript'] = TestCommandScript

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

  it('Updating a mission with (a) missing property/properties that is required (missionID) in the body of the response should return a bad (400) response', function (done) {
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

  it('Updating a mission where the nodeStructure is defined, but the nodeData is undefined in the body of the response should return an internal server error (500) response', function (done) {
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

  it('Updating a mission where the nodeData is defined, but the nodeStructure is undefined in the body of the response should return an internal server error (500) response', function (done) {
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

  it('Updating a mission with all the correct properties in the body of the response should return a successful (200) response', function (done) {
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

  it('Copying a mission with (a) missing property/properties in the body of the response should return a bad (400) response', function (done) {
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

  it('Copying a mission with all the correct properties in the body of the response should return a successful (200) response', function (done) {
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

  it('Deleting a mission with (a) missing property/properties in the query of the response should return a bad (400) response', function (done) {
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

  it('Deleting a mission with all the correct properties in the query of the response should return a successful (200) response', function (done) {
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

  after(function (done) {
    // deletes all missions (except the missions that were
    // in the database before the tests ran) in the test database
    // that were created from the tests and then it closes
    // the server and ends the session that was created in
    // the before function.
    agent
      .get('/api/v1/missions/')
      .then(function (response: ChaiHttp.Response) {
        let missionArray: Array<any> = response.body.missions

        for (let mission of missionArray) {
          if (!initialMissionIDArray.includes(mission.missionID)) {
            agent
              .delete(`/api/v1/missions?missionID=${mission.missionID}`)
              .end(function (error, response: ChaiHttp.Response) {
                expect(response).to.have.status(200)
                expect(error).to.equal(null)
              })
          }
        }
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })
})

// Tests for the middleware function used to
// validate the data used in POST and PUT requests
describe('Request Body Validation', function () {
  chai.use(chaiHttp)

  // Creates a session with a user because
  // certain API routes require authentication
  // for access
  let agent: ChaiHttp.Agent = chai.request.agent(baseUrl)

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

  before(function (done) {
    agent
      .get('/api/v1/missions/environment/')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.environment).to.equal(process.env.environment)

        if (response.body.environment === process.env.environment) {
          done()
        } else {
          testLogger.error(
            'Database is not using "mdl-test." Please make sure the test database is running.',
          )
          throw new Error(
            'Database is not using "mdl-test." Please make sure the test database is running.',
          )
        }
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Sending a request with all required body keys and their correct types results in a successful (200) response', function (done) {
    agent
      .post('/api/v1/test/request-body-filter-check/')
      .set('Content-Type', 'application/json')
      .send({
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

  it('Sending a request with all required body keys and their types being incorrect results in a bad (400) response', function (done) {
    agent
      .post('/api/v1/test/request-body-filter-check/')
      .set('Content-Type', 'application/json')
      .send({
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

  it('Sending a request with a missing body key that is required results in a bad (400) request', function (done) {
    agent
      .post('/api/v1/test/request-body-filter-check/')
      .set('Content-Type', 'application/json')
      .send({
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

  it('Sending a request with a missing body key that is optional results in a successful (200) request', function (done) {
    agent
      .post('/api/v1/test/request-body-filter-check/')
      .set('Content-Type', 'application/json')
      .send({
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
})

// Tests for the middleware function used to
// validate the data used in GET and DELETE requests
describe('Request Query Validation', function () {
  chai.use(chaiHttp)

  // Creates a session with a user because
  // certain API routes require authentication
  // for access
  let agent: ChaiHttp.Agent = chai.request.agent(baseUrl)

  let string: string = 'string'
  let number: number = 3.5
  let integer: number = 3
  let boolean: boolean = true
  let objectId: string = '643ea778c10a4de66a9448d0'

  before(function (done) {
    agent
      .get('/api/v1/missions/environment/')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.environment).to.equal(process.env.environment)

        if (response.body.environment === process.env.environment) {
          done()
        } else {
          testLogger.error(
            'Database is not using "mdl-test." Please make sure the test database is running.',
          )
          throw new Error(
            'Database is not using "mdl-test." Please make sure the test database is running.',
          )
        }
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('Sending a request with all properties and their correct types results in a successful (200) response', function (done) {
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

  it('Sending a request with all properties and their types being incorrect results in a bad (400) response', function (done) {
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

  it('Sending a request with a missing property results in a bad (400) request', function (done) {
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
})

// Tests the schema validation functions that are
// used to validate data that is trying to be sent
// to the database to be stored.
describe('Mission Schema Validation', function () {
  chai.use(chaiHttp)

  // Creates a session with a user because
  // certain API routes require authentication
  // for access
  let agent: ChaiHttp.Agent = chai.request.agent(baseUrl)

  // Stores all the missions that are in the
  // database before the tests are run in this
  // suite
  let initialMissionIDArray: Array<string> = []

  before(function (done) {
    agent
      .get('/api/v1/missions/')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        // This sets the missionID that is used as a parameter
        // within one of the tests of this suite.
        missionID = response.body.missions[0].missionID

        // Loops through the current missions and stores the current set
        // of mission's IDs that are stored in the database so that after
        // all the tests have run in this suite the missions that were
        // created from the tests can be deleted.
        // This is also an added security measure to help prevent
        // deleting missions if the tests somehow access the "mdl"
        // database instead of the "mdl-test" database.
        response.body.missions.forEach((mission: any) => {
          initialMissionIDArray.push(mission.missionID)
        })
      })
      .catch(function (error) {
        testLogger.error(error)
      })

    agent
      .get('/api/v1/missions/environment/')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.environment).to.equal(process.env.environment)

        if (response.body.environment === process.env.environment) {
          agent
            .post('/api/v1/users/login')
            .send(userCredentials)
            .then(function (response: ChaiHttp.Response) {
              expect(response).to.have.status(200)
              done()
            })
            .catch(function (error) {
              testLogger.error(error)
              done(error)
            })
        } else {
          testLogger.error(
            'Database is not using "mdl-test." Please make sure the test database is running.',
          )
          let error = new Error(
            'Database is not using "mdl-test." Please make sure the test database is running.',
          )
          done(error)
        }
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })

  it('User should be logged in as an admin to be able to access certain API routes', function (done) {
    agent
      .get('/api/v1/users/')
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

  after(function (done) {
    // deletes all missions (except the missions that were
    // in the database before the tests ran) in the test database
    // that were created from the tests and then it closes
    // the server and ends the session that was created in
    // the before function.
    agent
      .get('/api/v1/missions/')
      .then(function (response: ChaiHttp.Response) {
        let missionArray: Array<any> = response.body.missions

        for (let mission of missionArray) {
          if (!initialMissionIDArray.includes(mission.missionID)) {
            agent
              .delete(`/api/v1/missions?missionID=${mission.missionID}`)
              .end(function (error, response: ChaiHttp.Response) {
                expect(response).to.have.status(200)
                expect(error).to.equal(null)
              })
          }
        }
        done()
      })
      .catch(function (error) {
        testLogger.error(error)
        done(error)
      })
  })
})
