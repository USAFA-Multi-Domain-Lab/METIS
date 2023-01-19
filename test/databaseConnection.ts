import mocha from 'mocha'
import chai from 'chai'
import node from 'ts-node'
import mongoose from 'mongoose'

let expect = require('chai').expect

// Unit test that makes sure there is a
// connection to the database
describe('databaseConnection', function () {
  let configure = require('../config')
  let connection: mongoose.Connection
  let MONGO_HOST: string = configure.MONGO_HOST
  let MONGO_PORT: number = configure.MONGO_PORT

  mongoose.connect(`mongodb://${MONGO_HOST}:${MONGO_PORT}/mdl`)

  connection = mongoose.connection

  it('should be connected to the database', function () {
    connection.once('connected', function () {
      expect(connection.readyState).to.equal(1)
      connection.close()
    })
  })
})
