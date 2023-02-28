// For this file to run properly the developer needs to
// run the scripts below first.
// ? 1.) "npm run serve-test"
// ? 2.) "npm run test"

// file path (switches to the "mdl-test" database)
process.env.environment = 'TEST'

process.argv

// npm imports
import mocha from 'mocha'
import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'
import node from 'ts-node'
import mongoose from 'mongoose'
import express from 'express'

// cesar imports
import { getConnection, initialize } from '../database/database'
import { configure } from '../config'

// global fields
let connection: mongoose.Connection | null
let server: any
let missionID: string
let MONGO_USERNAME: string | undefined = require('../config').MONGO_USERNAME
let MONGO_PASSWORD: string | undefined = require('../config').MONGO_PASSWORD
let MONGO_DB: string = require('../config').MONGO_DB
let PORT: string = require('../config').PORT
const baseUrl = `localhost:${PORT}`

// json
const userCredentials = {
  userID: 'admin',
  password: 'temppass',
}

// functions
const configureServer = (
  callback: () => void,
  callbackError: (error: Error) => void,
) => {
  const app = express()

  configure(
    app,
    () => {
      // route imports
      const indexRoute = require('../routes/routes-index')
      const usersApiRoute = require('../routes/api/v1/routes-users')
      const missionsApiRoute = require('../routes/api/v1/routes-missions')

      // sets the paths that routes load at
      app.use('/api/v1/users/', usersApiRoute)
      app.use('/api/v1/missions/', missionsApiRoute)
      app.use('*', indexRoute)

      // establishes server to listen at the given port
      server = app.listen(app.get('port'))

      callback()
    },
    (error) => {
      callbackError(error)
    },
  )
}

// ! Make sure you run "npm run serve-test" in
// ! the terminal before you run these tests

