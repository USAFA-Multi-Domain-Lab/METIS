// npm imports
import mocha from 'mocha'
import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'
import node from 'ts-node'
import mongoose from 'mongoose'
import express, { Express } from 'express'

// file path (switches to the "mdl-test" database)
process.env.environment = 'TEST'

// cesar imports
import { getConnection, initialize } from '../database/database'
import configModule, { configure } from '../config'
import { Server } from 'http'

// global fields
let connection: mongoose.Connection | null
let app: Express
let server: Server
let MONGO_USERNAME: string | undefined = require('../config').MONGO_USERNAME
let MONGO_PASSWORD: string | undefined = require('../config').MONGO_PASSWORD
let MONGO_DB: string = require('../config').MONGO_DB
let PORT: number = require('../config').PORT

const baseUrl = 'localhost:8080'
chai.use(chaiHttp)
let agent: ChaiHttp.Agent = chai.request.agent(baseUrl)

const userCredentials = {
  userID: 'admin',
  password: 'temppass',
}

// functions
const configureServer = (done: mocha.Done) => {
  connection = getConnection()
  app = express()

  configure(app, () => {
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
  })
  return done()
}

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

// Tests for the import/export mission feature
describe('Export/Import Tests', function () {
  before(function (done) {
    configureServer(done)

    agent
      .post('/api/v1/users/login')
      .send(userCredentials)
      .then(function () {
        done()
      })
  })

  it('calling the missions API should return a successful (200) response', function (done) {
    agent.get('/api/v1/missions/').then(function (res) {
      expect(res).to.have.status(200)
    })
    done()
  })

  it('user should be logged in to access the export API', function (done) {
    agent.get('/api/v1/users/').then(function (request) {
      expect(request.body.currentUser).to.not.equal(null)
    })
    done()
  })

  it('calling export API should return a successful (200) response', function (done) {
    agent
      .get('/api/v1/missions/export/missionID=63d1b3a61df731ad224bebbf')
      .then(function (res) {
        expect(res).to.have.status(200)
      })
    done()
  })

  it('calling the export API without a missionID as a query should return a bad request (400) response', function (done) {
    agent.get(`/api/v1/missions/export/`).then(function (res) {
      expect(res).to.have.status(400)
    })
    done()
  })

  after(function (done) {
    connection = getConnection()
    connection?.close()
    agent.close()
    done()
  })
})
