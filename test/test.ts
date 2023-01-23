import mocha from 'mocha'
import chai from 'chai'
import node from 'ts-node'
import mongoose from 'mongoose'

process.env.environmentFilePath = './environment-test.json'

import { getConnection, initialize } from '../database/database'
import configure from '../config'

let expect = require('chai').expect
let connection: mongoose.Connection | null

// Unit test that makes sure there is a
// connection to the database
describe('Database Connection Test', function () {
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