// Unit test that makes sure there is a
// connection to the database
describe('Database Connection Tests', function () {
  before(function (done) {
    initialize(() => {
      done()
    })
  })

  it('should be connected to a database', function (done) {
    connection = getConnection()
    expect(connection?.readyState).to.equal(1)
    done()
  })

  it('calling "connection.close()" should close the connection to the database', function (done) {
    connection = getConnection()
    connection?.close()
    connection?.once('close', function () {
      expect(connection?.readyState).to.equal(0)
      done()
    })
  })

  after(function (done) {
    if (
      MONGO_DB === 'mdl' ||
      MONGO_USERNAME === undefined ||
      MONGO_PASSWORD === undefined
    ) {
      console.log('Configure your "environment-test.json" file')
      connection = getConnection()
      connection?.close()
    }
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

  before(function (done) {
    // configureServer(
    //   () => {
    //     agent
    //       .post('/api/v1/users/login')
    //       .send(userCredentials)
    //       .then(function (response: ChaiHttp.Response) {
    //         expect(response).to.have.status(200)
    //         done()
    //       })
    //       .catch(function (error) {
    //         done(error)
    //       })
    //   },
    //   (error) => {
    //     done(error)
    //   },
    // )

    agent
      .get('/api/v1/missions/')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        missionID = response.body.missions[0].missionID
      })
      .catch(function (error) {
        console.error(error)
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
              done(error)
            })
        } else {
          done(
            'Database is not using "mdl-test." Please make sure the test database is running.',
          )
        }
      })
      .catch(function (error) {
        done(error)
      })
  })

  it('calling the missions API should return a successful (200) response', function (done) {
    agent
      .get('/api/v1/missions/')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        done()
      })
      .catch(function (error) {
        done(error)
      })
  })

  it('user should be logged in to access the import and/or export API', function (done) {
    agent
      .get('/api/v1/users/')
      .then(function (response: ChaiHttp.Response) {
        expect(response.body.currentUser).to.not.equal(null)
        done()
      })
      .catch(function (error) {
        done(error)
      })
  })

  it('calling export API should return a successful (200) response', function (done) {
    agent
      .get(
        `/api/v1/missions/export/Attack%20Mission.cesar?missionID=${missionID}`,
      )
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        done()
      })
      .catch(function (error) {
        done(error)
      })
  })

  it('calling the export API without a missionID as a query should return a bad request (400) response', function (done) {
    agent
      .get(`/api/v1/missions/export/`)
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(400)
        done()
      })
      .catch(function (error) {
        done(error)
      })
  })

  it('calling the import API with a valid file should have a "successfulImportCount" set to 1, "failedImportCount" set to 0, and an array called "failedImportErrorMessages" with a length of 0', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach('files', '/Users/jsthomas1288/Downloads/Valid Mission.cesar')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(1)
        expect(response.body.failedImportCount).to.equal(0)
        expect(response.body.failedImportErrorMessages.length).to.equal(0)
        done()
      })
      .catch(function (error) {
        done(error)
      })
  })

  it('calling the import API with an invalid file should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach('files', '/Users/jsthomas1288/Downloads/Invalid Mission.cesar')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
        done()
      })
      .catch(function (error) {
        done(error)
      })
  })

  it('calling the import API with a file that has valid contents, but an invalid extension should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach('files', '/Users/jsthomas1288/Downloads/Attack Mission.jpeg')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
        done()
      })
      .catch(function (error) {
        done(error)
      })
  })

  it('calling the import API with a file that has a syntax error should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach(
        'files',
        '/Users/jsthomas1288/Downloads/Syntax Error Mission.cesar',
      )
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
        done()
      })
      .catch(function (error) {
        done(error)
      })
  })

  it('calling the import API with a file that has an extra invalid property in the node data should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach(
        'files',
        '/Users/jsthomas1288/Downloads/Extra Invalid Property Mission.cesar',
      )
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
        done()
      })
      .catch(function (error) {
        done(error)
      })
  })

  it('calling the import API with a file that has extra data in the node data should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach('files', '/Users/jsthomas1288/Downloads/Extra Data Mission.cesar')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
        done()
      })
      .catch(function (error) {
        done(error)
      })
  })

  it('calling the import API with a multiple valid files should have a "successfulImportCount" set to 1, "failedImportCount" set to 0, and an array called "failedImportErrorMessages" with a length of 0', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach('files', '/Users/jsthomas1288/Downloads/Valid Mission.cesar')
      .attach('files', '/Users/jsthomas1288/Downloads/Valid Mission(1).cesar')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(2)
        expect(response.body.failedImportCount).to.equal(0)
        expect(response.body.failedImportErrorMessages.length).to.equal(0)
        done()
      })
      .catch(function (error) {
        done(error)
      })
  })

  it('calling the import API with one valid file and one invalid file should have a "successfulImportCount" set to 1, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach('files', '/Users/jsthomas1288/Downloads/Valid Mission.cesar')
      .attach('files', '/Users/jsthomas1288/Downloads/Invalid Mission.cesar')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(1)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
        done()
      })
      .catch(function (error) {
        done(error)
      })
  })

  it('calling the import API with a file that has an invalid extension (i.e., should be a .svg, .png, .pdf, etc. and is a .cesar instead) should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', function (done) {
    agent
      .post('/api/v1/missions/import/')
      .attach('files', '/Users/jsthomas1288/Downloads/bolt-solid.cesar')
      .then(function (response: ChaiHttp.Response) {
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
        done()
      })
      .catch(function (error) {
        done(error)
      })
  })

  after(function (done) {
    // // These are for when the server starts within this file
    // connection = getConnection()
    // connection?.close()
    // server.close()

    // deletes all missions (except the first two missions)
    // in the test database that were created from
    // and then it closes the server and ends the
    // session that was created in the before function
    agent
      .get('/api/v1/missions/')
      .then(function (response: ChaiHttp.Response) {
        let missionArray: Array<any> = response.body.missions

        for (let mission of missionArray) {
          missionID = mission.missionID
          if (
            missionID !== missionArray[0].missionID &&
            missionID !== missionArray[1].missionID
          ) {
            agent
              .delete(`/api/v1/missions?missionID=${missionID}`)
              .end(function (error, response: ChaiHttp.Response) {
                expect(response).to.have.status(200)
                expect(error).to.equal(null)
              })
          }
        }
        done()
      })
      .catch(function (error) {
        done(error)
      })
  })
})
