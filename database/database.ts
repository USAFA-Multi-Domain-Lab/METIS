import mongoose from 'mongoose'
import { MONGO_HOST } from '../config'
import missionModel from './models/model-mission'
import userModel from './models/model-user'

let connection: mongoose.Connection

// This will ensure that the data that by
// default should be in the database exists.
export function ensureDefaultDataExists(): void {
  // Create admin user if it doesn't exist
  userModel.findOne({ userID: 'admin' }).exec((error: Error, user: any) => {
    if (user === null) {
      console.log('Admin user not found.')
      console.log('Creating admin user...')

      const adminUserData = {
        userID: 'admin',
        firstName: 'N/A',
        lastName: 'N/A',
        password: 'temppass',
      }

      //creates and saves user
      userModel.create(adminUserData, (error: Error, adminUser: any) => {
        if (error) {
          console.error('Failed to create admin user:')
          console.error(error)
        } else {
          console.log('Admin user created:', adminUser.userID)
        }
      })
    }
  })

  // Create incredible mission if it
  // doesn't exist.
  missionModel
    .findOne({ name: 'Incredible Mission' })
    .exec((error: Error, mission: any) => {
      if (mission === null) {
        console.log('"Incredible Mission" not found.')
        console.log('Creating "Incredible Mission"...')

        const incredibleMissionData = {
          name: 'Incredible Mission',
          versionNumber: 1,
          nodeStructure: {
            Apples: {
              Bananas: {
                Kiwi: {
                  END: 'END',
                },
              },
              Oranges: {
                Tomatoes: {
                  END: 'END',
                },
              },
            },
          },
          nodeData: [
            {
              name: 'Apples',
              preExecutionText: 'Apples has not been executed.',
              postExecutionSuccessText: 'Apples has been executed.',
              postExecutionFailureText: 'Apples has failed to execute.',
              actionData: 'exec command',
              successChance: 0.3,
              mapX: 0,
              mapY: -2,
            },
            {
              name: 'Bananas',
              preExecutionText: 'Bananas has not been executed.',
              postExecutionSuccessText: 'Bananas has been executed.',
              postExecutionFailureText: 'Bananas has failed to execute.',
              actionData: 'exec command',
              successChance: 0.3,
              mapX: -1,
              mapY: 0,
            },
            {
              name: 'Oranges',
              preExecutionText: 'Oranges has not been executed.',
              postExecutionSuccessText: 'Oranges has been executed.',
              postExecutionFailureText: 'Oranges has failed to execute.',
              actionData: 'exec command',
              successChance: 0.3,
              mapX: 1,
              mapY: 0,
            },
            {
              name: 'Kiwi',
              preExecutionText: 'Kiwi has not been executed.',
              postExecutionSuccessText: 'Kiwi has been executed.',
              postExecutionFailureText: 'Kiwi has failed to execute.',
              actionData: 'exec command',
              successChance: 0.3,
              mapX: -1,
              mapY: 2,
            },
            {
              name: 'Tomatoes',
              preExecutionText: 'Tomatoes has not been executed.',
              postExecutionSuccessText: 'Tomatoes has been executed.',
              postExecutionFailureText: 'Tomatoes has failed to execute.',
              actionData: 'exec command',
              successChance: 0.3,
              mapX: 1,
              mapY: 2,
            },
          ],
        }

        missionModel.create(
          incredibleMissionData,
          (error: Error, incredibleMission: any) => {
            if (error) {
              console.error('Failed to create "Incredible Mission":')
              console.error(error)
            } else {
              console.log(
                '"Incredible Mission" created:',
                incredibleMission.name,
              )
            }
          },
        )
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
