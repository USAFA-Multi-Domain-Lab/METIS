// npm imports
import mocha from 'mocha'
import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'
import node from 'ts-node'
import mongoose from 'mongoose'

// file path (switches to the "mdl-test" database)
process.env.environmentFilePath = './environment-test.json'

// cesar imports
import { getConnection, initialize } from '../database/database'
import configure from '../config'

// fields
let connection: mongoose.Connection | null
const baseUrl = 'localhost:8080'
chai.use(chaiHttp)

// Unit test that makes sure there is a
// connection to the database
describe('Database Connection Tests', function () {
  before(function (done) {
    initialize(() => {
      connection = getConnection()
      done()
    })
  })

  it('should be connected to a database', function (done) {
    connection = getConnection()
    expect(connection?.readyState).to.equal(1)
    done()
  })

  it('should be connected to the "mdl-test" database', function (done) {
    expect(configure.MONGO_DB).to.equal('mdl-test')
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
})

// Tests for the import/export mission feature
describe('Export/Import Tests', function () {
  it('calling API should return a successful (200) response', function (done) {
    chai
      .request(baseUrl)
      .get('/')
      .end(function (err, res) {
        expect(res).to.have.status(200)
        done()
      })
  })
})
