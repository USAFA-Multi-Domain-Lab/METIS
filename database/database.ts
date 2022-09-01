import mongoose from 'mongoose'
import { MONGO_HOST } from '../config'
import userModel from './models/model-user'

let connection: mongoose.Connection

// This will ensure that the data that by
// default should be in the database exists.
export function ensureDefaultDataExists(): void {
  userModel.findOne({ userID: 'admin' }).exec((error: Error, user: any) => {
    if (user === null) {
      console.log('Admin user not found.')
      console.log('Creating admin user...')

      const adminUser = {
        userID: 'admin',
        firstName: 'N/A',
        lastName: 'N/A',
        password: 'temppass',
      }

      //creates and saves user
      userModel.create(adminUser, (error: Error, user: any) => {
        if (error) {
          console.error('Failed to create admin user:')
          console.error(error)
        } else {
          console.log('Admin user created:', user.userID)
        }
      })
    }
  })
}

// This will initialize the database for
// use.
export function initialize() {
  mongoose.connect(MONGO_HOST)

  connection = mongoose.connection

  // database error handling
  connection.on(
    'error',
    console.error.bind(console, 'Failed connection to database: '),
  )

  // logs when server succesfully connects to database
  connection.once('open', () => {
    console.log('Connected to database.')
    ensureDefaultDataExists()
  })
}

// This will return the global connection
// variable that is set in initialize.
export function getConnection(): mongoose.Connection | null {
  return connection
}

export default {
  initialize,
  getConnection,
}
